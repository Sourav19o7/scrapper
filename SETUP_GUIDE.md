# Setup Guide

This guide will help you set up the Persona Scraper with all necessary API credentials.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### 3. Set Up API Credentials

#### YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API key"
   - Copy the API key
5. Add to `.env`:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```

**Important:** YouTube Data API has a quota of 10,000 units per day. Each request consumes units, so monitor your usage.

#### Twitter API v2

1. Apply for a Twitter Developer Account:
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Sign in with your Twitter account
   - Apply for a developer account (may take a few days for approval)

2. Create a new app:
   - Go to the Developer Portal
   - Click "Create Project" and "Create App"
   - Fill in the required information

3. Generate credentials:
   - In your app settings, go to "Keys and Tokens"
   - Generate API Key and Secret
   - Generate Bearer Token
   - Generate Access Token and Secret (if you need user authentication)

4. Add to `.env`:
   ```
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   ```

**Note:** For basic scraping, you only need the Bearer Token. The other credentials are for advanced features.

#### Instagram (Optional)

Instagram scraping is challenging due to their restrictions. We provide two options:

**Option 1: Web Scraping (No API Key Required)**
- Works for public profiles
- Uses Puppeteer to scrape publicly available data
- No setup required, but limited data access
- May be unreliable due to Instagram's anti-bot measures

**Option 2: Instagram Graph API (Recommended for Production)**
1. Set up a Facebook Developer account
2. Create a Facebook App
3. Add Instagram Graph API product
4. Connect an Instagram Business Account
5. Generate an access token

Note: This requires the Instagram account to be a Business account connected to a Facebook Page.

## Verification

Test your setup:

```bash
# Test YouTube
node src/cli.js scrape -p youtube -h @youtube

# Test Twitter
node src/cli.js scrape -p twitter -h twitter

# Test Instagram (no API key required)
node src/cli.js scrape -p instagram -h instagram
```

## Rate Limits and Best Practices

### YouTube
- Daily quota: 10,000 units
- A typical search costs 100 units
- Getting video details costs 1 unit per video
- Monitor usage in Google Cloud Console

### Twitter
- Free tier: 500,000 tweets per month (read)
- Rate limits vary by endpoint
- The scraper includes built-in rate limiting

### Instagram
- Web scraping: No official limits, but be respectful
- Recommended delay: 3-5 seconds between requests
- Avoid scraping large amounts of data in short time
- Consider using Graph API for production use

## Troubleshooting

### "API key not configured"
- Check that your `.env` file exists in the project root
- Verify the API key is correctly copied
- Make sure there are no extra spaces or quotes

### "Rate limit exceeded"
- YouTube: Wait 24 hours for quota reset or request quota increase
- Twitter: Wait for the rate limit window to reset (typically 15 minutes)
- Instagram: Increase the delay between requests

### "Channel/User not found"
- Verify the handle or username is correct
- Remove special characters (use @username or just username)
- Check if the profile is public

### Puppeteer installation issues
If Puppeteer fails to install or run:

```bash
# macOS
brew install chromium

# Linux
sudo apt-get install chromium-browser

# Then set the path in code or use system Chrome
```

## Security Notes

- **Never commit your `.env` file** - it contains sensitive credentials
- Keep API keys secure and don't share them
- Rotate keys if you suspect they've been compromised
- Use environment-specific keys for development and production
- Consider using a secrets manager for production deployments

## Legal Compliance

- Always respect platform Terms of Service
- Only scrape public data
- Implement proper rate limiting
- Include attribution in your datasets
- Get consent when required by law (GDPR, CCPA)
- Use data ethically and responsibly

## Next Steps

Once setup is complete, proceed to [README.md](README.md) for usage instructions.
