import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from './logger.js';

/**
 * Organizes and stores scraped data in a structured format
 */
export class DataOrganizer {
  constructor(personaName) {
    this.personaName = personaName;
    this.baseDir = path.join(config.dataOutputDir, this.sanitizeName(personaName));
  }

  /**
   * Sanitize persona name for file system
   */
  sanitizeName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Initialize directory structure for a persona
   */
  async initialize() {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'youtube'),
      path.join(this.baseDir, 'youtube', 'transcripts'),
      path.join(this.baseDir, 'instagram'),
      path.join(this.baseDir, 'twitter'),
      path.join(this.baseDir, 'raw'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    logger.info(`Initialized directory structure for ${this.personaName}`);
  }

  /**
   * Save data to JSON file
   */
  async saveJSON(platform, filename, data) {
    const filePath = path.join(this.baseDir, platform, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Saved ${filename} to ${platform} directory`);
    return filePath;
  }

  /**
   * Save metadata about the persona
   */
  async saveMetadata(metadata) {
    const filePath = path.join(this.baseDir, 'metadata.json');
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf-8');
    logger.info(`Saved metadata for ${this.personaName}`);
    return filePath;
  }

  /**
   * Save raw data for backup
   */
  async saveRaw(platform, filename, data) {
    const filePath = path.join(this.baseDir, 'raw', `${platform}_${filename}`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }

  /**
   * Load existing data
   */
  async loadJSON(platform, filename) {
    try {
      const filePath = path.join(this.baseDir, platform, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn(`Could not load ${filename} from ${platform}: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a summary of collected data
   */
  async createSummary() {
    const summary = {
      personaName: this.personaName,
      collectedAt: new Date().toISOString(),
      platforms: {},
    };

    // Check each platform
    const platforms = ['youtube', 'instagram', 'twitter'];
    for (const platform of platforms) {
      try {
        const platformDir = path.join(this.baseDir, platform);
        const files = await fs.readdir(platformDir);
        summary.platforms[platform] = {
          filesCollected: files.length,
          files: files,
        };
      } catch (error) {
        summary.platforms[platform] = { filesCollected: 0, files: [] };
      }
    }

    await this.saveJSON('.', 'summary.json', summary);
    return summary;
  }

  /**
   * Save individual transcript files for each video
   */
  async saveTranscripts(videos) {
    if (!videos || videos.length === 0) {
      logger.warn('No videos provided for transcript extraction');
      return [];
    }

    const savedFiles = [];
    const transcriptsDir = path.join(this.baseDir, 'youtube', 'transcripts');

    for (const video of videos) {
      if (video.transcript && video.transcript.fullText) {
        // Clean the transcript text (decode HTML entities)
        const cleanText = video.transcript.fullText
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();

        // Create a safe filename from video title
        const safeTitle = video.title
          .replace(/[^a-z0-9]/gi, '_')
          .substring(0, 50)
          .toLowerCase();
        const filename = `${video.videoId}_${safeTitle}.txt`;
        const filePath = path.join(transcriptsDir, filename);

        // Write transcript file with metadata header
        const content = `Video ID: ${video.videoId}
Title: ${video.title}
Published: ${video.publishedAt || 'Unknown'}
Duration: ${video.duration || 'Unknown'}
Segments: ${video.transcript.segmentCount || video.transcript.segments?.length || 0}

---

${cleanText}
`;

        await fs.writeFile(filePath, content, 'utf-8');
        savedFiles.push(filename);
      }
    }

    logger.info(`Saved ${savedFiles.length} transcript files to transcripts directory`);
    return savedFiles;
  }

  /**
   * Export dataset in ML-friendly format optimized for AI persona training
   */
  async exportForTraining() {
    const trainingData = {
      persona: this.personaName,
      exportedAt: new Date().toISOString(),
      version: '2.0',
      conversations: [], // For conversational AI training
      monologues: [], // For long-form content like YouTube transcripts
      metadata: {
        totalSamples: 0,
        platforms: {},
        statistics: {},
      },
    };

    // Load YouTube data
    try {
      const youtubeData = await this.loadJSON('youtube', 'youtube_data.json');
      if (youtubeData && youtubeData.videos) {
        logger.info(`Processing ${youtubeData.videos.length} YouTube videos for training dataset`);

        for (const video of youtubeData.videos) {
          if (video.transcript && video.transcript.fullText) {
            // Create monologue entry for each video
            trainingData.monologues.push({
              id: video.videoId,
              platform: 'youtube',
              type: 'video_transcript',
              title: video.title,
              text: video.transcript.fullText,
              metadata: {
                publishedAt: video.publishedAt,
                duration: video.duration,
                viewCount: video.statistics?.viewCount,
                likeCount: video.statistics?.likeCount,
                tags: video.tags || [],
                description: video.description,
              },
              wordCount: video.transcript.fullText.split(/\s+/).length,
              segmentCount: video.transcript.segmentCount,
            });
          }

          // Process comments as conversational data
          if (video.comments && video.comments.length > 0) {
            for (const comment of video.comments) {
              trainingData.conversations.push({
                platform: 'youtube',
                type: 'comment',
                context: video.title,
                text: comment.text,
                author: comment.author,
                metadata: {
                  videoId: video.videoId,
                  likeCount: comment.likeCount,
                  publishedAt: comment.publishedAt,
                },
              });
            }
          }
        }

        trainingData.metadata.platforms.youtube = {
          videosProcessed: youtubeData.videos.length,
          transcriptsExtracted: trainingData.monologues.filter(m => m.platform === 'youtube').length,
          channelInfo: {
            title: youtubeData.channel?.title,
            subscriberCount: youtubeData.channel?.statistics?.subscriberCount,
            videoCount: youtubeData.channel?.statistics?.videoCount,
          },
        };
      }
    } catch (error) {
      logger.warn(`Could not process YouTube data: ${error.message}`);
    }

    // Load Instagram data
    try {
      const instagramData = await this.loadJSON('instagram', 'instagram_data.json');
      if (instagramData && instagramData.posts) {
        logger.info(`Processing ${instagramData.posts.length} Instagram posts for training dataset`);

        for (const post of instagramData.posts) {
          if (post.details && post.details.caption) {
            trainingData.monologues.push({
              id: post.shortcode,
              platform: 'instagram',
              type: 'post_caption',
              text: post.details.caption,
              metadata: {
                url: post.url,
                description: post.details.description,
              },
              wordCount: post.details.caption.split(/\s+/).length,
            });
          }
        }

        trainingData.metadata.platforms.instagram = {
          postsProcessed: instagramData.posts.length,
          captionsExtracted: trainingData.monologues.filter(m => m.platform === 'instagram').length,
        };
      }
    } catch (error) {
      logger.warn(`Could not process Instagram data: ${error.message}`);
    }

    // Load Twitter data
    try {
      const twitterData = await this.loadJSON('twitter', 'twitter_data.json');
      if (twitterData && twitterData.tweets) {
        logger.info(`Processing ${twitterData.tweets.length} tweets for training dataset`);

        for (const tweet of twitterData.tweets) {
          trainingData.conversations.push({
            platform: 'twitter',
            type: 'tweet',
            text: tweet.text,
            metadata: {
              tweetId: tweet.id,
              createdAt: tweet.created_at,
              likeCount: tweet.public_metrics?.like_count,
              retweetCount: tweet.public_metrics?.retweet_count,
              replyCount: tweet.public_metrics?.reply_count,
            },
          });
        }

        trainingData.metadata.platforms.twitter = {
          tweetsProcessed: twitterData.tweets.length,
        };
      }
    } catch (error) {
      logger.warn(`Could not process Twitter data: ${error.message}`);
    }

    // Calculate statistics
    trainingData.metadata.totalSamples = trainingData.conversations.length + trainingData.monologues.length;
    trainingData.metadata.statistics = {
      totalConversations: trainingData.conversations.length,
      totalMonologues: trainingData.monologues.length,
      totalWords: trainingData.monologues.reduce((sum, m) => sum + (m.wordCount || 0), 0),
      averageWordsPerMonologue: trainingData.monologues.length > 0
        ? Math.round(trainingData.monologues.reduce((sum, m) => sum + (m.wordCount || 0), 0) / trainingData.monologues.length)
        : 0,
    };

    const exportPath = path.join(this.baseDir, 'training_dataset.json');
    await fs.writeFile(exportPath, JSON.stringify(trainingData, null, 2), 'utf-8');
    logger.info(`Exported training dataset to ${exportPath}`);
    logger.info(`Dataset contains ${trainingData.metadata.totalSamples} samples (${trainingData.monologues.length} monologues, ${trainingData.conversations.length} conversations)`);

    // Also export simplified formats
    await this.exportSimplifiedFormats(trainingData);

    return exportPath;
  }

  /**
   * Export simplified formats for different AI training frameworks
   */
  async exportSimplifiedFormats(trainingData) {
    // Format 1: Plain text corpus (for fine-tuning language models)
    const plainTextPath = path.join(this.baseDir, 'training_corpus.txt');
    const textCorpus = trainingData.monologues
      .map(m => `### ${m.title || m.type}\n\n${m.text}\n\n`)
      .join('\n---\n\n');
    await fs.writeFile(plainTextPath, textCorpus, 'utf-8');
    logger.info(`Exported plain text corpus to ${plainTextPath}`);

    // Format 2: JSONL format (for frameworks like OpenAI fine-tuning)
    const jsonlPath = path.join(this.baseDir, 'training_dataset.jsonl');
    const jsonlLines = trainingData.monologues.map(m =>
      JSON.stringify({
        prompt: `Speaking as ${trainingData.persona} about "${m.title || m.type}":`,
        completion: m.text,
      })
    );
    await fs.writeFile(jsonlPath, jsonlLines.join('\n'), 'utf-8');
    logger.info(`Exported JSONL format to ${jsonlPath}`);

    // Format 3: Conversational pairs (for chat model fine-tuning)
    const conversationalPath = path.join(this.baseDir, 'training_conversations.json');
    const conversationalData = trainingData.conversations.map(c => ({
      role: 'assistant',
      content: c.text,
      context: c.context,
      platform: c.platform,
    }));
    await fs.writeFile(conversationalPath, JSON.stringify(conversationalData, null, 2), 'utf-8');
    logger.info(`Exported conversational format to ${conversationalPath}`);
  }
}

export default DataOrganizer;
