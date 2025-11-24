#!/usr/bin/env node

import { Command } from 'commander';
import PersonaScraper from './index.js';
import DataOrganizer from './utils/dataOrganizer.js';
import DatasetConverter from './utils/datasetConverter.js';
import logger from './utils/logger.js';

const program = new Command();

program
  .name('persona-scraper')
  .description('Multi-platform scraper for creating AI persona datasets')
  .version('1.0.0');

// Scrape single platform
program
  .command('scrape')
  .description('Scrape a single platform')
  .requiredOption('-p, --platform <platform>', 'Platform to scrape (youtube, instagram, twitter)')
  .requiredOption('-h, --handle <handle>', 'User handle or channel name')
  .option('-o, --output <directory>', 'Output directory')
  .option('--max-items <number>', 'Maximum number of items to scrape', parseInt)
  .option('--include-comments', 'Include comments (YouTube only)')
  .option('--include-details', 'Include detailed post information')
  .action(async (options) => {
    try {
      logger.info('Starting single platform scrape...');
      logger.info(`Platform: ${options.platform}`);
      logger.info(`Handle: ${options.handle}`);

      const scraper = new PersonaScraper();

      const scrapeOptions = {};
      if (options.maxItems) {
        scrapeOptions.maxVideos = options.maxItems;
        scrapeOptions.maxPosts = options.maxItems;
        scrapeOptions.maxTweets = options.maxItems;
      }
      if (options.includeComments) {
        scrapeOptions.includeComments = true;
      }
      if (options.includeDetails) {
        scrapeOptions.includePostDetails = true;
      }

      const result = await scraper.scrapePlatform(options.platform, options.handle, scrapeOptions);

      // Save data to the data folder
      const organizer = new DataOrganizer(options.handle);
      await organizer.initialize();

      // Save the scraped data
      await organizer.saveJSON(options.platform, `${options.platform}_data.json`, result);
      await organizer.saveRaw(options.platform, 'raw_data.json', result);

      // Save individual transcript files for YouTube
      if (options.platform === 'youtube' && result.videos) {
        await organizer.saveTranscripts(result.videos);
      }

      // Save metadata
      const metadata = {
        handle: options.handle,
        platform: options.platform,
        scrapedAt: result.scrapedAt || new Date().toISOString(),
      };
      await organizer.saveMetadata(metadata);

      // Create summary
      const summary = await organizer.createSummary();

      logger.info('\n✓ Scraping completed successfully!');
      logger.info(`Data saved to: data/${organizer.sanitizeName(options.handle)}/`);
      logger.info(`Files: ${summary.platforms[options.platform]?.files?.join(', ') || 'none'}`);
    } catch (error) {
      logger.error(`✗ Scraping failed: ${error.message}`);
      process.exit(1);
    }
  });

// Scrape complete persona (multiple platforms)
program
  .command('scrape-persona')
  .description('Scrape multiple platforms for a persona')
  .requiredOption('-n, --name <name>', 'Persona name')
  .option('-y, --youtube <handle>', 'YouTube channel handle')
  .option('-i, --instagram <username>', 'Instagram username')
  .option('-t, --twitter <username>', 'Twitter username')
  .option('--deep', 'Deep scrape with maximum data collection')
  .option('--quick', 'Quick scrape with sensible defaults (default)')
  .action(async (options) => {
    try {
      logger.info('Starting multi-platform persona scrape...');
      logger.info(`Persona: ${options.name}`);

      const platforms = {};
      if (options.youtube) platforms.youtube = options.youtube;
      if (options.instagram) platforms.instagram = options.instagram;
      if (options.twitter) platforms.twitter = options.twitter;

      if (Object.keys(platforms).length === 0) {
        logger.error('Error: At least one platform must be specified');
        process.exit(1);
      }

      logger.info(`Platforms: ${Object.keys(platforms).join(', ')}`);

      const scraper = new PersonaScraper();

      let result;
      if (options.deep) {
        logger.info('Mode: Deep scrape');
        result = await scraper.deepScrape(options.name, platforms);
      } else {
        logger.info('Mode: Quick scrape');
        result = await scraper.quickScrape(options.name, platforms);
      }

      logger.info('\n✓ Persona scraping completed successfully!');
      logger.info(`Platforms scraped: ${Object.keys(result.platforms).length}`);
    } catch (error) {
      logger.error(`✗ Persona scraping failed: ${error.message}`);
      process.exit(1);
    }
  });

// List available platforms
program
  .command('platforms')
  .description('List available platforms')
  .action(() => {
    console.log('\nAvailable platforms:');
    console.log('  - youtube      YouTube channels');
    console.log('  - instagram    Instagram profiles');
    console.log('  - twitter      Twitter/X profiles');
    console.log('\nExample usage:');
    console.log('  persona-scraper scrape -p youtube -h @channelname');
    console.log('  persona-scraper scrape-persona -n "John Doe" -y @channel -i username -t username');
  });

// Example command
program
  .command('example')
  .description('Show example usage')
  .action(() => {
    console.log('\nExample Usage:\n');

    console.log('1. Scrape a YouTube channel:');
    console.log('   node src/cli.js scrape -p youtube -h @mkbhd\n');

    console.log('2. Scrape an Instagram profile:');
    console.log('   node src/cli.js scrape -p instagram -h cristiano\n');

    console.log('3. Scrape a Twitter profile:');
    console.log('   node src/cli.js scrape -p twitter -h elonmusk\n');

    console.log('4. Scrape multiple platforms (Quick):');
    console.log('   node src/cli.js scrape-persona -n "MKBHD" -y @mkbhd -i mkbhd -t mkbhd --quick\n');

    console.log('5. Scrape multiple platforms (Deep):');
    console.log('   node src/cli.js scrape-persona -n "MKBHD" -y @mkbhd -i mkbhd -t mkbhd --deep\n');

    console.log('Note: Make sure to configure API keys in .env file before scraping.');
  });

// Convert scraped data to training dataset
program
  .command('convert')
  .description('Convert scraped data to training dataset formats')
  .requiredOption('-n, --name <name>', 'Persona name (folder name in data/)')
  .option('-f, --format <format>', 'Output format: jsonl, alpaca, sharegpt, raw, all (default: all)')
  .option('--system-prompt <prompt>', 'Custom system prompt for the persona')
  .option('--max-length <number>', 'Maximum text length per entry', parseInt)
  .action(async (options) => {
    try {
      logger.info(`Converting data for persona: ${options.name}`);

      const converter = new DatasetConverter(options.name);
      const format = options.format || 'all';

      const convertOptions = {};
      if (options.systemPrompt) convertOptions.systemPrompt = options.systemPrompt;
      if (options.maxLength) convertOptions.maxLength = options.maxLength;

      let results;
      switch (format.toLowerCase()) {
        case 'jsonl':
          results = await converter.convertToJSONL(convertOptions);
          break;
        case 'alpaca':
          results = await converter.convertToAlpaca(convertOptions);
          break;
        case 'sharegpt':
          results = await converter.convertToShareGPT(convertOptions);
          break;
        case 'raw':
          results = await converter.convertToRawText(convertOptions);
          break;
        case 'all':
        default:
          results = await converter.convertAll(convertOptions);
          break;
      }

      logger.info('\n✓ Dataset conversion completed!');
      logger.info(`Results: ${JSON.stringify(results, null, 2)}`);
    } catch (error) {
      logger.error(`✗ Conversion failed: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
