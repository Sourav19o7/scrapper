# Quick Start Guide

Get up and running with Persona Scraper in 5 minutes!

## Installation

```bash
# Install dependencies
npm install
```

## Basic Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add at least one API key to `.env`:**

   For YouTube (easiest to get):
   ```
   YOUTUBE_API_KEY=your_key_here
   ```

   Get it from [Google Cloud Console](https://console.cloud.google.com/) - it's free!

## Your First Scrape

### Example 1: Scrape a YouTube Channel

```bash
node src/cli.js scrape -p youtube -h @mkbhd
```

This will scrape up to 100 videos from the MKBHD YouTube channel.

### Example 2: Scrape a Twitter Profile

First, add your Twitter Bearer Token to `.env`:
```
TWITTER_BEARER_TOKEN=your_token_here
```

Then run:
```bash
node src/cli.js scrape -p twitter -h mkbhd
```

### Example 3: Scrape Multiple Platforms

```bash
node src/cli.js scrape-persona \
  -n "MKBHD" \
  -y @mkbhd \
  -t mkbhd \
  --quick
```

This creates a complete persona dataset from YouTube and Twitter!

## Understanding the Output

After scraping, check the `data/` directory:

```
data/
└── mkbhd/
    ├── metadata.json           # Overview
    ├── summary.json            # Statistics
    ├── training_dataset.json   # Ready for ML training!
    ├── youtube/
    │   └── youtube_data.json   # All YouTube data
    └── twitter/
        └── twitter_data.json   # All Twitter data
```

## View Your Data

```bash
# See the summary
cat data/mkbhd/summary.json

# See YouTube channel info
cat data/mkbhd/youtube/youtube_data.json | head -50

# Count tweets collected
cat data/mkbhd/twitter/twitter_data.json | grep '"id"' | wc -l
```

## CLI Commands Quick Reference

```bash
# Show all available commands
node src/cli.js --help

# Show example usage
node src/cli.js example

# List supported platforms
node src/cli.js platforms

# Scrape single platform
node src/cli.js scrape -p <platform> -h <handle>

# Scrape complete persona (quick mode)
node src/cli.js scrape-persona -n "Name" -y @yt -t tw --quick

# Scrape complete persona (deep mode with comments, likes, etc.)
node src/cli.js scrape-persona -n "Name" -y @yt -t tw --deep
```

## Common Use Cases

### 1. Research a Content Creator

```bash
# Scrape all their content
node src/cli.js scrape-persona \
  -n "Creator Name" \
  -y @youtube_handle \
  -i instagram_username \
  -t twitter_handle \
  --deep
```

### 2. Quick Content Analysis

```bash
# Get recent content only
node src/cli.js scrape -p youtube -h @channel --max-items 20
```

### 3. Build Training Dataset

```bash
# Deep scrape with all data
node src/cli.js scrape-persona \
  -n "PersonaName" \
  -y @channel \
  -t username \
  --deep

# The training_dataset.json is ready for ML!
```

## Using in Your Code

```javascript
import PersonaScraper from './src/index.js';

const scraper = new PersonaScraper();

// Scrape a YouTube channel
const youtubeData = await scraper.scrapePlatform('youtube', '@mkbhd', {
  maxVideos: 50,
  includeComments: true,
});

// Scrape multiple platforms
const personaData = await scraper.quickScrape('MKBHD', {
  youtube: '@mkbhd',
  twitter: 'mkbhd',
  instagram: 'mkbhd',
});

console.log('Data collected:', personaData);
```

## Tips for Success

1. **Start Small**: Begin with `--quick` mode and small limits
2. **Monitor Rate Limits**: YouTube has 10,000 units/day quota
3. **Be Patient**: Deep scrapes can take several minutes
4. **Check Logs**: Look at `logs/combined.log` if something fails
5. **Test First**: Try with well-known public accounts first

## Troubleshooting

### "API key not configured"
- Make sure `.env` file exists
- Check that API key is set correctly
- No quotes needed around the key

### "Channel not found"
- Try different format: `@channel` vs `channel`
- Verify the account is public
- Check spelling

### "Rate limit exceeded"
- YouTube: Wait 24 hours or request quota increase
- Twitter: Wait 15 minutes for rate limit reset
- Reduce `maxVideos` or `maxTweets`

### Installation errors
```bash
# Try clearing cache and reinstalling
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed API setup
- Check [examples/basic_usage.js](examples/basic_usage.js) for code examples
- See [examples/training_dataset_format.md](examples/training_dataset_format.md) for ML usage
- Read [README.md](README.md) for complete documentation

## Need Help?

- Check the logs: `cat logs/combined.log`
- Review error messages carefully
- Verify API credentials are correct
- Make sure accounts are public
- Test with simple examples first

## Example Workflow

```bash
# 1. Setup
npm install
cp .env.example .env
# Add your YouTube API key to .env

# 2. Test with a public channel
node src/cli.js scrape -p youtube -h @youtube --max-items 5

# 3. Scrape your target persona
node src/cli.js scrape-persona \
  -n "TechReviewer" \
  -y @mkbhd \
  -t mkbhd \
  --quick

# 4. Check the results
ls data/techreviewer/
cat data/techreviewer/summary.json

# 5. Use the training dataset
cat data/techreviewer/training_dataset.json
```

That's it! You're ready to start building AI persona datasets! 🚀
