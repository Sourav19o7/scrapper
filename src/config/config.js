import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const config = {
  // API Keys
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
  instagram: {
    username: process.env.INSTAGRAM_USERNAME || '',
    password: process.env.INSTAGRAM_PASSWORD || '',
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },

  // General Settings
  dataOutputDir: process.env.DATA_OUTPUT_DIR || './data',
  rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 2000,
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 3,
  logLevel: process.env.LOG_LEVEL || 'info',

  // Scraping Limits (for ethical scraping)
  limits: {
    youtube: {
      maxVideos: 100,
      maxComments: 50,
    },
    instagram: {
      maxPosts: 100,
    },
    twitter: {
      maxTweets: 200,
    },
  },

  // User Agent
  userAgent: 'PersonaScraperBot/1.0 (Educational/Research Purpose)',
};

export default config;
