import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from './logger.js';

/**
 * Converts scraped data into various training dataset formats
 */
export class DatasetConverter {
  constructor(personaName) {
    this.personaName = personaName;
    this.baseDir = path.join(config.dataOutputDir, this.sanitizeName(personaName));
  }

  sanitizeName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Load scraped YouTube data
   */
  async loadYouTubeData() {
    try {
      const filePath = path.join(this.baseDir, 'youtube', 'youtube_data.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn(`Could not load YouTube data: ${error.message}`);
      return null;
    }
  }

  /**
   * Load scraped Twitter data
   */
  async loadTwitterData() {
    try {
      const filePath = path.join(this.baseDir, 'twitter', 'twitter_data.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn(`Could not load Twitter data: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract all transcripts from YouTube data
   */
  extractTranscripts(youtubeData) {
    if (!youtubeData || !youtubeData.videos) return [];

    const transcripts = [];
    for (const video of youtubeData.videos) {
      if (video.transcript && video.transcript.fullText) {
        transcripts.push({
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          text: video.transcript.fullText,
          segments: video.transcript.segments || [],
          publishedAt: video.publishedAt,
        });
      }
    }
    return transcripts;
  }

  /**
   * Clean and normalize text for training
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
      .replace(/\(.*?\)/g, '') // Remove (inaudible), etc.
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split text into chunks for training (avoid too long sequences)
   */
  chunkText(text, maxLength = 2000) {
    if (text.length <= maxLength) return [text];

    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  /**
   * Convert to JSONL format (OpenAI fine-tuning format)
   * Creates conversational pairs simulating the persona
   */
  async convertToJSONL(options = {}) {
    const youtubeData = await this.loadYouTubeData();
    const twitterData = await this.loadTwitterData();
    const transcripts = this.extractTranscripts(youtubeData);

    const systemPrompt = options.systemPrompt ||
      `You are ${this.personaName}. Respond in their unique voice, style, and personality based on their content.`;

    const entries = [];

    // Process YouTube transcripts
    for (const transcript of transcripts) {
      const cleanedText = this.cleanText(transcript.text);
      if (!cleanedText || cleanedText.length < 50) continue;

      const chunks = this.chunkText(cleanedText, options.maxLength || 2000);

      for (const chunk of chunks) {
        // Create a conversation entry
        entries.push({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Share your thoughts on: ${transcript.title}` },
            { role: 'assistant', content: chunk }
          ]
        });
      }
    }

    // Process Twitter data
    if (twitterData && twitterData.tweets) {
      for (const tweet of twitterData.tweets) {
        const text = this.cleanText(tweet.text);
        if (!text || text.length < 20) continue;

        entries.push({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Share a quick thought or update.' },
            { role: 'assistant', content: text }
          ]
        });
      }
    }

    // Save to file
    const outputPath = path.join(this.baseDir, 'training_data.jsonl');
    const jsonlContent = entries.map(e => JSON.stringify(e)).join('\n');
    await fs.writeFile(outputPath, jsonlContent, 'utf-8');

    logger.info(`Created JSONL dataset: ${outputPath}`);
    logger.info(`Total entries: ${entries.length}`);

    return { path: outputPath, entries: entries.length };
  }

  /**
   * Convert to Alpaca format (instruction-following format)
   */
  async convertToAlpaca(options = {}) {
    const youtubeData = await this.loadYouTubeData();
    const twitterData = await this.loadTwitterData();
    const transcripts = this.extractTranscripts(youtubeData);

    const entries = [];

    // Process YouTube transcripts
    for (const transcript of transcripts) {
      const cleanedText = this.cleanText(transcript.text);
      if (!cleanedText || cleanedText.length < 50) continue;

      const chunks = this.chunkText(cleanedText, options.maxLength || 2000);

      for (const chunk of chunks) {
        entries.push({
          instruction: `As ${this.personaName}, explain or discuss: ${transcript.title}`,
          input: '',
          output: chunk
        });
      }
    }

    // Process Twitter data
    if (twitterData && twitterData.tweets) {
      for (const tweet of twitterData.tweets) {
        const text = this.cleanText(tweet.text);
        if (!text || text.length < 20) continue;

        entries.push({
          instruction: `As ${this.personaName}, share a brief thought or social media post.`,
          input: '',
          output: text
        });
      }
    }

    // Save to file
    const outputPath = path.join(this.baseDir, 'training_data_alpaca.json');
    await fs.writeFile(outputPath, JSON.stringify(entries, null, 2), 'utf-8');

    logger.info(`Created Alpaca dataset: ${outputPath}`);
    logger.info(`Total entries: ${entries.length}`);

    return { path: outputPath, entries: entries.length };
  }

  /**
   * Convert to raw text format (for continued pretraining)
   */
  async convertToRawText(options = {}) {
    const youtubeData = await this.loadYouTubeData();
    const twitterData = await this.loadTwitterData();
    const transcripts = this.extractTranscripts(youtubeData);

    const allText = [];

    // Add YouTube transcripts
    for (const transcript of transcripts) {
      const cleanedText = this.cleanText(transcript.text);
      if (cleanedText && cleanedText.length >= 50) {
        allText.push(`### Video: ${transcript.title}\n\n${cleanedText}\n`);
      }
    }

    // Add Twitter content
    if (twitterData && twitterData.tweets) {
      allText.push('\n### Social Media Posts\n');
      for (const tweet of twitterData.tweets) {
        const text = this.cleanText(tweet.text);
        if (text && text.length >= 20) {
          allText.push(text);
        }
      }
    }

    // Save to file
    const outputPath = path.join(this.baseDir, 'training_data_raw.txt');
    await fs.writeFile(outputPath, allText.join('\n\n'), 'utf-8');

    logger.info(`Created raw text dataset: ${outputPath}`);
    logger.info(`Total characters: ${allText.join('\n\n').length}`);

    return { path: outputPath, characters: allText.join('\n\n').length };
  }

  /**
   * Convert to ShareGPT format (conversation format for many training tools)
   */
  async convertToShareGPT(options = {}) {
    const youtubeData = await this.loadYouTubeData();
    const twitterData = await this.loadTwitterData();
    const transcripts = this.extractTranscripts(youtubeData);

    const conversations = [];

    // Process YouTube transcripts
    for (const transcript of transcripts) {
      const cleanedText = this.cleanText(transcript.text);
      if (!cleanedText || cleanedText.length < 50) continue;

      const chunks = this.chunkText(cleanedText, options.maxLength || 2000);

      for (const chunk of chunks) {
        conversations.push({
          conversations: [
            { from: 'human', value: `Tell me about: ${transcript.title}` },
            { from: 'gpt', value: chunk }
          ]
        });
      }
    }

    // Save to file
    const outputPath = path.join(this.baseDir, 'training_data_sharegpt.json');
    await fs.writeFile(outputPath, JSON.stringify(conversations, null, 2), 'utf-8');

    logger.info(`Created ShareGPT dataset: ${outputPath}`);
    logger.info(`Total conversations: ${conversations.length}`);

    return { path: outputPath, conversations: conversations.length };
  }

  /**
   * Generate all dataset formats
   */
  async convertAll(options = {}) {
    logger.info(`Converting data for persona: ${this.personaName}`);

    const results = {
      jsonl: await this.convertToJSONL(options),
      alpaca: await this.convertToAlpaca(options),
      rawText: await this.convertToRawText(options),
      shareGPT: await this.convertToShareGPT(options),
    };

    // Create a summary
    const summaryPath = path.join(this.baseDir, 'dataset_summary.json');
    const summary = {
      personaName: this.personaName,
      generatedAt: new Date().toISOString(),
      datasets: results,
    };
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    logger.info(`\nDataset conversion complete!`);
    logger.info(`Output directory: ${this.baseDir}`);

    return results;
  }
}

export default DatasetConverter;
