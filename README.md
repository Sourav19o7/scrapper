# Persona Scraper

A multi-platform web scraper for creating AI persona datasets from social media influencers and content creators. Supports YouTube, Instagram, Twitter/X, and more.

## Features

- **Multi-platform support**: YouTube, Instagram, Twitter/X
- **Ethical scraping**: Rate limiting, robots.txt compliance, API-first approach
- **Dataset organization**: Structured data output for ML training
- **Configurable**: Flexible configuration for different use cases
- **CLI interface**: Easy-to-use command-line interface

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your API credentials in `.env`:
   - YouTube: Get API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Twitter: Get credentials from [Twitter Developer Portal](https://developer.twitter.com/)
   - Instagram: Optional, for private API access

## Usage

### Basic Usage

```bash
# Scrape a YouTube channel
node src/cli.js scrape --platform youtube --handle @channelname

# Scrape an Instagram profile
node src/cli.js scrape --platform instagram --handle username

# Scrape a Twitter profile
node src/cli.js scrape --platform twitter --handle username
```

### Advanced Usage

```bash
# Scrape multiple platforms for a persona
node src/cli.js scrape-persona --name "InfluencerName" --youtube @channel --instagram username --twitter username

# Specify output directory
node src/cli.js scrape --platform youtube --handle @channel --output ./my-datasets
```

## Project Structure

```
scrapper/
├── src/
│   ├── scrapers/          # Platform-specific scrapers
│   │   ├── youtube.js
│   │   ├── instagram.js
│   │   └── twitter.js
│   ├── utils/             # Utility functions
│   │   ├── logger.js
│   │   ├── rateLimiter.js
│   │   └── dataOrganizer.js
│   ├── config/            # Configuration
│   │   └── config.js
│   ├── cli.js             # CLI interface
│   └── index.js           # Main entry point
├── data/                  # Output directory (created automatically)
├── .env                   # Environment variables
└── package.json
```

## Data Output Format

Each persona's data is organized as follows:

```
data/
└── PersonaName/
    ├── metadata.json      # Profile information
    ├── youtube/
    │   ├── videos.json    # Video metadata
    │   └── transcripts/   # Video transcripts
    ├── instagram/
    │   └── posts.json     # Post data
    └── twitter/
        └── tweets.json    # Tweet data
```

## Legal and Ethical Considerations

- **Respect Terms of Service**: Always comply with platform ToS
- **Rate Limiting**: Built-in delays to avoid overwhelming servers
- **API First**: Uses official APIs when available
- **Public Data Only**: Only scrapes publicly available content
- **Copyright**: Respect intellectual property rights
- **Attribution**: Maintain proper attribution in datasets

## API Setup Guides

### YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add to `.env`

### Twitter API
1. Apply for developer account at [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate API keys and tokens
4. Add to `.env`

### Instagram
Instagram scraping is challenging due to their restrictions. **Important notes:**

**Current Status**: Instagram now requires login for most content access, making automated scraping very difficult without authentication. The scraper will attempt to access public profiles, but may encounter login walls.

**Recommended Options:**
1. **Instagram Graph API** (Recommended for production):
   - Requires Facebook Developer account
   - Requires Instagram Business or Creator account
   - Provides official, reliable access
   - Setup: https://developers.facebook.com/docs/instagram-api/

2. **Manual Methods**:
   - Instagram's data download tool (Settings > Security > Download Data)
   - Third-party tools with explicit user consent

3. **Web Scraping** (Limited):
   - May work for some public profiles
   - Subject to frequent breakage
   - May trigger bot detection
   - Not recommended for production use

**Known Issues:**
- Instagram's anti-bot measures detect automated browsers
- Content may require login even for public profiles
- Frequent changes to page structure break selectors
- Rate limiting and IP blocking for suspicious activity

## License

MIT

## Disclaimer

This tool is for educational and research purposes. Users are responsible for:
- Complying with all applicable laws and regulations
- Respecting platform Terms of Service
- Obtaining necessary permissions
- Using data ethically and responsibly
