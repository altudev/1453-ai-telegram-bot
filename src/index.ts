import { serve } from 'bun';
import { config } from './config';
import { webSubHandler } from './handlers/websub';
import { telegramService } from './services/telegram';
import { deduplicationService } from './utils/deduplication';
import logger from './utils/logger';

class Application {
  private server: any;
  private isShuttingDown = false;

  async start(): Promise<void> {
    try {
      logger.info('Starting YouTube Livestream Telegram Notification Bot...');
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`YouTube Channel ID: ${config.youtube.channelId}`);
      logger.info(`Telegram Chat Configs: ${JSON.stringify(config.telegram.chatConfigs)}`);

      // Subscribe to WebSub
      await webSubHandler.subscribeToWebSub();

      // Start Telegram bot
      await telegramService.startBot();

      // Start HTTP server
      const app = webSubHandler.getApp();
      this.server = serve({
        fetch: app.fetch,
        port: config.server.port,
      });

      logger.info(`HTTP server started on port ${config.server.port}`);

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Application started successfully');
    } catch (error) {
      logger.error('Failed to start application:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal');
        return;
      }

      logger.info(`Received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;
      await this.shutdown();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  private async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down application...');

      // Stop HTTP server
      if (this.server) {
        logger.info('Stopping HTTP server...');
        this.server.stop();
        logger.info('HTTP server stopped');
      }

      // Close Redis connection
      logger.info('Closing Redis connection...');
      await deduplicationService.close();
      logger.info('Redis connection closed');

      logger.info('Application shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    } finally {
      process.exit(this.isShuttingDown ? 0 : 1);
    }
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Unhandled error in application startup:', error);
  process.exit(1);
});