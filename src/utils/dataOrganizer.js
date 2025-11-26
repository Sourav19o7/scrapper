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
      version: '3.0',

      // Core content types
      conversations: [], // For conversational AI training
      monologues: [], // For long-form content like YouTube transcripts
      posts: [], // All posts across platforms with full context

      // Persona characteristics extracted from content
      personaProfile: {
        ideology: [], // Core beliefs and worldview
        beliefs: [], // Specific beliefs mentioned
        values: [], // What they value and prioritize
        financialPhilosophy: [], // Financial advice and philosophy
        decisionPatterns: [], // How they make decisions
        topicExpertise: [], // Topics they discuss frequently
        commonPhrases: [], // Signature phrases and expressions
        communicationStyle: {
          tone: '',
          vocabulary: [],
          rhetoricalDevices: [],
        },
      },

      // Metadata
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
            // Create comprehensive post entry
            const post = {
              id: video.videoId,
              platform: 'youtube',
              type: 'video_transcript',
              title: video.title,
              text: video.transcript.fullText,
              description: video.description,
              metadata: {
                publishedAt: video.publishedAt,
                duration: video.duration,
                viewCount: video.statistics?.viewCount,
                likeCount: video.statistics?.likeCount,
                commentCount: video.statistics?.commentCount,
                tags: video.tags || [],
              },
              wordCount: video.transcript.fullText.split(/\s+/).length,
              segmentCount: video.transcript.segmentCount,
            };

            // Add to posts
            trainingData.posts.push(post);

            // Also add to monologues for backwards compatibility
            trainingData.monologues.push({
              id: video.videoId,
              platform: 'youtube',
              type: 'video_transcript',
              title: video.title,
              text: video.transcript.fullText,
              metadata: post.metadata,
              wordCount: post.wordCount,
              segmentCount: post.segmentCount,
            });

            // Extract ideology and thought patterns
            this.extractIdeologyFromText(
              video.transcript.fullText,
              video.title,
              video.description,
              trainingData.personaProfile
            );

            // Extract topics from tags and description
            if (video.tags && video.tags.length > 0) {
              video.tags.forEach(tag => {
                const normalized = tag.toLowerCase();
                if (!trainingData.personaProfile.topicExpertise.includes(normalized)) {
                  trainingData.personaProfile.topicExpertise.push(normalized);
                }
              });
            }
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

    // Analyze persona profile
    this.analyzePersonaProfile(trainingData.personaProfile);

    // Calculate statistics
    trainingData.metadata.totalSamples = trainingData.conversations.length + trainingData.monologues.length + trainingData.posts.length;
    trainingData.metadata.statistics = {
      totalConversations: trainingData.conversations.length,
      totalMonologues: trainingData.monologues.length,
      totalPosts: trainingData.posts.length,
      totalWords: trainingData.posts.reduce((sum, p) => sum + (p.wordCount || 0), 0),
      averageWordsPerPost: trainingData.posts.length > 0
        ? Math.round(trainingData.posts.reduce((sum, p) => sum + (p.wordCount || 0), 0) / trainingData.posts.length)
        : 0,
      topicsCovered: trainingData.personaProfile.topicExpertise.length,
      ideologicalStatements: trainingData.personaProfile.ideology.length,
      financialAdvice: trainingData.personaProfile.financialPhilosophy.length,
    };

    const exportPath = path.join(this.baseDir, 'training_dataset.json');
    await fs.writeFile(exportPath, JSON.stringify(trainingData, null, 2), 'utf-8');
    logger.info(`Exported training dataset to ${exportPath}`);
    logger.info(`Dataset contains ${trainingData.metadata.totalSamples} total items:`);
    logger.info(`  - ${trainingData.posts.length} posts`);
    logger.info(`  - ${trainingData.monologues.length} monologues`);
    logger.info(`  - ${trainingData.conversations.length} conversations`);
    logger.info(`  - ${trainingData.personaProfile.ideology.length} ideology statements`);
    logger.info(`  - ${trainingData.personaProfile.financialPhilosophy.length} financial advice items`);

    // Also export simplified formats
    await this.exportSimplifiedFormats(trainingData);

    // Export persona profile separately
    await this.exportPersonaProfile(trainingData.personaProfile);

    return exportPath;
  }

  /**
   * Extract ideology and thought patterns from text
   */
  extractIdeologyFromText(text, title, _description, profile) {
    if (!text) return;

    // Financial philosophy patterns
    const financialPatterns = [
      { pattern: /\b(invest|investment|investing|portfolio|asset|stock|mutual fund|equity|debt|sip)\b/gi, category: 'investment_advice' },
      { pattern: /\b(budget|budgeting|expense|saving|save money|financial plan)\b/gi, category: 'budgeting' },
      { pattern: /\b(debt|loan|emi|credit card|liability|borrow)\b/gi, category: 'debt_management' },
      { pattern: /\b(wealth|rich|financial freedom|retire|retirement|fire)\b/gi, category: 'wealth_building' },
      { pattern: /\b(risk|diversif|return|profit|loss|market)\b/gi, category: 'risk_management' },
      { pattern: /\b(tax|taxation|tax saving|deduction|exemption)\b/gi, category: 'tax_planning' },
      { pattern: /\b(insurance|health insurance|term insurance|cover)\b/gi, category: 'insurance' },
      { pattern: /\b(emergency fund|liquidity|cash reserve)\b/gi, category: 'emergency_planning' },
    ];

    // Ideology patterns
    const ideologyPatterns = [
      { pattern: /\b(i believe|i think|in my opinion|my view|personally)\b/gi, type: 'belief' },
      { pattern: /\b(should|must|need to|have to|important to)\b/gi, type: 'directive' },
      { pattern: /\b(always|never|every time|whenever)\b/gi, type: 'principle' },
      { pattern: /\b(because|since|therefore|that's why|reason)\b/gi, type: 'reasoning' },
    ];

    // Extract financial philosophy
    financialPatterns.forEach(({ pattern, category }) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 5) { // Only if topic appears frequently
        const sentences = this.extractSentencesContaining(text, pattern);
        sentences.slice(0, 10).forEach(sentence => {
          if (sentence.length > 20 && sentence.length < 300) {
            profile.financialPhilosophy.push({
              category,
              statement: sentence.trim(),
              frequency: matches.length,
            });
          }
        });
      }
    });

    // Extract ideology statements
    ideologyPatterns.forEach(({ pattern, type }) => {
      const sentences = this.extractSentencesContaining(text, pattern);
      sentences.slice(0, 5).forEach(sentence => {
        if (sentence.length > 30 && sentence.length < 300) {
          profile.ideology.push({
            type,
            statement: sentence.trim(),
            source: title || 'video',
          });
        }
      });
    });

    // Extract decision patterns (sentences with decision words)
    const decisionPatterns = /\b(decide|decision|choose|chose|select|prefer|recommend|suggest)\b/gi;
    const decisionSentences = this.extractSentencesContaining(text, decisionPatterns);
    decisionSentences.slice(0, 5).forEach(sentence => {
      if (sentence.length > 30 && sentence.length < 300) {
        profile.decisionPatterns.push({
          statement: sentence.trim(),
          context: title || 'video',
        });
      }
    });

    // Extract values (what they consider important)
    const valuePatterns = /\b(important|essential|crucial|key|critical|matter|value|priority|focus)\b/gi;
    const valueSentences = this.extractSentencesContaining(text, valuePatterns);
    valueSentences.slice(0, 3).forEach(sentence => {
      if (sentence.length > 30 && sentence.length < 300) {
        profile.values.push({
          statement: sentence.trim(),
          source: title || 'video',
        });
      }
    });

    // Extract common phrases (repeated patterns)
    const phrases = this.extractCommonPhrases(text);
    phrases.forEach(phrase => {
      if (!profile.commonPhrases.find(p => p.phrase === phrase.phrase)) {
        profile.commonPhrases.push(phrase);
      }
    });
  }

  /**
   * Extract sentences containing a specific pattern
   */
  extractSentencesContaining(text, pattern) {
    const sentences = text.split(/[.!?]+/);
    return sentences.filter(s => pattern.test(s));
  }

  /**
   * Extract common phrases from text
   */
  extractCommonPhrases(text) {
    const commonPhrases = [];

    // Look for repeated 2-5 word phrases
    const words = text.toLowerCase().split(/\s+/);
    const phraseCounts = {};

    for (let len = 2; len <= 5; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 10 && phrase.length < 50) {
          phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
      }
    }

    // Get phrases that appear at least 3 times
    Object.entries(phraseCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([phrase, count]) => {
        commonPhrases.push({ phrase, frequency: count });
      });

    return commonPhrases;
  }

  /**
   * Analyze and summarize persona profile
   */
  analyzePersonaProfile(profile) {
    // Deduplicate and count
    profile.ideology = [...new Map(profile.ideology.map(item => [item.statement, item])).values()];
    profile.financialPhilosophy = [...new Map(profile.financialPhilosophy.map(item => [item.statement, item])).values()];
    profile.decisionPatterns = [...new Map(profile.decisionPatterns.map(item => [item.statement, item])).values()];
    profile.values = [...new Map(profile.values.map(item => [item.statement, item])).values()];

    // Limit to most relevant
    profile.ideology = profile.ideology.slice(0, 50);
    profile.financialPhilosophy = profile.financialPhilosophy.slice(0, 50);
    profile.decisionPatterns = profile.decisionPatterns.slice(0, 30);
    profile.values = profile.values.slice(0, 30);
    profile.commonPhrases = profile.commonPhrases.slice(0, 30);
    profile.topicExpertise = [...new Set(profile.topicExpertise)].slice(0, 50);

    // Determine communication style
    const allText = profile.ideology.map(i => i.statement).join(' ') +
                    profile.financialPhilosophy.map(f => f.statement).join(' ');

    if (allText.includes('should') || allText.includes('must')) {
      profile.communicationStyle.tone = 'directive';
    } else if (allText.includes('i think') || allText.includes('in my opinion')) {
      profile.communicationStyle.tone = 'conversational';
    } else {
      profile.communicationStyle.tone = 'informative';
    }
  }

  /**
   * Export persona profile separately
   */
  async exportPersonaProfile(profile) {
    const profilePath = path.join(this.baseDir, 'persona_profile.json');
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
    logger.info(`Exported persona profile to ${profilePath}`);

    // Also export as markdown for easy reading
    const mdPath = path.join(this.baseDir, 'persona_profile.md');
    const markdown = this.generatePersonaProfileMarkdown(profile);
    await fs.writeFile(mdPath, markdown, 'utf-8');
    logger.info(`Exported persona profile markdown to ${mdPath}`);
  }

  /**
   * Generate readable markdown for persona profile
   */
  generatePersonaProfileMarkdown(profile) {
    let md = `# Persona Profile\n\n`;
    md += `Generated on: ${new Date().toISOString()}\n\n`;

    md += `## Communication Style\n\n`;
    md += `- **Tone**: ${profile.communicationStyle.tone}\n\n`;

    md += `## Topic Expertise\n\n`;
    profile.topicExpertise.slice(0, 20).forEach(topic => {
      md += `- ${topic}\n`;
    });
    md += `\n`;

    md += `## Financial Philosophy\n\n`;
    const categories = {};
    profile.financialPhilosophy.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item.statement);
    });
    Object.entries(categories).forEach(([category, statements]) => {
      md += `### ${category.replace(/_/g, ' ').toUpperCase()}\n\n`;
      statements.slice(0, 5).forEach(stmt => {
        md += `- ${stmt}\n`;
      });
      md += `\n`;
    });

    md += `## Core Beliefs & Ideology\n\n`;
    profile.ideology.slice(0, 15).forEach(item => {
      md += `- **[${item.type}]** ${item.statement}\n`;
    });
    md += `\n`;

    md += `## Decision Patterns\n\n`;
    profile.decisionPatterns.slice(0, 10).forEach(item => {
      md += `- ${item.statement}\n`;
    });
    md += `\n`;

    md += `## Values\n\n`;
    profile.values.slice(0, 10).forEach(item => {
      md += `- ${item.statement}\n`;
    });
    md += `\n`;

    md += `## Common Phrases\n\n`;
    profile.commonPhrases.slice(0, 15).forEach(item => {
      md += `- "${item.phrase}" (used ${item.frequency}x)\n`;
    });
    md += `\n`;

    return md;
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
