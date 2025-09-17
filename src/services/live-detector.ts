import type { VideoMetadata } from '../types';
import logger from '../utils/logger';

export class LiveDetectorService {
  private readonly LIVE_TAG_PATTERN = /#live\b/i;

  containsLiveTag(description: string): boolean {
    return this.LIVE_TAG_PATTERN.test(description);
  }

  extractLiveTagContext(description: string, contextLength = 50): string | null {
    const match = description.match(this.LIVE_TAG_PATTERN);
    if (!match) return null;

    const index = match.index!;
    const startIndex = Math.max(0, index - contextLength);
    const endIndex = Math.min(description.length, index + match[0].length + contextLength);
    
    return description.substring(startIndex, endIndex);
  }

  async shouldNotifyForVideo(videoMetadata: VideoMetadata): Promise<boolean> {
    try {
      const hasLiveTag = this.containsLiveTag(videoMetadata.description);
      
      if (hasLiveTag) {
        const context = this.extractLiveTagContext(videoMetadata.description);
        logger.info(`Detected #live tag in video "${videoMetadata.title}" (ID: ${videoMetadata.id}). Context: "${context}"`);
      } else {
        logger.debug(`No #live tag found in video "${videoMetadata.title}" (ID: ${videoMetadata.id})`);
      }

      return hasLiveTag;
    } catch (error) {
      logger.error(`Error checking for #live tag in video ${videoMetadata.id}:`, error);
      // In case of error, don't notify to avoid false positives
      return false;
    }
  }
}

export const liveDetectorService = new LiveDetectorService();