# YouTube Persona Scraper - Usage Guide

## Quick Start

This scraper fetches videos from a YouTube channel and extracts transcripts to create a dataset for AI persona training.

### 1. Setup

Make sure your `.env` file has your YouTube API key:

```bash
YOUTUBE_API_KEY=your_api_key_here
```

Get your API key from: https://console.cloud.google.com/apis/credentials

### 2. Run the Scraper

```bash
node scrape_youtube.js
```

By default, it will scrape the `@mkbhd` channel. Edit the script to change the channel:

```javascript
const CHANNEL_HANDLE = '@your_channel_handle'; // Change this
const PERSONA_NAME = 'YourPersonaName'; // Change this
const MAX_VIDEOS = 50; // Or set to null for all videos
```

### 3. What Gets Created

After scraping, you'll find these files in `./data/your_persona_name/`:

#### Main Dataset Files

1. **training_dataset.json** - Complete structured dataset with:
   - `monologues[]` - Full video transcripts with metadata
   - `conversations[]` - Comments and conversational data
   - `metadata` - Statistics and platform info

2. **training_corpus.txt** - Plain text corpus of all transcripts
   - Perfect for simple language model fine-tuning
   - Each transcript separated by `---`

3. **training_dataset.jsonl** - JSONL format for OpenAI-style fine-tuning
   - Each line is a prompt-completion pair
   - Format: `{"prompt": "...", "completion": "..."}`

4. **training_conversations.json** - Conversational format for chat models
   - Each entry has role, content, context, and platform

#### Other Files

- **youtube/transcripts/** - Individual transcript files (one per video)
- **youtube/youtube_data.json** - Raw scraped data
- **metadata.json** - Scraping metadata
- **summary.json** - Summary of collected data

## Dataset Structure

### Monologues (YouTube Transcripts)

```json
{
  "id": "video_id",
  "platform": "youtube",
  "type": "video_transcript",
  "title": "Video Title",
  "text": "Full transcript text...",
  "metadata": {
    "publishedAt": "2024-01-01",
    "duration": "PT10M30S",
    "viewCount": "1000000",
    "tags": ["tech", "review"],
    "description": "Video description..."
  },
  "wordCount": 5000,
  "segmentCount": 250
}
```

### Why This Dataset Structure?

This dataset is optimized for creating AI personas because:

1. **Monologues** capture the speaking style, vocabulary, and thought patterns
2. **Metadata** provides context about topics, timing, and engagement
3. **Multiple formats** support different AI training frameworks:
   - JSON for structured training
   - Plain text for simple fine-tuning
   - JSONL for API-based training
   - Conversational format for chat models

## Training Your AI Persona

### Option 1: Fine-tune with Plain Text Corpus

Use `training_corpus.txt` for simple language model fine-tuning:

```python
# Example with Hugging Face Transformers
from transformers import GPT2LMHeadModel, GPT2Tokenizer, TextDataset, DataCollatorForLanguageModeling, Trainer, TrainingArguments

# Load your corpus
with open('data/your_persona/training_corpus.txt', 'r') as f:
    text = f.read()

# Fine-tune a model (GPT-2, LLaMA, etc.)
# ... your training code here
```

### Option 2: Use Structured JSON Dataset

Use `training_dataset.json` for more sophisticated training:

```python
import json

# Load structured dataset
with open('data/your_persona/training_dataset.json', 'r') as f:
    dataset = json.load(f)

# Access monologues with context
for monologue in dataset['monologues']:
    text = monologue['text']
    context = monologue['metadata']
    # Train with context awareness
```

### Option 3: OpenAI-style Fine-tuning

Use `training_dataset.jsonl` for OpenAI or similar APIs:

```bash
# Upload your dataset
# openai api fine_tunes.create -t training_dataset.jsonl -m gpt-3.5-turbo

# Or use with other providers that support JSONL format
```

## Advanced Usage

### Scrape Multiple Channels

```javascript
const channels = ['@mkbhd', '@LinusTechTips', '@MKBHD'];

for (const channel of channels) {
  const scraper = new PersonaScraper();
  await scraper.scrapePersona(
    `Tech_${channel}`,
    { youtube: channel },
    { youtube: { maxVideos: 30 } }
  );
}
```

### Include Comments for Conversational Data

```javascript
const options = {
  youtube: {
    maxVideos: 50,
    includeComments: true,  // Enable this
    maxComments: 50,        // Comments per video
  },
};
```

### Customize Dataset Export

Edit `src/utils/dataOrganizer.js` to customize:
- Add more metadata fields
- Change text preprocessing
- Add custom export formats

## Tips for Better Results

1. **More videos = better persona**
   - Aim for at least 50-100 videos
   - More content captures speech patterns better

2. **Choose videos with good transcripts**
   - Auto-generated captions may have errors
   - Channels with manual captions are better

3. **Quality over quantity**
   - Recent videos may be more representative
   - Filter by topic if needed

4. **Review the data**
   - Check `training_corpus.txt` to see if the style is captured
   - Look at word count and statistics in metadata

## Troubleshooting

### "YouTube API key not configured"
- Make sure `.env` file exists with `YOUTUBE_API_KEY=your_key`
- Get an API key from Google Cloud Console

### "Quota exceeded"
- YouTube API has daily quota limits (10,000 units/day)
- Each video costs ~5 units, so you can scrape ~2,000 videos/day
- Wait 24 hours or upgrade your quota

### "Could not fetch transcript"
- Some videos don't have captions enabled
- The scraper will skip these and continue
- Check `transcriptStats` to see success rate

### No transcripts found
- Channel may not have captions enabled
- Try a different channel
- Check if videos are available in your region

## Next Steps

After scraping:

1. Review the dataset files
2. Check quality of transcripts in `youtube/transcripts/`
3. Look at statistics in `training_dataset.json` metadata
4. Choose a training approach based on your AI framework
5. Fine-tune your model with the dataset
6. Test the persona and iterate

## Support

For issues or questions:
- Check the main README.md
- Review the code in `src/` directory
- Check YouTube API documentation

Happy training!
