import axios from 'axios';
import type { VideoMetadata } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class YouTubeService {
  private readonly API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    try {
      const response = await this.makeRequestWithRetry(async () => {
        return axios.get(`${this.API_BASE_URL}/videos`, {
          params: {
            part: 'snippet',
            id: videoId,
            key: config.youtube.apiKey,
          },
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.warn(`No video found with ID: ${videoId}`);
        return null;
      }

      const item = response.data.items[0];
      const snippet = item.snippet;

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        publishedAt: snippet.publishedAt,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
        channelTitle: snippet.channelTitle,
        channelId: snippet.channelId,
      };
    } catch (error) {
      logger.error(`Error fetching video metadata for ${videoId}:`, error);
      return null;
    }
  }

  async getChannelVideos(channelId: string, maxResults = 10): Promise<VideoMetadata[]> {
    try {
      const response = await this.makeRequestWithRetry(async () => {
        return axios.get(`${this.API_BASE_URL}/search`, {
          params: {
            part: 'snippet',
            channelId,
            maxResults,
            order: 'date',
            type: 'video',
            key: config.youtube.apiKey,
          },
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.warn(`No videos found for channel: ${channelId}`);
        return [];
      }

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
      }));
    } catch (error) {
      logger.error(`Error fetching channel videos for ${channelId}:`, error);
      return [];
    }
  }

  private async makeRequestWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || this.RETRY_DELAY_MS;
          const delay = parseInt(retryAfter as string, 10) * 1000 || this.RETRY_DELAY_MS * attempt;
          
          logger.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
        } else if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * attempt;
          logger.warn(`Request failed. Retrying in ${delay}ms (attempt ${attempt}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const youtubeService = new YouTubeService();