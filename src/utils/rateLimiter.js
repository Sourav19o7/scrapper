import PQueue from 'p-queue';
import config from '../config/config.js';
import logger from './logger.js';

/**
 * Rate limiter to ensure ethical scraping
 */
export class RateLimiter {
  constructor(options = {}) {
    this.delay = options.delay || config.rateLimitDelay;
    this.concurrency = options.concurrency || config.maxConcurrentRequests;
    this.queue = new PQueue({
      concurrency: this.concurrency,
      interval: this.delay,
      intervalCap: 1
    });

    logger.info(`Rate limiter initialized: ${this.concurrency} concurrent requests, ${this.delay}ms delay`);
  }

  /**
   * Add a task to the rate-limited queue
   * @param {Function} task - Async function to execute
   * @returns {Promise} - Result of the task
   */
  async add(task) {
    return this.queue.add(task);
  }

  /**
   * Wait for a specific duration
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
    };
  }
}

export default RateLimiter;
