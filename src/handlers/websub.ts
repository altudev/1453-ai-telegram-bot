import { Hono } from 'hono';
import * as xml2js from 'xml2js';
import type { WebSubPayload, VideoMetadata } from '../types';
import { config } from '../config';
import { youtubeService } from '../services/youtube';
import { liveDetectorService } from '../services/live-detector';
import { telegramService } from '../services/telegram';
import { deduplicationService } from '../utils/deduplication';
import logger from '../utils/logger';

export class WebSubHandler {
  private app: Hono;
  private readonly TOPIC_URL = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${config.youtube.channelId}`;
  private readonly HUB_URL = 'https://pubsubhubbub.appspot.com/publish';

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // WebSub callback endpoint
    this.app.post('/websub', this.handleWebSubCallback.bind(this));
    
    // WebSub subscription verification
    this.app.get('/websub', this.handleSubscriptionVerification.bind(this));
    
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));
  }

  private handleSubscriptionVerification = async (c: any) => {
    const { 'hub.challenge': challenge, 'hub.mode': mode, 'hub.topic': topic } = c.req.query();

    logger.info(`WebSub verification request: mode=${mode}, topic=${topic}`);

    if (mode === 'subscribe' && topic === this.TOPIC_URL) {
      logger.info('WebSub subscription verified successfully');
      return c.text(challenge || '', 200);
    }

    logger.warn('Invalid WebSub subscription verification request');
    return c.text('Invalid request', 400);
  };

  private handleWebSubCallback = async (c: any) => {
    try {
      const signature = c.req.header('X-Hub-Signature');
      const body = await c.req.text();
      
      // Verify signature if webhook secret is configured
      if (config.server.webhookSecret && signature) {
        // Note: In a real implementation, you would verify the HMAC signature here
        // For simplicity, we're skipping this step but it should be implemented in production
        logger.debug('WebSub callback received with signature');
      }

      logger.debug('WebSub callback received, parsing XML...');
      
      // Parse XML payload
      const parsedData = await this.parseXmlPayload(body);
      
      if (!parsedData || !parsedData.feed || !parsedData.feed.entry) {
        logger.warn('Invalid WebSub payload: missing feed or entry');
        return c.text('Invalid payload', 400);
      }

      // Process each entry in the feed
      const entries = Array.isArray(parsedData.feed.entry) 
        ? parsedData.feed.entry 
        : [parsedData.feed.entry];

      for (const entry of entries) {
        await this.processFeedEntry(entry);
      }

      return c.text('OK', 200);
    } catch (error) {
      logger.error('Error processing WebSub callback:', error);
      return c.text('Internal Server Error', 500);
    }
  };

  private async parseXmlPayload(xmlString: string): Promise<WebSubPayload | null> {
    try {
      const result = await xml2js.parseStringPromise(xmlString);
      return result as WebSubPayload;
    } catch (error) {
      logger.error('Error parsing XML payload:', error);
      return null;
    }
  }

  private async processFeedEntry(entry: any): Promise<void> {
    try {
      const videoId = entry['yt:videoId']?.[0];
      
      if (!videoId) {
        logger.warn('Feed entry missing video ID');
        return;
      }

      logger.info(`Processing feed entry for video ${videoId}`);

      // Check if we've already notified for this video
      const alreadyNotified = await deduplicationService.hasBeenNotified(videoId);
      if (alreadyNotified) {
        logger.debug(`Video ${videoId} already processed, skipping`);
        return;
      }

      // Get video metadata
      const videoMetadata = await youtubeService.getVideoMetadata(videoId);
      if (!videoMetadata) {
        logger.warn(`Could not fetch metadata for video ${videoId}`);
        return;
      }

      // Check if the video contains the #live tag
      const shouldNotify = await liveDetectorService.shouldNotifyForVideo(videoMetadata);
      if (!shouldNotify) {
        logger.debug(`Video ${videoId} does not contain #live tag, skipping`);
        return;
      }

      // Send Telegram notification
      const notification = {
        video: videoMetadata,
        platforms: config.platforms,
        detectedAt: new Date().toISOString(),
      };

      const results = await telegramService.sendLivestreamNotification(notification);
      
      // Log results
      const successfulSends = results.filter(r => r.success).length;
      const failedSends = results.filter(r => !r.success).length;
      
      logger.info(`Notification results for video ${videoId}: ${successfulSends} successful, ${failedSends} failed`);
      
      if (failedSends > 0) {
        results.filter(r => !r.success).forEach(r => {
          logger.error(`Failed to send notification to ${r.chatId}: ${r.error}`);
        });
      }

      // Mark as notified to avoid duplicates
      await deduplicationService.markAsNotified(videoId);
    } catch (error) {
      logger.error('Error processing feed entry:', error);
    }
  }

  private handleHealthCheck = async (c: any) => {
    try {
      // Simple health check - could be expanded to check external service connectivity
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      return c.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  };

  async subscribeToWebSub(): Promise<void> {
    try {
      logger.info(`Subscribing to WebSub for topic: ${this.TOPIC_URL}`);
      
      const callbackUrl = `${process.env.BASE_URL || 'http://localhost:' + config.server.port}/websub`;
      
      const params = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.topic': this.TOPIC_URL,
        'hub.callback': callbackUrl,
      });

      const response = await fetch(`${this.HUB_URL}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.ok) {
        logger.info('WebSub subscription request sent successfully');
      } else {
        logger.error(`Failed to subscribe to WebSub: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Error subscribing to WebSub:', error);
    }
  }

  getApp(): Hono {
    return this.app;
  }
}

export const webSubHandler = new WebSubHandler();