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
  // ========== CONFIGURATION ==========
  // Change these values according to your needs

  const CHANNEL_HANDLE = '@financewithsharan'; // YouTube channel handle (with @)
  const PERSONA_NAME = 'FinanceWithSharan'; // Name for the AI persona
  const MAX_VIDEOS = 100; // Number of videos to scrape (set to null for all available videos)

  logger.info('='.repeat(60));
  logger.info('YouTube Channel Scraper for AI Persona Training');
  logger.info('='.repeat(60));
  logger.info(`\nChannel: ${CHANNEL_HANDLE}`);
  logger.info(`Persona Name: ${PERSONA_NAME}`);
  logger.info(`Max Videos: ${MAX_VIDEOS || 'All available'}\n`);

  try {
    const scraper = new PersonaScraper();

    // Scrape YouTube channel with comprehensive data
    const options = {
      youtube: {
        maxVideos: MAX_VIDEOS,
        includeComments: false, // Set to true to include video comments (uses more API quota)
        includeTranscripts: true, // MUST be true for persona training
        saveTranscripts: true, // Save individual transcript files
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

    const dirName = PERSONA_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    logger.info(`\n\nDataset Location: ./data/${dirName}/`);
    logger.info(`\nKey Files Generated:`);
    logger.info(`\n1. PERSONA PROFILE (Understanding the person)`);
    logger.info(`   - persona_profile.json    - Extracted ideology, beliefs, and financial philosophy`);
    logger.info(`   - persona_profile.md      - Human-readable profile summary`);
    logger.info(`\n2. TRAINING DATASETS (For AI model training)`);
    logger.info(`   - training_dataset.json   - Complete dataset with posts, ideology, and metadata`);
    logger.info(`   - training_corpus.txt     - Plain text format for simple fine-tuning`);
    logger.info(`   - training_dataset.jsonl  - JSONL format for API-based training`);
    logger.info(`   - training_conversations.json - Conversational format for chat models`);
    logger.info(`\n3. RAW DATA (Original scraped data)`);
    logger.info(`   - youtube/youtube_data.json - All video data with metadata`);
    logger.info(`   - youtube/transcripts/      - Individual transcript files`);
    logger.info(`   - raw/                      - Backup of raw data`);

    logger.info(`\n\nWhat's in the Dataset:`);
    logger.info(`✓ Posts - All video transcripts with full context`);
    logger.info(`✓ Ideology - Core beliefs and worldview extracted from content`);
    logger.info(`✓ Financial Philosophy - Investment advice, budgeting tips, risk management`);
    logger.info(`✓ Decision Patterns - How they make and recommend financial decisions`);
    logger.info(`✓ Values - What they consider important and prioritize`);
    logger.info(`✓ Common Phrases - Signature expressions and speaking patterns`);
    logger.info(`✓ Topic Expertise - Areas they discuss most frequently`);

    logger.info(`\n\nNext Steps:`);
    logger.info(`1. Review persona_profile.md to understand the person's ideology`);
    logger.info(`2. Check training_dataset.json for the complete structured dataset`);
    logger.info(`3. Use appropriate format for your AI training framework:`);
    logger.info(`   - GPT/LLaMA: Use training_corpus.txt or training_dataset.jsonl`);
    logger.info(`   - Custom models: Use training_dataset.json with full metadata`);
    logger.info(`   - Chat models: Use training_conversations.json`);
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
