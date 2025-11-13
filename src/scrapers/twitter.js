import { TwitterApi } from 'twitter-api-v2';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import RateLimiter from '../utils/rateLimiter.js';

/**
 * Twitter/X scraper using official Twitter API v2
 */
export class TwitterScraper {
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.client = null;
    this.initClient();
  }

  /**
   * Initialize Twitter client
   */
  initClient() {
    if (config.twitter.bearerToken) {
      // App-only authentication (read-only)
      this.client = new TwitterApi(config.twitter.bearerToken);
    } else if (config.twitter.apiKey && config.twitter.apiSecret) {
      // OAuth 1.0a authentication
      this.client = new TwitterApi({
        appKey: config.twitter.apiKey,
        appSecret: config.twitter.apiSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessSecret,
      });
    } else {
      logger.warn('Twitter API credentials not configured');
    }
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    if (!this.client) {
      throw new Error('Twitter API not configured. Please set credentials in .env');
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    this.validateConfig();

    try {
      // Remove @ if present
      const cleanUsername = username.replace('@', '');

      logger.info(`Fetching Twitter user: ${cleanUsername}`);

      const user = await this.rateLimiter.add(() =>
        this.client.v2.userByUsername(cleanUsername, {
          'user.fields': [
            'id',
            'name',
            'username',
            'created_at',
            'description',
            'location',
            'pinned_tweet_id',
            'profile_image_url',
            'protected',
            'public_metrics',
            'url',
            'verified',
            'verified_type',
          ],
        })
      );

      if (!user.data) {
        throw new Error(`User not found: ${username}`);
      }

      logger.info(`Found user: @${user.data.username}`);
      return user.data;
    } catch (error) {
      logger.error(`Error fetching user ${username}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's tweets
   */
  async getUserTweets(userId, maxTweets = null) {
    this.validateConfig();
    const limit = maxTweets || config.limits.twitter.maxTweets;

    try {
      logger.info(`Fetching tweets for user ID: ${userId}`);

      const tweets = [];
      let paginationToken = undefined;

      while (tweets.length < limit) {
        const response = await this.rateLimiter.add(() =>
          this.client.v2.userTimeline(userId, {
            max_results: Math.min(100, limit - tweets.length),
            pagination_token: paginationToken,
            'tweet.fields': [
              'id',
              'text',
              'created_at',
              'author_id',
              'conversation_id',
              'in_reply_to_user_id',
              'referenced_tweets',
              'attachments',
              'public_metrics',
              'possibly_sensitive',
              'lang',
              'reply_settings',
            ],
            'expansions': ['attachments.media_keys', 'referenced_tweets.id'],
            'media.fields': ['type', 'url', 'preview_image_url', 'public_metrics'],
          })
        );

        if (!response.data || response.data.data.length === 0) {
          break;
        }

        tweets.push(...response.data.data);

        // Check if there's more data
        paginationToken = response.data.meta?.next_token;
        if (!paginationToken) break;

        logger.info(`Fetched ${tweets.length} tweets so far...`);
      }

      logger.info(`Fetched total of ${tweets.length} tweets`);
      return tweets.slice(0, limit);
    } catch (error) {
      logger.error(`Error fetching tweets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's liked tweets (requires user authentication)
   */
  async getUserLikes(userId, maxLikes = 100) {
    this.validateConfig();

    try {
      logger.info(`Fetching liked tweets for user ID: ${userId}`);

      const likes = [];
      let paginationToken = undefined;

      while (likes.length < maxLikes) {
        const response = await this.rateLimiter.add(() =>
          this.client.v2.userLikedTweets(userId, {
            max_results: Math.min(100, maxLikes - likes.length),
            pagination_token: paginationToken,
            'tweet.fields': ['created_at', 'public_metrics', 'text'],
          })
        );

        if (!response.data || response.data.data.length === 0) {
          break;
        }

        likes.push(...response.data.data);

        paginationToken = response.data.meta?.next_token;
        if (!paginationToken) break;
      }

      logger.info(`Fetched ${likes.length} liked tweets`);
      return likes.slice(0, maxLikes);
    } catch (error) {
      // Likes might not be accessible
      logger.warn(`Could not fetch likes: ${error.message}`);
      return [];
    }
  }

  /**
   * Search tweets by keyword
   */
  async searchTweets(query, maxTweets = 100) {
    this.validateConfig();

    try {
      logger.info(`Searching tweets with query: ${query}`);

      const tweets = [];
      let nextToken = undefined;

      while (tweets.length < maxTweets) {
        const response = await this.rateLimiter.add(() =>
          this.client.v2.search(query, {
            max_results: Math.min(100, maxTweets - tweets.length),
            next_token: nextToken,
            'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'text'],
          })
        );

        if (!response.data || response.data.data.length === 0) {
          break;
        }

        tweets.push(...response.data.data);

        nextToken = response.data.meta?.next_token;
        if (!nextToken) break;
      }

      logger.info(`Found ${tweets.length} tweets`);
      return tweets.slice(0, maxTweets);
    } catch (error) {
      logger.error(`Error searching tweets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's followers (limited by API)
   */
  async getFollowers(userId, maxFollowers = 100) {
    this.validateConfig();

    try {
      logger.info(`Fetching followers for user ID: ${userId}`);

      const followers = [];
      let paginationToken = undefined;

      while (followers.length < maxFollowers) {
        const response = await this.rateLimiter.add(() =>
          this.client.v2.followers(userId, {
            max_results: Math.min(1000, maxFollowers - followers.length),
            pagination_token: paginationToken,
            'user.fields': ['username', 'name', 'public_metrics', 'verified'],
          })
        );

        if (!response.data || response.data.data.length === 0) {
          break;
        }

        followers.push(...response.data.data);

        paginationToken = response.data.meta?.next_token;
        if (!paginationToken) break;
      }

      logger.info(`Fetched ${followers.length} followers`);
      return followers.slice(0, maxFollowers);
    } catch (error) {
      logger.warn(`Could not fetch followers: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape complete Twitter profile
   */
  async scrapeProfile(username, options = {}) {
    this.validateConfig();

    try {
      logger.info(`Starting Twitter scrape for: ${username}`);

      // Get user info
      const user = await this.getUserByUsername(username);

      // Get tweets
      const tweets = await this.getUserTweets(user.id, options.maxTweets);

      // Optionally get likes
      let likes = [];
      if (options.includeLikes) {
        likes = await this.getUserLikes(user.id, options.maxLikes || 50);
      }

      // Optionally get followers
      let followers = [];
      if (options.includeFollowers) {
        followers = await this.getFollowers(user.id, options.maxFollowers || 100);
      }

      const result = {
        platform: 'twitter',
        scrapedAt: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          description: user.description,
          location: user.location,
          createdAt: user.created_at,
          profileImageUrl: user.profile_image_url,
          verified: user.verified,
          metrics: user.public_metrics,
        },
        tweets,
        likes,
        followers,
      };

      logger.info(`Twitter scrape completed: ${tweets.length} tweets, ${likes.length} likes collected`);
      return result;
    } catch (error) {
      logger.error(`Twitter scrape failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze tweet content for patterns (useful for persona creation)
   */
  analyzeTweets(tweets) {
    const analysis = {
      totalTweets: tweets.length,
      avgLength: 0,
      mostUsedWords: {},
      hashtags: [],
      mentions: [],
      links: [],
      mediaCount: 0,
      timeDistribution: {},
    };

    tweets.forEach(tweet => {
      // Calculate average length
      analysis.avgLength += tweet.text.length;

      // Extract hashtags
      const hashtagMatches = tweet.text.match(/#\w+/g);
      if (hashtagMatches) {
        analysis.hashtags.push(...hashtagMatches);
      }

      // Extract mentions
      const mentionMatches = tweet.text.match(/@\w+/g);
      if (mentionMatches) {
        analysis.mentions.push(...mentionMatches);
      }

      // Extract links
      const linkMatches = tweet.text.match(/https?:\/\/[^\s]+/g);
      if (linkMatches) {
        analysis.links.push(...linkMatches);
      }

      // Check for media
      if (tweet.attachments) {
        analysis.mediaCount++;
      }

      // Time distribution
      const hour = new Date(tweet.created_at).getHours();
      analysis.timeDistribution[hour] = (analysis.timeDistribution[hour] || 0) + 1;
    });

    analysis.avgLength = Math.round(analysis.avgLength / tweets.length);

    return analysis;
  }
}

export default TwitterScraper;
