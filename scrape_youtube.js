import PersonaScraper from './src/index.js';
import logger from './src/utils/logger.js';

/**
 * Simple YouTube channel scraper for creating AI persona datasets
 *
 * This script will:
 * 1. Scrape videos from a YouTube channel
 * 2. Download transcripts for each video
 * 3. Create an optimized dataset for AI persona training
 */

async function scrapeYouTubeChannel() {
  // Configuration
  const CHANNEL_HANDLE = '@financewithsharan'; // Change this to your target channel
  const PERSONA_NAME = 'FinanceWithSharan'; // Name for the AI persona
  const MAX_VIDEOS = 50; // Number of videos to scrape (set to null for all)

  logger.info('='.repeat(60));
  logger.info('YouTube Channel Scraper for AI Persona Training');
  logger.info('='.repeat(60));
  logger.info(`\nChannel: ${CHANNEL_HANDLE}`);
  logger.info(`Persona Name: ${PERSONA_NAME}`);
  logger.info(`Max Videos: ${MAX_VIDEOS || 'All available'}\n`);

  try {
    const scraper = new PersonaScraper();

    // Scrape YouTube channel with transcripts
    const options = {
      youtube: {
        maxVideos: MAX_VIDEOS,
        includeComments: false, // Set to true if you want comments
        includeTranscripts: true, // Always true for persona training
      },
    };

    logger.info('Starting scraping process...\n');
    const result = await scraper.scrapePersona(
      PERSONA_NAME,
      { youtube: CHANNEL_HANDLE },
      options
    );

    // Display results
    logger.info('\n' + '='.repeat(60));
    logger.info('Scraping Completed Successfully!');
    logger.info('='.repeat(60));

    if (result.platforms.youtube && !result.platforms.youtube.error) {
      const youtube = result.platforms.youtube;
      logger.info(`\nYouTube Statistics:`);
      logger.info(`- Channel: ${youtube.channel.title}`);
      logger.info(`- Subscribers: ${youtube.channel.statistics.subscriberCount}`);
      logger.info(`- Videos scraped: ${youtube.videos.length}`);
      logger.info(`- Transcripts extracted: ${youtube.transcriptStats.successful}/${youtube.transcriptStats.total}`);
      logger.info(`- Failed transcripts: ${youtube.transcriptStats.failed}`);

      // Calculate total words in transcripts
      const totalWords = youtube.videos
        .filter(v => v.transcript && v.transcript.fullText)
        .reduce((sum, v) => sum + v.transcript.fullText.split(/\s+/).length, 0);
      logger.info(`- Total words in transcripts: ${totalWords.toLocaleString()}`);
    }

    logger.info(`\n\nDataset Location:`);
    logger.info(`- Main directory: ./data/${PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/`);
    logger.info(`- Training dataset: ./data/${PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/training_dataset.json`);
    logger.info(`- Plain text corpus: ./data/${PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/training_corpus.txt`);
    logger.info(`- JSONL format: ./data/${PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/training_dataset.jsonl`);
    logger.info(`- Individual transcripts: ./data/${PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/youtube/transcripts/`);

    logger.info(`\n\nNext Steps:`);
    logger.info(`1. Review the training dataset files in the data directory`);
    logger.info(`2. Use the training_dataset.json for structured AI training`);
    logger.info(`3. Use the training_corpus.txt for simple language model fine-tuning`);
    logger.info(`4. Use the training_dataset.jsonl for OpenAI-style fine-tuning`);
    logger.info(`\n${'='.repeat(60)}\n`);

  } catch (error) {
    logger.error(`\n${'='.repeat(60)}`);
    logger.error('Scraping Failed!');
    logger.error('='.repeat(60));
    logger.error(`Error: ${error.message}`);

    if (error.message.includes('API key')) {
      logger.error(`\nPlease make sure you have set YOUTUBE_API_KEY in your .env file`);
      logger.error(`Get your API key from: https://console.cloud.google.com/apis/credentials`);
    }

    logger.error(`\n${'='.repeat(60)}\n`);
    process.exit(1);
  }
}

// Run the scraper
scrapeYouTubeChannel().catch(error => {
  logger.error('Unexpected error:', error);
  process.exit(1);
});
