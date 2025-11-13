import { google } from 'googleapis';
import axios from 'axios';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import RateLimiter from '../utils/rateLimiter.js';

/**
 * YouTube scraper using official YouTube Data API v3
 */
export class YouTubeScraper {
  constructor() {
    this.apiKey = config.youtube.apiKey;
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    });
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Validate API key
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in .env');
    }
  }

  /**
   * Extract channel ID from various YouTube URL formats or handle
   */
  async getChannelId(handleOrUrl) {
    this.validateConfig();

    // If it's already a channel ID
    if (handleOrUrl.startsWith('UC') && handleOrUrl.length === 24) {
      return handleOrUrl;
    }

    // Remove @ if present
    const handle = handleOrUrl.replace('@', '').replace('https://www.youtube.com/', '').replace('/', '');

    try {
      // Search for channel by username/handle
      const response = await this.rateLimiter.add(() =>
        this.youtube.search.list({
          part: 'snippet',
          q: handle,
          type: 'channel',
          maxResults: 1,
        })
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].snippet.channelId;
      }

      throw new Error(`Channel not found: ${handleOrUrl}`);
    } catch (error) {
      logger.error(`Error getting channel ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId) {
    this.validateConfig();

    try {
      const response = await this.rateLimiter.add(() =>
        this.youtube.channels.list({
          part: 'snippet,statistics,brandingSettings,contentDetails',
          id: channelId,
        })
      );

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      const channel = response.data.items[0];
      logger.info(`Found channel: ${channel.snippet.title}`);

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnails: channel.snippet.thumbnails,
        statistics: {
          viewCount: channel.statistics.viewCount,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
        },
        branding: channel.brandingSettings,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
      };
    } catch (error) {
      logger.error(`Error getting channel info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get videos from channel
   */
  async getVideos(channelId, maxVideos = null) {
    this.validateConfig();
    const limit = maxVideos || config.limits.youtube.maxVideos;

    try {
      // Get channel info to get uploads playlist
      const channelInfo = await this.getChannelInfo(channelId);
      const uploadsPlaylistId = channelInfo.uploadsPlaylistId;

      const videos = [];
      let nextPageToken = null;

      logger.info(`Fetching up to ${limit} videos from channel...`);

      while (videos.length < limit) {
        const response = await this.rateLimiter.add(() =>
          this.youtube.playlistItems.list({
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: Math.min(50, limit - videos.length),
            pageToken: nextPageToken,
          })
        );

        const items = response.data.items || [];

        for (const item of items) {
          videos.push({
            videoId: item.contentDetails.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails,
          });
        }

        nextPageToken = response.data.nextPageToken;
        if (!nextPageToken) break;
      }

      logger.info(`Fetched ${videos.length} videos`);

      // Get detailed statistics for each video
      const detailedVideos = await this.getVideoDetails(videos.map(v => v.videoId));

      return detailedVideos;
    } catch (error) {
      logger.error(`Error getting videos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed video information
   */
  async getVideoDetails(videoIds) {
    this.validateConfig();

    const detailedVideos = [];

    // Process in batches of 50 (API limit)
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);

      const response = await this.rateLimiter.add(() =>
        this.youtube.videos.list({
          part: 'snippet,statistics,contentDetails',
          id: batch.join(','),
        })
      );

      const items = response.data.items || [];

      for (const item of items) {
        detailedVideos.push({
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          tags: item.snippet.tags || [],
          duration: item.contentDetails.duration,
          statistics: {
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            commentCount: item.statistics.commentCount,
          },
        });
      }
    }

    return detailedVideos;
  }

  /**
   * Get video comments
   */
  async getVideoComments(videoId, maxComments = null) {
    this.validateConfig();
    const limit = maxComments || config.limits.youtube.maxComments;

    try {
      const comments = [];
      let nextPageToken = null;

      while (comments.length < limit) {
        const response = await this.rateLimiter.add(() =>
          this.youtube.commentThreads.list({
            part: 'snippet',
            videoId: videoId,
            maxResults: Math.min(100, limit - comments.length),
            pageToken: nextPageToken,
          })
        );

        const items = response.data.items || [];

        for (const item of items) {
          const comment = item.snippet.topLevelComment.snippet;
          comments.push({
            commentId: item.id,
            text: comment.textDisplay,
            author: comment.authorDisplayName,
            likeCount: comment.likeCount,
            publishedAt: comment.publishedAt,
          });
        }

        nextPageToken = response.data.nextPageToken;
        if (!nextPageToken) break;
      }

      logger.info(`Fetched ${comments.length} comments for video ${videoId}`);
      return comments;
    } catch (error) {
      // Comments might be disabled
      logger.warn(`Could not fetch comments for video ${videoId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get video transcript/captions (requires additional API or library)
   * This is a placeholder - you may want to use youtube-transcript library
   */
  async getTranscript(videoId) {
    logger.warn('Transcript fetching requires additional setup. Consider using youtube-transcript npm package.');
    // Placeholder for transcript functionality
    return {
      videoId,
      transcript: 'Transcript fetching not implemented. Use youtube-transcript package.',
    };
  }

  /**
   * Scrape complete channel data
   */
  async scrapeChannel(handleOrUrl, options = {}) {
    this.validateConfig();

    try {
      logger.info(`Starting YouTube scrape for: ${handleOrUrl}`);

      // Get channel ID
      const channelId = await this.getChannelId(handleOrUrl);

      // Get channel info
      const channelInfo = await this.getChannelInfo(channelId);

      // Get videos
      const videos = await this.getVideos(channelId, options.maxVideos);

      // Optionally get comments for recent videos
      if (options.includeComments) {
        logger.info('Fetching comments for recent videos...');
        const recentVideos = videos.slice(0, Math.min(10, videos.length));

        for (const video of recentVideos) {
          video.comments = await this.getVideoComments(video.videoId, options.maxComments);
        }
      }

      const result = {
        platform: 'youtube',
        scrapedAt: new Date().toISOString(),
        channel: channelInfo,
        videos: videos,
      };

      logger.info(`YouTube scrape completed: ${videos.length} videos collected`);
      return result;
    } catch (error) {
      logger.error(`YouTube scrape failed: ${error.message}`);
      throw error;
    }
  }
}

export default YouTubeScraper;
