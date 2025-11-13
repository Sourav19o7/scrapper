# Project Structure

```
scrapper/
│
├── src/                           # Source code
│   ├── config/
│   │   └── config.js              # Configuration management
│   │
│   ├── scrapers/                  # Platform-specific scrapers
│   │   ├── youtube.js             # YouTube Data API v3 scraper
│   │   ├── instagram.js           # Instagram web scraper
│   │   └── twitter.js             # Twitter API v2 scraper
│   │
│   ├── utils/                     # Utility modules
│   │   ├── logger.js              # Winston logger
│   │   ├── rateLimiter.js         # Rate limiting with p-queue
│   │   └── dataOrganizer.js       # Dataset organization & export
│   │
│   ├── index.js                   # Main PersonaScraper class
│   └── cli.js                     # Command-line interface
│
├── examples/                      # Usage examples
│   ├── basic_usage.js             # JavaScript examples
│   └── training_dataset_format.md # ML dataset documentation
│
├── data/                          # Output directory (created on first run)
│   └── [persona_name]/            # One folder per persona
│       ├── metadata.json          # Persona overview
│       ├── summary.json           # Scraping statistics
│       ├── training_dataset.json  # ML-ready aggregated dataset
│       ├── youtube/               # YouTube data
│       ├── instagram/             # Instagram data
│       ├── twitter/               # Twitter data
│       └── raw/                   # Raw backup data
│
├── logs/                          # Log files (created on first run)
│   ├── combined.log               # All logs
│   └── error.log                  # Error logs only
│
├── package.json                   # Node.js dependencies
├── .env                           # Environment variables (you create this)
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
│
├── README.md                      # Main documentation
├── QUICKSTART.md                  # Quick start guide
├── SETUP_GUIDE.md                 # Detailed setup instructions
└── PROJECT_STRUCTURE.md           # This file
```

## Key Files Explained

### Core Application

| File | Purpose |
|------|---------|
| `src/index.js` | Main orchestrator - coordinates scraping across platforms |
| `src/cli.js` | Command-line interface for easy usage |
| `src/config/config.js` | Centralized configuration and environment variables |

### Scrapers

| File | Platform | API Used |
|------|----------|----------|
| `src/scrapers/youtube.js` | YouTube | YouTube Data API v3 (Official) |
| `src/scrapers/instagram.js` | Instagram | Puppeteer web scraping |
| `src/scrapers/twitter.js` | Twitter/X | Twitter API v2 (Official) |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/logger.js` | Logging with Winston (console + file) |
| `src/utils/rateLimiter.js` | Rate limiting to respect API quotas |
| `src/utils/dataOrganizer.js` | Organizes scraped data into structured format |

### Documentation

| File | Content |
|------|---------|
| `README.md` | Overview, features, usage, legal info |
| `QUICKSTART.md` | Get started in 5 minutes |
| `SETUP_GUIDE.md` | Detailed API setup for each platform |
| `PROJECT_STRUCTURE.md` | This file - project organization |
| `examples/training_dataset_format.md` | ML dataset format guide |

## Data Flow

```
1. User Input (CLI or Code)
   │
   ↓
2. PersonaScraper (src/index.js)
   │
   ├─→ YouTubeScraper → YouTube API
   ├─→ InstagramScraper → Puppeteer → Web
   └─→ TwitterScraper → Twitter API
   │
   ↓
3. RateLimiter (controls request flow)
   │
   ↓
4. Raw Data Collection
   │
   ↓
5. DataOrganizer
   ├─→ Structured JSON files
   ├─→ Platform-specific folders
   └─→ training_dataset.json
   │
   ↓
6. Output (data/persona_name/)
```

## Module Dependencies

```
index.js (PersonaScraper)
├── scrapers/
│   ├── youtube.js
│   │   ├── googleapis
│   │   ├── config.js
│   │   ├── logger.js
│   │   └── rateLimiter.js
│   │
│   ├── instagram.js
│   │   ├── puppeteer
│   │   ├── config.js
│   │   ├── logger.js
│   │   └── rateLimiter.js
│   │
│   └── twitter.js
│       ├── twitter-api-v2
│       ├── config.js
│       ├── logger.js
│       └── rateLimiter.js
│
└── utils/
    ├── dataOrganizer.js
    │   ├── fs/promises
    │   ├── config.js
    │   └── logger.js
    │
    ├── logger.js
    │   └── winston
    │
    └── rateLimiter.js
        └── p-queue
```

## NPM Dependencies

### Production Dependencies
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `puppeteer` - Headless browser for web scraping
- `dotenv` - Environment variable management
- `commander` - CLI framework
- `p-queue` - Promise queue for rate limiting
- `winston` - Logging framework
- `googleapis` - YouTube Data API
- `twitter-api-v2` - Twitter API client
- `instagram-private-api` - Instagram API (optional)

### Development Dependencies
- `eslint` - Code linting

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Your actual API keys (never commit!) |
| `.env.example` | Template for environment variables |
| `package.json` | NPM package configuration |
| `.gitignore` | Files to exclude from git |

## Output Data Structure

After scraping, each persona gets organized like this:

```
data/persona_name/
├── metadata.json              # Who, when, where
├── summary.json               # Statistics & overview
├── training_dataset.json      # Aggregated ML-ready data
│
├── youtube/
│   └── youtube_data.json      # Channel, videos, comments
│
├── instagram/
│   └── instagram_data.json    # Profile, posts
│
├── twitter/
│   └── twitter_data.json      # User, tweets, likes
│
└── raw/                       # Backup copies
    ├── youtube_raw_data.json
    ├── instagram_raw_data.json
    └── twitter_raw_data.json
```

## Key Features by Component

### YouTube Scraper
- ✅ Channel information & statistics
- ✅ Video metadata (title, description, tags)
- ✅ Video statistics (views, likes, comments)
- ✅ Comment collection (optional)
- ✅ Rate limiting & quota management
- ⚠️ Transcripts (requires additional setup)

### Instagram Scraper
- ✅ Public profile information
- ✅ Post collection with thumbnails
- ✅ Post details (captions, images)
- ✅ Headless browser scraping
- ⚠️ Limited by anti-bot measures
- 💡 Graph API support (requires setup)

### Twitter Scraper
- ✅ User profile & statistics
- ✅ Tweet collection
- ✅ Tweet metrics (likes, retweets)
- ✅ Liked tweets (optional)
- ✅ Follower list (optional)
- ✅ Content analysis utilities

### Data Organizer
- ✅ Structured directory creation
- ✅ JSON file management
- ✅ Metadata generation
- ✅ Summary statistics
- ✅ ML training dataset export
- ✅ Raw data backup

## Extending the Project

### Adding a New Platform

1. Create `src/scrapers/newplatform.js`
2. Implement the scraper class
3. Add to `src/index.js` in `scrapePlatform()` method
4. Update CLI in `src/cli.js`
5. Add configuration to `src/config/config.js`
6. Update documentation

### Adding New Features

- **Custom analyzers**: Add to `src/utils/`
- **New export formats**: Extend `DataOrganizer`
- **Additional metrics**: Modify scraper classes
- **Pre-processing**: Add to data pipeline

## Best Practices

1. **Always configure `.env`** before running
2. **Start with small limits** to test
3. **Monitor rate limits** in console/logs
4. **Check `logs/` directory** for errors
5. **Backup data** before experiments
6. **Respect ToS** of each platform

## Getting Help

- Check logs: `cat logs/combined.log`
- Read documentation: Start with [QUICKSTART.md](QUICKSTART.md)
- Example code: See [examples/basic_usage.js](examples/basic_usage.js)
- API setup: Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

Last updated: 2024
