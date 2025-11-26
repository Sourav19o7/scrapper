# How to Run the YouTube Persona Scraper

## Complete Step-by-Step Guide

This guide will help you scrape YouTube channels and create comprehensive datasets for AI persona training, including posts, ideology, financial decisions, and thought processes.

---

## Prerequisites

1. **Node.js** - Make sure you have Node.js installed (v14 or higher)
   ```bash
   node --version
   ```

2. **YouTube API Key** - Get a free API key from Google Cloud Console

---

## Step 1: Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**:
   - Click "Enable APIs and Services"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Click "Create Credentials" → "API Key"
   - Copy your API key
5. (Optional) Restrict your API key for security

---

## Step 2: Configure the Project

1. **Check your `.env` file** - It should have your YouTube API key:
   ```bash
   cat .env
   ```

   You should see:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

2. **Edit the scraping script** - Open `scrape_youtube.js` and modify:
   ```javascript
   const CHANNEL_HANDLE = '@financewithsharan'; // Your target channel
   const PERSONA_NAME = 'FinanceWithSharan';    // Name for AI persona
   const MAX_VIDEOS = 100;                       // How many videos to scrape
   ```

---

## Step 3: Run the Scraper

Execute the scraping script:

```bash
node scrape_youtube.js
```

### What Happens During Scraping:

1. **Connects to YouTube API** - Validates your API key
2. **Finds the channel** - Searches for the channel by handle
3. **Fetches video list** - Gets up to MAX_VIDEOS videos
4. **Downloads transcripts** - Extracts captions/transcripts for each video
5. **Analyzes content** - Extracts ideology, beliefs, and financial philosophy
6. **Generates datasets** - Creates multiple formats for AI training

### Expected Output:

```
============================================================
YouTube Channel Scraper for AI Persona Training
============================================================

Channel: @financewithsharan
Persona Name: FinanceWithSharan
Max Videos: 100

Starting scraping process...

=== Scraping youtube ===
Found channel: Finance With Sharan
Fetching up to 100 videos from channel...
Fetched 100 videos
Fetching transcripts for 100 videos...
Transcript progress: 10/100 (8 success, 2 failed)
...
Transcripts completed: 95/100 successful
Saving individual transcript files...
Saved 95 transcript files to transcripts directory
✓ youtube scraping completed

Processing 100 YouTube videos for training dataset
Exported training dataset to ./data/financewithsharan/training_dataset.json
Dataset contains 195 total items:
  - 100 posts
  - 95 monologues
  - 0 conversations
  - 45 ideology statements
  - 38 financial advice items
```

---

## Step 4: Review Generated Files

Navigate to your data directory:

```bash
cd data/financewithsharan/   # Or your persona name
ls -la
```

You should see these files:

### 1. Persona Profile Files

**persona_profile.json** - Structured JSON with:
- `ideology[]` - Core beliefs extracted from videos
- `beliefs[]` - Specific beliefs mentioned
- `values[]` - What they prioritize
- `financialPhilosophy[]` - Financial advice categorized by topic
- `decisionPatterns[]` - How they make decisions
- `topicExpertise[]` - Topics they cover
- `commonPhrases[]` - Signature phrases
- `communicationStyle` - Tone and style analysis

**persona_profile.md** - Human-readable summary
```bash
cat persona_profile.md
```

### 2. Training Dataset Files

**training_dataset.json** - Main dataset with:
```json
{
  "persona": "FinanceWithSharan",
  "version": "3.0",
  "posts": [
    {
      "id": "video_id",
      "title": "Video Title",
      "text": "Full transcript...",
      "description": "Video description",
      "metadata": {
        "publishedAt": "2024-01-01",
        "viewCount": "100000",
        "tags": ["finance", "investment"],
        ...
      }
    }
  ],
  "personaProfile": {
    "ideology": [...],
    "financialPhilosophy": [...],
    "decisionPatterns": [...],
    "values": [...],
    "commonPhrases": [...]
  }
}
```

**training_corpus.txt** - Plain text format:
```
### How to Invest in Mutual Funds

Full transcript text here...

---

### Budget Planning for Beginners

Full transcript text here...
```

**training_dataset.jsonl** - JSONL format for API training:
```json
{"prompt": "Speaking as FinanceWithSharan about \"How to Invest\":", "completion": "transcript..."}
{"prompt": "Speaking as FinanceWithSharan about \"Budget Planning\":", "completion": "transcript..."}
```

**training_conversations.json** - Chat model format

### 3. Raw Data

**youtube/youtube_data.json** - Complete scraped data
**youtube/transcripts/** - Individual transcript files
**raw/** - Backup copies

---

## Step 5: Understand the Dataset Structure

### What Gets Extracted:

#### 1. Posts (Complete Content)
- Full video transcripts
- Video titles and descriptions
- Publish dates and metadata
- View counts, likes, comments
- Tags and categories

#### 2. Ideology & Beliefs
Extracted automatically from phrases like:
- "I believe..."
- "In my opinion..."
- "You should..."
- "It's important to..."

Example:
```json
{
  "type": "belief",
  "statement": "I believe in long-term investing over short-term trading",
  "source": "Investment Basics Video"
}
```

#### 3. Financial Philosophy
Categorized by topic:
- **Investment Advice** - Stocks, mutual funds, SIP, portfolio
- **Budgeting** - Expense tracking, savings plans
- **Debt Management** - Loans, EMI, credit cards
- **Wealth Building** - Financial freedom, retirement
- **Risk Management** - Diversification, market risks
- **Tax Planning** - Tax saving, deductions
- **Insurance** - Health, term insurance
- **Emergency Planning** - Emergency funds, liquidity

Example:
```json
{
  "category": "investment_advice",
  "statement": "Invest in index funds for long-term wealth creation",
  "frequency": 15
}
```

#### 4. Decision Patterns
How they make recommendations:
```json
{
  "statement": "I recommend choosing low-cost index funds over actively managed funds",
  "context": "Mutual Fund Selection Guide"
}
```

#### 5. Values
What they consider important:
```json
{
  "statement": "Financial literacy is crucial for everyone",
  "source": "Financial Education Video"
}
```

#### 6. Common Phrases
Signature expressions:
```json
{
  "phrase": "long term wealth creation",
  "frequency": 23
}
```

---

## Step 6: Use the Dataset for AI Training

### Option A: Train with Plain Text (Simplest)

Use `training_corpus.txt`:

```python
# Example with any language model
with open('data/financewithsharan/training_corpus.txt', 'r') as f:
    training_text = f.read()

# Fine-tune your model with this text
# Works with GPT-2, GPT-3, LLaMA, etc.
```

### Option B: Train with Structured Data (Recommended)

Use `training_dataset.json`:

```python
import json

with open('data/financewithsharan/training_dataset.json', 'r') as f:
    dataset = json.load(f)

# Access posts with full context
for post in dataset['posts']:
    text = post['text']
    title = post['title']
    tags = post['metadata']['tags']

    # Train with context-aware approach

# Use persona profile for personality training
ideology = dataset['personaProfile']['ideology']
financial_philosophy = dataset['personaProfile']['financialPhilosophy']

# Train model to adopt these beliefs and patterns
```

### Option C: Train with JSONL (API-based)

Use `training_dataset.jsonl`:

```bash
# For OpenAI fine-tuning
openai api fine_tunes.create \
  -t training_dataset.jsonl \
  -m gpt-3.5-turbo

# Or use with other providers that support JSONL
```

### Option D: Build Custom Persona System

```python
# Load the complete persona profile
with open('data/financewithsharan/persona_profile.json', 'r') as f:
    persona = json.load(f)

# Build system prompt from profile
system_prompt = f"""
You are {persona_name}, a financial advisor.

Your core beliefs:
{'\n'.join([f"- {b['statement']}" for b in persona['ideology'][:10]])}

Your financial philosophy:
{'\n'.join([f"- {f['statement']}" for f in persona['financialPhilosophy'][:10]])}

Your communication style: {persona['communicationStyle']['tone']}

Common phrases you use:
{'\n'.join([f"- {p['phrase']}" for p in persona['commonPhrases'][:10]])}
"""

# Use this system prompt with any chat model
```

---

## Troubleshooting

### Error: "YouTube API key not configured"

**Solution**:
1. Check if `.env` file exists in project root
2. Make sure it contains `YOUTUBE_API_KEY=your_key`
3. Verify the API key is correct (no extra spaces)

### Error: "Quota exceeded"

**Solution**:
- YouTube API has 10,000 units/day free quota
- Each video costs ~5 units
- Reduce `MAX_VIDEOS` or wait 24 hours
- Or upgrade your quota in Google Cloud Console

### Error: "Could not fetch transcript"

**Solution**:
- Some videos don't have captions
- The scraper skips these automatically
- Check `transcriptStats` to see success rate
- Try a channel with better caption coverage

### Low transcript success rate

**Solution**:
- Choose channels that regularly use captions
- Professional channels usually have better captions
- Auto-generated captions work but may have errors

### No ideology or financial philosophy extracted

**Solution**:
- The channel might not discuss these topics
- Try a channel focused on finance/education
- Increase `MAX_VIDEOS` to get more content for analysis

---

## Advanced Configuration

### Scrape More Videos

```javascript
const MAX_VIDEOS = 200; // or null for all videos
```

### Include Comments (for conversational data)

```javascript
const options = {
  youtube: {
    maxVideos: 100,
    includeComments: true,  // Enable this
    maxComments: 50,        // Comments per video
  },
};
```

**Note**: Including comments uses significantly more API quota.

### Adjust Limits

Edit `src/config/config.js`:

```javascript
limits: {
  youtube: {
    maxVideos: 200,    // Default max
    maxComments: 100,  // Comments per video
  },
}
```

---

## API Quota Management

### Understanding Quota Costs:

- Channel info: 1 unit
- Video list (50 videos): 1 unit
- Video details (50 videos): 1 unit
- Comments (100 comments): 1 unit
- **Total for 100 videos**: ~5-10 units
- **Daily free limit**: 10,000 units
- **Can scrape**: ~1,000-2,000 videos/day

### Check Your Quota Usage:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Dashboard"
4. Click on "YouTube Data API v3"
5. View quota usage and limits

---

## Tips for Best Results

### 1. Choose the Right Channel
- Channels with 50+ videos
- Channels with consistent captions
- Channels focused on specific expertise

### 2. Start Small
- Test with 10-20 videos first
- Verify output quality
- Then scale to 100+

### 3. Review the Profile
- Check `persona_profile.md` for quality
- Ensure ideology and philosophy are captured
- Verify the tone matches the person

### 4. Multiple Channels
- Scrape multiple channels if needed
- Combine datasets for broader training
- Keep personas separate initially

---

## Next Steps After Scraping

1. **Review persona_profile.md**
   - Understand the person's ideology
   - Check if beliefs are accurately captured
   - Verify financial philosophy is relevant

2. **Examine training_dataset.json**
   - Check data quality
   - Verify transcripts are clean
   - Look at metadata completeness

3. **Choose Training Approach**
   - Decide on your AI framework
   - Select appropriate dataset format
   - Plan your training strategy

4. **Fine-tune Your Model**
   - Use the dataset with your chosen framework
   - Start with small epoch counts
   - Test and iterate

5. **Test the Persona**
   - Generate sample responses
   - Compare with original content
   - Refine as needed

---

## Support & Resources

- **Project Documentation**: See `README.md` and `USAGE.md`
- **YouTube API Docs**: https://developers.google.com/youtube/v3
- **API Quota Info**: https://console.cloud.google.com/

---

## Summary Commands

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Check .env file
cat .env

# 3. Edit configuration
nano scrape_youtube.js

# 4. Run scraper
node scrape_youtube.js

# 5. View results
cd data/financewithsharan/
cat persona_profile.md
```

Happy scraping and persona building! 🚀
