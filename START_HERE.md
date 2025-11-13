# 🚀 Persona Scraper - Start Here!

Welcome to your multi-platform persona scraping system! This tool helps you create AI training datasets from social media influencers and content creators.

## 📋 What You Have

A complete, production-ready scraping system that supports:
- ✅ **YouTube** - Official API (channels, videos, comments)
- ✅ **Instagram** - Web scraping (profiles, posts)
- ✅ **Twitter/X** - Official API (tweets, likes, followers)
- ✅ **Dataset Organization** - ML-ready structured output
- ✅ **Rate Limiting** - Ethical, compliant scraping
- ✅ **CLI Interface** - Easy command-line usage

## 🎯 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Then edit `.env` and add at least one API key (YouTube is easiest):
```
YOUTUBE_API_KEY=your_key_here
```

### 3. Run Your First Scrape
```bash
node src/cli.js scrape -p youtube -h @youtube --max-items 5
```

### 4. Check Results
```bash
ls data/
```

**That's it! You're scraping! 🎉**

## 📚 Documentation

Start with these in order:

1. **[QUICKSTART.md](QUICKSTART.md)** ← Start here for fast setup
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** ← Detailed API setup for each platform
3. **[README.md](README.md)** ← Complete documentation
4. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** ← Understanding the codebase
5. **[examples/](examples/)** ← Code examples and ML dataset info

## 🎬 Example Usage

### Scrape a YouTube Channel
```bash
node src/cli.js scrape -p youtube -h @mkbhd
```

### Scrape Multiple Platforms
```bash
node src/cli.js scrape-persona \
  -n "TechReviewer" \
  -y @mkbhd \
  -t mkbhd \
  --quick
```

### Use in Your Code
```javascript
import PersonaScraper from './src/index.js';

const scraper = new PersonaScraper();
const data = await scraper.quickScrape('MKBHD', {
  youtube: '@mkbhd',
  twitter: 'mkbhd',
});
```

## 📂 What Gets Created

After scraping, your data is organized like this:

```
data/persona_name/
├── training_dataset.json  ← Use this for ML training!
├── metadata.json          ← Overview of the persona
├── youtube/               ← YouTube data
├── twitter/               ← Twitter data
└── instagram/             ← Instagram data
```

## 🔑 Getting API Keys

### YouTube (Free, Easy)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable YouTube Data API v3
3. Create API Key
4. Add to `.env`

### Twitter (Free, Takes 1-2 days)
1. Apply at [Twitter Developer Portal](https://developer.twitter.com/)
2. Wait for approval (usually quick)
3. Create app → Get Bearer Token
4. Add to `.env`

### Instagram (No API Key Needed!)
- Uses web scraping (works out of the box)
- For production, consider Instagram Graph API

## 💡 Common Commands

```bash
# Show help
node src/cli.js --help

# Show examples
node src/cli.js example

# List platforms
node src/cli.js platforms

# Scrape with limits
node src/cli.js scrape -p youtube -h @channel --max-items 20

# Deep scrape (more data)
node src/cli.js scrape-persona -n "Name" -y @yt -t tw --deep
```

## 🎓 Learning Path

1. **Beginner**: Run the quick start examples above
2. **Intermediate**: Read [examples/basic_usage.js](examples/basic_usage.js)
3. **Advanced**: Study [examples/training_dataset_format.md](examples/training_dataset_format.md)
4. **Expert**: Extend the scrapers for your needs

## 🛠️ Features

### What It Does
- ✅ Scrapes public social media data
- ✅ Organizes into structured datasets
- ✅ Exports ML-ready training data
- ✅ Handles rate limiting automatically
- ✅ Logs everything for debugging
- ✅ Backs up raw data

### What Makes It Special
- 🚀 Multi-platform support
- 🔒 Ethical & compliant
- 📊 ML-ready output
- ⚡ Fast & efficient
- 📝 Well documented
- 🎯 Production ready

## 🎯 Use Cases

1. **AI Persona Training**
   - Collect influencer content
   - Train AI to mimic writing style
   - Create chatbots with personality

2. **Content Analysis**
   - Analyze posting patterns
   - Study engagement metrics
   - Research content strategies

3. **Dataset Creation**
   - Build training corpora
   - Create benchmarks
   - Research datasets

## ⚠️ Important Notes

### Legal & Ethical
- ✅ Only scrapes PUBLIC data
- ✅ Respects rate limits
- ✅ Uses official APIs when possible
- ⚠️ YOU are responsible for ToS compliance
- ⚠️ Get consent when required by law
- ⚠️ Use ethically and responsibly

### Technical
- YouTube: 10,000 API units/day (free tier)
- Twitter: Rate limits vary by endpoint
- Instagram: Be gentle (anti-bot measures)
- Data: Can be large (GB), plan storage

## 🐛 Troubleshooting

### "API key not configured"
→ Create `.env` file and add your API key

### "Channel not found"
→ Try different format: `@channel` or just `channel`

### "Rate limit exceeded"
→ Wait for reset or reduce limits

### Puppeteer errors
→ Install Chrome/Chromium: `brew install chromium`

## 📞 Need Help?

1. Check the logs: `cat logs/combined.log`
2. Read [QUICKSTART.md](QUICKSTART.md) for common issues
3. Review [SETUP_GUIDE.md](SETUP_GUIDE.md) for API setup
4. Check error messages carefully

## 🚀 Next Steps

Choose your path:

**Just Want to Scrape?**
→ Follow the Quick Start above, then read [QUICKSTART.md](QUICKSTART.md)

**Need API Setup?**
→ Read [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Building ML Models?**
→ Check [examples/training_dataset_format.md](examples/training_dataset_format.md)

**Want to Code?**
→ See [examples/basic_usage.js](examples/basic_usage.js)

**Understanding the System?**
→ Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 🎉 You're All Set!

You now have a powerful, production-ready persona scraping system. Start small, test with public accounts, and gradually scale up.

**Happy Scraping! 🚀**

---

Built for creating AI persona datasets ethically and responsibly.
