# Training Dataset Format

This document describes the output format of the scraped data and how to use it for training AI models.

## Directory Structure

After scraping a persona, the data is organized as follows:

```
data/
└── persona_name/
    ├── metadata.json              # Overview of the persona and scraping session
    ├── summary.json               # Summary of collected data
    ├── training_dataset.json      # Aggregated dataset for ML training
    ├── youtube/
    │   └── youtube_data.json      # All YouTube data
    ├── instagram/
    │   └── instagram_data.json    # All Instagram data
    ├── twitter/
    │   └── twitter_data.json      # All Twitter data
    └── raw/                       # Raw backup data
        ├── youtube_raw_data.json
        ├── instagram_raw_data.json
        └── twitter_raw_data.json
```

## File Formats

### metadata.json

Contains high-level information about the persona:

```json
{
  "personaName": "TechReviewer",
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "platforms": {
    "youtube": {
      "handle": "@mkbhd",
      "scrapedAt": "2024-01-15T10:30:00.000Z",
      "dataPoints": 50
    },
    "twitter": {
      "handle": "mkbhd",
      "scrapedAt": "2024-01-15T10:35:00.000Z",
      "dataPoints": 100
    }
  }
}
```

### training_dataset.json

Aggregated dataset ready for ML training:

```json
{
  "persona": "TechReviewer",
  "exportedAt": "2024-01-15T10:40:00.000Z",
  "content": [
    {
      "platform": "youtube",
      "source": "youtube_data.json",
      "data": {
        "platform": "youtube",
        "channel": { ... },
        "videos": [ ... ]
      }
    },
    {
      "platform": "twitter",
      "source": "twitter_data.json",
      "data": {
        "platform": "twitter",
        "user": { ... },
        "tweets": [ ... ]
      }
    }
  ]
}
```

## Platform-Specific Formats

### YouTube Data

```json
{
  "platform": "youtube",
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "channel": {
    "id": "UCBJycsmduvYEL83R_U4JriQ",
    "title": "MKBHD",
    "description": "Channel description...",
    "statistics": {
      "viewCount": "1000000000",
      "subscriberCount": "15000000",
      "videoCount": "1500"
    }
  },
  "videos": [
    {
      "videoId": "abc123",
      "title": "Video title",
      "description": "Video description...",
      "publishedAt": "2024-01-10T12:00:00Z",
      "tags": ["tech", "review"],
      "statistics": {
        "viewCount": "500000",
        "likeCount": "50000",
        "commentCount": "2000"
      },
      "comments": [
        {
          "commentId": "xyz789",
          "text": "Great video!",
          "author": "User123",
          "likeCount": "100"
        }
      ]
    }
  ]
}
```

### Twitter Data

```json
{
  "platform": "twitter",
  "scrapedAt": "2024-01-15T10:35:00.000Z",
  "user": {
    "id": "12345",
    "username": "mkbhd",
    "name": "Marques Brownlee",
    "description": "Tech reviewer...",
    "metrics": {
      "followers_count": 5000000,
      "following_count": 1000,
      "tweet_count": 50000
    }
  },
  "tweets": [
    {
      "id": "tweet123",
      "text": "Just reviewed the latest...",
      "created_at": "2024-01-14T15:00:00Z",
      "public_metrics": {
        "retweet_count": 500,
        "reply_count": 100,
        "like_count": 5000
      }
    }
  ]
}
```

### Instagram Data

```json
{
  "platform": "instagram",
  "scrapedAt": "2024-01-15T10:38:00.000Z",
  "profile": {
    "username": "mkbhd",
    "profileData": {
      "title": "MKBHD (@mkbhd) • Instagram",
      "description": "5M followers, 500 posts"
    }
  },
  "posts": [
    {
      "url": "https://www.instagram.com/p/abc123/",
      "shortcode": "abc123",
      "thumbnail": "https://...",
      "alt": "Post description",
      "details": {
        "caption": "Check out this...",
        "image": "https://..."
      }
    }
  ]
}
```

## Using the Dataset for AI Training

### 1. Text Generation Models (GPT, etc.)

Extract all text content for fine-tuning:

```javascript
import fs from 'fs';

const dataset = JSON.parse(fs.readFileSync('data/persona_name/training_dataset.json', 'utf-8'));

const textCorpus = [];

for (const content of dataset.content) {
  if (content.platform === 'youtube') {
    // Add video titles and descriptions
    content.data.videos.forEach(video => {
      textCorpus.push(video.title);
      textCorpus.push(video.description);
    });
  } else if (content.platform === 'twitter') {
    // Add tweets
    content.data.tweets.forEach(tweet => {
      textCorpus.push(tweet.text);
    });
  }
}

// Save for training
fs.writeFileSync('training_corpus.txt', textCorpus.join('\n\n'));
```

### 2. Persona Analysis

Extract personality traits and patterns:

```javascript
const analysis = {
  writingStyle: extractWritingStyle(dataset),
  topics: extractTopics(dataset),
  engagement: analyzeEngagement(dataset),
  postingFrequency: analyzeFrequency(dataset),
};
```

### 3. Fine-tuning Format (JSONL)

Convert to JSONL format for model fine-tuning:

```javascript
const trainingExamples = [];

// YouTube videos as Q&A pairs
dataset.content.forEach(content => {
  if (content.platform === 'youtube') {
    content.data.videos.forEach(video => {
      trainingExamples.push({
        prompt: `Create a video about: ${video.title}`,
        completion: video.description,
      });
    });
  }
});

// Save as JSONL
const jsonl = trainingExamples.map(ex => JSON.stringify(ex)).join('\n');
fs.writeFileSync('training_data.jsonl', jsonl);
```

### 4. Embedding Generation

Generate embeddings for semantic search:

```javascript
import { OpenAI } from 'openai';

const openai = new OpenAI();

async function generateEmbeddings(texts) {
  const embeddings = [];

  for (const text of texts) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    embeddings.push(response.data[0].embedding);
  }

  return embeddings;
}
```

## Best Practices

1. **Data Cleaning**: Remove duplicates, filter out noise
2. **Preprocessing**: Normalize text, remove URLs/mentions if needed
3. **Augmentation**: Consider data augmentation techniques
4. **Validation Split**: Keep 10-20% for validation
5. **Metadata**: Include timestamps and engagement metrics
6. **Privacy**: Remove personal information if required
7. **Attribution**: Keep track of original sources

## Example Training Pipeline

```javascript
import PersonaScraper from '../src/index.js';
import { preprocessData, splitDataset, trainModel } from './ml_utils.js';

async function createPersonaModel(personaName, platforms) {
  // 1. Scrape data
  const scraper = new PersonaScraper();
  const data = await scraper.deepScrape(personaName, platforms);

  // 2. Preprocess
  const cleanData = preprocessData(data);

  // 3. Split dataset
  const { train, validation } = splitDataset(cleanData, 0.8);

  // 4. Train model
  const model = await trainModel(train, validation);

  // 5. Save model
  await model.save(`models/${personaName}`);

  return model;
}
```

## Supported ML Frameworks

This dataset format works well with:

- **OpenAI GPT Fine-tuning**: Convert to JSONL format
- **Hugging Face Transformers**: Use as text dataset
- **LangChain**: Load as document source
- **Custom Models**: Parse JSON and extract features

## Next Steps

- See [basic_usage.js](basic_usage.js) for scraping examples
- Implement your own preprocessing pipeline
- Experiment with different model architectures
- Monitor model performance and iterate
