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
   * Export dataset in ML-friendly format
   */
  async exportForTraining() {
    const trainingData = {
      persona: this.personaName,
      exportedAt: new Date().toISOString(),
      content: [],
    };

    // Aggregate all text content
    const platforms = ['youtube', 'instagram', 'twitter'];
    for (const platform of platforms) {
      try {
        const platformDir = path.join(this.baseDir, platform);
        const files = await fs.readdir(platformDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await this.loadJSON(platform, file);
            if (data) {
              trainingData.content.push({
                platform,
                source: file,
                data,
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Could not export ${platform} data: ${error.message}`);
      }
    }

    const exportPath = path.join(this.baseDir, 'training_dataset.json');
    await fs.writeFile(exportPath, JSON.stringify(trainingData, null, 2), 'utf-8');
    logger.info(`Exported training dataset to ${exportPath}`);

    return exportPath;
  }
}

export default DataOrganizer;
