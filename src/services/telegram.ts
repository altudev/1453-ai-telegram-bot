import { Bot } from 'grammy';
import type { NotificationResult, LivestreamNotification } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import { youtubeService } from '../services/youtube';
import { liveDetectorService } from '../services/live-detector';
import { deduplicationService } from '../utils/deduplication';

export class TelegramService {
  private bot: Bot;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  constructor() {
    this.bot = new Bot(config.telegram.botToken);
    this.setupErrorHandling();
    this.setupCommandHandlers();
  }

  private setupErrorHandling(): void {
    this.bot.catch((err) => {
      logger.error('Telegram bot error:', err);
    });
  }

  async sendLivestreamNotification(notification: LivestreamNotification): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    for (const chatId of config.telegram.chatIds) {
      const result = await this.sendToChatWithRetry(chatId, notification);
      results.push(result);
    }

    return results;
  }

  private async sendToChatWithRetry(chatId: string, notification: LivestreamNotification): Promise<NotificationResult> {
    let lastError: Error | undefined;
    const timestamp = new Date().toISOString();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const message = this.formatNotificationMessage(notification);
        await this.bot.api.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          link_preview_options: {
            is_disabled: false,
          },
        });

        logger.info(`Successfully sent notification to chat ${chatId} for video ${notification.video.id}`);
        return {
          success: true,
          chatId,
          timestamp,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * attempt;
          logger.warn(`Failed to send notification to chat ${chatId}. Retrying in ${delay}ms (attempt ${attempt}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
        }
      }
    }

    logger.error(`Failed to send notification to chat ${chatId} after ${this.MAX_RETRIES} attempts:`, lastError);
    return {
      success: false,
      chatId,
      error: lastError?.message || 'Unknown error',
      timestamp,
    };
  }

  private formatNotificationMessage(notification: LivestreamNotification): string {
    const { video, platforms } = notification;
    const formattedDate = new Date(video.publishedAt).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
🔴 <b>YAYINDA!</b>

<b>${video.title}</b>

📅 ${formattedDate}

📺 <b>İzleme Linkleri:</b>
🔹 YouTube: <a href="${platforms.youtube}">YouTube'da İzle</a>
🔹 X (Twitter): <a href="${platforms.x}">X'te İzle</a>
🔹 Kick: <a href="${platforms.kick}">Kick'te İzle</a>
🔹 Twitch: <a href="${platforms.twitch}">Twitch'te İzle</a>
🔹 Instagram: <a href="${platforms.instagram}">Instagram'da İzle</a>
🔹 LinkedIn: <a href="${platforms.linkedin}">LinkedIn'de İzle</a>

👉 Canlı yayını kaçırmayın! Tüm platformlarda aynı anda yayındayız.

#1453ai #yayın #canlı
    `.trim();
  }

  async sendManualNotification(videoId: string): Promise<NotificationResult[]> {
    try {
      logger.info(`Manual notification requested for video ${videoId}`);
      
      // Get video metadata
      const videoMetadata = await youtubeService.getVideoMetadata(videoId);
      if (!videoMetadata) {
        logger.warn(`Could not fetch metadata for video ${videoId}`);
        return [];
      }

      // Check if the video contains the #live tag
      const shouldNotify = await liveDetectorService.shouldNotifyForVideo(videoMetadata);
      if (!shouldNotify) {
        logger.warn(`Video ${videoId} does not contain #live tag, skipping manual notification`);
        return [];
      }

      // Send Telegram notification
      const notification = {
        video: videoMetadata,
        platforms: config.platforms,
        detectedAt: new Date().toISOString(),
      };

      const results = await this.sendLivestreamNotification(notification);
      
      // Log results
      const successfulSends = results.filter(r => r.success).length;
      const failedSends = results.filter(r => !r.success).length;
      
      logger.info(`Manual notification results for video ${videoId}: ${successfulSends} successful, ${failedSends} failed`);
      
      if (failedSends > 0) {
        results.filter(r => !r.success).forEach(r => {
          logger.error(`Failed to send manual notification to ${r.chatId}: ${r.error}`);
        });
      }

      // Mark as notified to avoid duplicates
      await deduplicationService.markAsNotified(videoId);
      
      return results;
    } catch (error) {
      logger.error(`Error sending manual notification for video ${videoId}:`, error);
      return [];
    }
  }

  async setupBotCommands(): Promise<void> {
    try {
      await this.bot.api.setMyCommands([
        { command: 'start', description: 'Botu başlat' },
        { command: 'help', description: 'Yardım bilgileri' },
        { command: 'notify', description: 'Son canlı yayın bildirimini gönder' },
      ]);
      logger.info('Bot commands set up successfully');
    } catch (error) {
      logger.error('Error setting up bot commands:', error);
    }
  }

  async startBot(): Promise<void> {
    try {
      await this.setupBotCommands();
      this.bot.start();
      logger.info('Telegram bot started successfully');
    } catch (error) {
      logger.error('Error starting Telegram bot:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupCommandHandlers(): void {
    // Start command
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        '👋 Merhaba! Ben 1453 AI Telegram Bot.\n\n' +
        'YouTube kanalındaki yeni canlı yayınları takip ederim ve "#live" etiketi içeren videolar hakkında bildirim gönderirim.\n\n' +
        'Komutlar:\n' +
        '/start - Botu başlat\n' +
        '/help - Yardım bilgileri\n' +
        '/notify - Son canlı yayın bildirimini gönder'
      );
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '🔹 *Yardım Bilgileri*\n\n' +
        'Bu bot, YouTube kanalındaki yeni videoları izler ve "#live" etiketi içeren videolar hakkında Telegram kanalına bildirim gönderir.\n\n' +
        '*Komutlar:*\n' +
        '/start - Botu başlat\n' +
        '/help - Bu yardım mesajını göster\n' +
        '/notify - Son canlı yayın bildirimini manuel olarak gönder\n\n' +
        'Sorularınız için lütfen yönetici ile iletişime geçin.',
        { parse_mode: 'Markdown' }
      );
    });

    // Notify command
    this.bot.command('notify', async (ctx) => {
      try {
        // Check if user is authorized
        if (!this.isAuthorizedUser(ctx.from?.id)) {
          await ctx.reply('⚠️ Bu komutu kullanma yetkiniz yok.');
          return;
        }

        // Get the latest video from the channel
        const videos = await youtubeService.getChannelVideos(config.youtube.channelId, 1);
        if (videos.length === 0) {
          await ctx.reply('⚠️ Kanalda video bulunamadı.');
          return;
        }

        const latestVideo = videos[0];
        if (!latestVideo) {
          await ctx.reply('⚠️ Kanalda video bulunamadı.');
          return;
        }

        await ctx.reply(`🔔 "${latestVideo.title}" videosi için bildirim gönderiliyor...`);

        // Send manual notification
        const results = await this.sendManualNotification(latestVideo.id);
        const successfulSends = results.filter(r => r.success).length;
        const failedSends = results.filter(r => !r.success).length;

        if (successfulSends > 0) {
          await ctx.reply(`✅ Bildirim ${successfulSends} kanala başarıyla gönderildi.`);
        }

        if (failedSends > 0) {
          await ctx.reply(`⚠️ ${failedSends} kanala bildirim gönderilemedi.`);
        }
      } catch (error) {
        logger.error('Error in /notify command:', error);
        await ctx.reply('⚠️ Bildirim gönderilirken bir hata oluştu.');
      }
    });
  }

  private isAuthorizedUser(userId?: number): boolean {
    if (!userId) return false;
    
    // In a real implementation, you would check against a list of authorized user IDs
    // For simplicity, we'll allow all users for now
    return true;
  }
}

export const telegramService = new TelegramService();