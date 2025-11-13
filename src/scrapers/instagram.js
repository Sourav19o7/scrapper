import axios from 'axios';
import puppeteer from 'puppeteer';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import RateLimiter from '../utils/rateLimiter.js';

/**
 * Instagram scraper
 * Note: Instagram scraping is challenging due to their anti-bot measures.
 * This uses a combination of public web scraping (no login required for public profiles)
 * For best results, consider using official Instagram Graph API with business accounts
 */
export class InstagramScraper {
  constructor() {
    this.rateLimiter = new RateLimiter({
      delay: 3000, // More conservative for Instagram
      concurrency: 1,
    });
    this.browser = null;
  }

  /**
   * Initialize headless browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      logger.info('Instagram browser initialized');
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Instagram browser closed');
    }
  }

  /**
   * Scrape public Instagram profile (no login required)
   */
  async scrapePublicProfile(username) {
    await this.initBrowser();
    const page = await this.browser.newPage();

    try {
      logger.info(`Scraping Instagram profile: ${username}`);

      // Set user agent
      await page.setUserAgent(config.userAgent);

      // Navigate to profile
      const url = `https://www.instagram.com/${username}/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Extract profile data from page
      const profileData = await page.evaluate(() => {
        // Instagram stores data in script tags
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        let data = null;

        for (const script of scripts) {
          try {
            const json = JSON.parse(script.textContent);
            if (json['@type'] === 'ProfilePage') {
              data = json;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // Also try to get data from meta tags
        const getMetaContent = (property) => {
          const meta = document.querySelector(`meta[property="${property}"]`);
          return meta ? meta.getAttribute('content') : null;
        };

        return {
          structuredData: data,
          title: document.title,
          description: getMetaContent('og:description'),
          image: getMetaContent('og:image'),
        };
      });

      logger.info(`Profile data extracted for ${username}`);
      await page.close();

      return {
        username,
        profileData,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error scraping Instagram profile ${username}: ${error.message}`);
      await page.close();
      throw error;
    }
  }

  /**
   * Scrape posts using public endpoints (limited data)
   */
  async scrapePosts(username, maxPosts = null) {
    const limit = maxPosts || config.limits.instagram.maxPosts;
    await this.initBrowser();
    const page = await this.browser.newPage();

    try {
      logger.info(`Scraping Instagram posts for: ${username}`);

      await page.setUserAgent(config.userAgent);
      const url = `https://www.instagram.com/${username}/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForTimeout(2000);

      // Scroll to load more posts
      const posts = [];
      let scrollCount = 0;
      const maxScrolls = Math.ceil(limit / 12); // Instagram typically loads 12 posts at a time

      while (scrollCount < maxScrolls && posts.length < limit) {
        // Extract posts from current view
        const newPosts = await page.evaluate(() => {
          const articles = document.querySelectorAll('article a[href*="/p/"]');
          const postData = [];

          articles.forEach((article) => {
            const href = article.getAttribute('href');
            const img = article.querySelector('img');

            if (href && img) {
              postData.push({
                url: `https://www.instagram.com${href}`,
                shortcode: href.split('/p/')[1]?.split('/')[0],
                thumbnail: img.src,
                alt: img.alt || '',
              });
            }
          });

          return postData;
        });

        // Add new unique posts
        for (const post of newPosts) {
          if (!posts.find(p => p.shortcode === post.shortcode)) {
            posts.push(post);
          }
        }

        // Scroll down
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(2000);
        scrollCount++;

        logger.info(`Loaded ${posts.length} posts so far...`);
      }

      await page.close();

      const finalPosts = posts.slice(0, limit);
      logger.info(`Scraped ${finalPosts.length} posts from ${username}`);

      return finalPosts;
    } catch (error) {
      logger.error(`Error scraping Instagram posts: ${error.message}`);
      await page.close();
      throw error;
    }
  }

  /**
   * Get detailed post information
   */
  async getPostDetails(shortcode) {
    await this.initBrowser();
    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(config.userAgent);
      const url = `https://www.instagram.com/p/${shortcode}/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForTimeout(2000);

      const postDetails = await page.evaluate(() => {
        const getMetaContent = (property) => {
          const meta = document.querySelector(`meta[property="${property}"]`);
          return meta ? meta.getAttribute('content') : null;
        };

        // Try to get caption
        const captionElement = document.querySelector('h1');
        const caption = captionElement ? captionElement.textContent : '';

        return {
          title: document.title,
          description: getMetaContent('og:description'),
          image: getMetaContent('og:image'),
          caption: caption,
        };
      });

      await page.close();
      return postDetails;
    } catch (error) {
      logger.error(`Error getting post details for ${shortcode}: ${error.message}`);
      await page.close();
      return null;
    }
  }

  /**
   * Scrape complete Instagram profile
   */
  async scrapeProfile(username, options = {}) {
    try {
      logger.info(`Starting Instagram scrape for: ${username}`);

      // Get profile info
      const profile = await this.scrapePublicProfile(username);

      // Get posts
      const posts = await this.scrapePosts(username, options.maxPosts);

      // Optionally get detailed info for each post
      if (options.includePostDetails && posts.length > 0) {
        logger.info('Fetching detailed post information...');
        const detailedPosts = [];

        for (const post of posts.slice(0, Math.min(20, posts.length))) {
          const details = await this.getPostDetails(post.shortcode);
          detailedPosts.push({
            ...post,
            details,
          });
          await this.rateLimiter.wait(3000); // Be respectful
        }

        posts.splice(0, detailedPosts.length, ...detailedPosts);
      }

      const result = {
        platform: 'instagram',
        scrapedAt: new Date().toISOString(),
        profile,
        posts,
      };

      await this.closeBrowser();

      logger.info(`Instagram scrape completed: ${posts.length} posts collected`);
      return result;
    } catch (error) {
      logger.error(`Instagram scrape failed: ${error.message}`);
      await this.closeBrowser();
      throw error;
    }
  }

  /**
   * Alternative: Use Instagram Graph API (requires business account and access token)
   * This is the recommended approach for production use
   */
  async scrapeWithGraphAPI(userId, accessToken, options = {}) {
    logger.warn('Instagram Graph API implementation requires setup. See documentation.');

    // Placeholder for Graph API implementation
    // You would need to:
    // 1. Set up Facebook Developer account
    // 2. Create an app
    // 3. Get user access token
    // 4. Use the Graph API endpoints

    throw new Error('Instagram Graph API not implemented. Please set up Facebook Developer access.');
  }
}

export default InstagramScraper;
