import Redis from 'ioredis';
import { config } from '../config';
import logger from './logger';

class DeduplicationService {
  private redis: Redis;
  private readonly KEY_PREFIX = 'youtube-livestream:';
  private readonly TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new Redis(config.redis.url);
    
    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
    
    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  async hasBeenNotified(videoId: string): Promise<boolean> {
    try {
      const key = `${this.KEY_PREFIX}${videoId}`;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking if video has been notified:', error);
      // In case of Redis failure, assume it hasn't been notified to avoid missing notifications
      return false;
    }
  }

  async markAsNotified(videoId: string): Promise<void> {
    try {
      const key = `${this.KEY_PREFIX}${videoId}`;
      await this.redis.setex(key, this.TTL_SECONDS, '1');
      logger.info(`Marked video ${videoId} as notified`);
    } catch (error) {
      logger.error('Error marking video as notified:', error);
    }
  }

  async clearNotification(videoId: string): Promise<void> {
    try {
      const key = `${this.KEY_PREFIX}${videoId}`;
      await this.redis.del(key);
      logger.info(`Cleared notification status for video ${videoId}`);
    } catch (error) {
      logger.error('Error clearing notification status:', error);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const deduplicationService = new DeduplicationService();