import { z } from 'zod';
import type { AppConfig, PlatformLinks } from '../types';

const platformLinksSchema = z.object({
  youtube: z.string().url(),
  x: z.string().url(),
  kick: z.string().url(),
  twitch: z.string().url(),
  instagram: z.string().url(),
  linkedin: z.string().url(),
});

const appConfigSchema = z.object({
  youtube: z.object({
    channelId: z.string().min(1),
    apiKey: z.string().min(1),
  }),
  telegram: z.object({
    botToken: z.string().min(1),
    chatConfigs: z.array(z.object({
      chatId: z.string().min(1),
      topicId: z.number().optional(),
    })),
  }),
  platforms: platformLinksSchema,
  server: z.object({
    port: z.number().min(1).max(65535),
    webhookSecret: z.string().min(1),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
  }),
  redis: z.object({
    url: z.string().min(1),
  }),
});

function parsePlatformLinks(platformLinksJson: string): PlatformLinks {
  try {
    const parsed = JSON.parse(platformLinksJson);
    return platformLinksSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid PLATFORM_LINKS format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseTelegramChatConfigs(chatConfigsJson: string) {
  try {
    const parsed = JSON.parse(chatConfigsJson);
    return parsed.map((config: any) => ({
      chatId: config.chatId,
      topicId: config.topicId,
    }));
  } catch (error) {
    throw new Error(`Invalid TELEGRAM_CHAT_CONFIGS format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function loadConfig(): AppConfig {
  const requiredEnvVars = [
    'YOUTUBE_CHANNEL_ID',
    'YOUTUBE_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_CONFIGS',
    'PLATFORM_LINKS',
    'PORT',
    'WEBHOOK_SECRET',
    'LOG_LEVEL',
    'REDIS_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  const config: AppConfig = {
    youtube: {
      channelId: process.env.YOUTUBE_CHANNEL_ID!,
      apiKey: process.env.YOUTUBE_API_KEY!,
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatConfigs: parseTelegramChatConfigs(process.env.TELEGRAM_CHAT_CONFIGS!),
    },
    platforms: parsePlatformLinks(process.env.PLATFORM_LINKS!),
    server: {
      port: parseInt(process.env.PORT!, 10),
      webhookSecret: process.env.WEBHOOK_SECRET!,
    },
    logging: {
      level: process.env.LOG_LEVEL! as 'error' | 'warn' | 'info' | 'debug',
    },
    redis: {
      url: process.env.REDIS_URL!,
    },
  };

  return appConfigSchema.parse(config);
}

export const config = loadConfig();