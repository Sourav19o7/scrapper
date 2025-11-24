import YouTubeScraper from './scrapers/youtube.js';
import InstagramScraper from './scrapers/instagram.js';
import TwitterScraper from './scrapers/twitter.js';
import DataOrganizer from './utils/dataOrganizer.js';
import logger from './utils/logger.js';

/**
 * Main orchestrator for multi-platform persona scraping
 */
export class PersonaScraper {
  constructor() {
    this.youtube = new YouTubeScraper();
    this.instagram = new InstagramScraper();
    this.twitter = new TwitterScraper();
  }

  /**
   * Scrape a single platform
   */
  async scrapePlatform(platform, handle, options = {}) {
    logger.info(`Scraping ${platform} for handle: ${handle}`);

    switch (platform.toLowerCase()) {
      case 'youtube':
        return await this.youtube.scrapeChannel(handle, options);

      case 'instagram':
        return await this.instagram.scrapeProfile(handle, options);

      case 'twitter':
      case 'x':
        return await this.twitter.scrapeProfile(handle, options);

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Scrape multiple platforms for a single persona
   */
  async scrapePersona(personaName, platforms, options = {}) {
    logger.info(`Starting multi-platform scrape for persona: ${personaName}`);

    // Initialize data organizer
    const organizer = new DataOrganizer(personaName);
    await organizer.initialize();

    const results = {
      personaName,
      scrapedAt: new Date().toISOString(),
      platforms: {},
    };

    // Metadata
    const metadata = {
      personaName,
      scrapedAt: new Date().toISOString(),
      platforms: {},
    };

    // Scrape each platform
    for (const [platform, handle] of Object.entries(platforms)) {
      if (!handle) continue;

      try {
        logger.info(`\n=== Scraping ${platform} ===`);

        const data = await this.scrapePlatform(platform, handle, options[platform] || {});
        results.platforms[platform] = data;

        // Save platform data
        await organizer.saveJSON(platform, `${platform}_data.json`, data);
        await organizer.saveRaw(platform, 'raw_data.json', data);

        // Save individual transcript files for YouTube
        if (platform === 'youtube' && data.videos) {
          logger.info('Saving individual transcript files...');
          await organizer.saveTranscripts(data.videos);
        }

        // Extract metadata
        metadata.platforms[platform] = {
          handle,
          scrapedAt: data.scrapedAt,
          dataPoints: this.countDataPoints(data),
        };

        logger.info(`✓ ${platform} scraping completed`);
      } catch (error) {
        logger.error(`✗ Failed to scrape ${platform}: ${error.message}`);
        results.platforms[platform] = { error: error.message };
        metadata.platforms[platform] = {
          handle,
          error: error.message,
        };
      }
    }

    // Save metadata
    await organizer.saveMetadata(metadata);

    // Create summary
    const summary = await organizer.createSummary();
    logger.info(`\n=== Scraping Summary ===`);
    logger.info(JSON.stringify(summary, null, 2));

    // Export training dataset
    const trainingDatasetPath = await organizer.exportForTraining();
    logger.info(`\nTraining dataset exported to: ${trainingDatasetPath}`);

    return results;
  }

  /**
   * Count data points in scraped data
   */
  countDataPoints(data) {
    let count = 0;

    if (data.platform === 'youtube' && data.videos) {
      count = data.videos.length;
    } else if (data.platform === 'instagram' && data.posts) {
      count = data.posts.length;
    } else if (data.platform === 'twitter' && data.tweets) {
      count = data.tweets.length;
    }

    return count;
  }

  /**
   * Quick scrape with sensible defaults
   */
  async quickScrape(personaName, handles) {
    const defaultOptions = {
      youtube: {
        maxVideos: 50,
        includeComments: false,
      },
      instagram: {
        maxPosts: 50,
        includePostDetails: false,
      },
      twitter: {
        maxTweets: 100,
        includeLikes: false,
        includeFollowers: false,
      },
    };

    return await this.scrapePersona(personaName, handles, defaultOptions);
  }

  /**
   * Deep scrape with maximum data collection
   */
  async deepScrape(personaName, handles) {
    const deepOptions = {
      youtube: {
        maxVideos: 100,
        includeComments: true,
        maxComments: 50,
      },
      instagram: {
        maxPosts: 100,
        includePostDetails: true,
      },
      twitter: {
        maxTweets: 200,
        includeLikes: true,
        maxLikes: 100,
        includeFollowers: true,
        maxFollowers: 100,
      },
    };

    return await this.scrapePersona(personaName, handles, deepOptions);
  }
}

export default PersonaScraper;
