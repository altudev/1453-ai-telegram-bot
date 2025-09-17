export interface PlatformLinks {
  youtube: string;
  x: string;
  kick: string;
  twitch: string;
  instagram: string;
  linkedin: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl?: string;
  channelTitle: string;
  channelId: string;
}

export interface LivestreamNotification {
  video: VideoMetadata;
  platforms: PlatformLinks;
  detectedAt: string;
}

export interface WebSubPayload {
  feed: {
    entry: {
      'yt:videoId': string[];
      title: string[];
      published: string[];
      updated: string[];
      'media:group': {
        'media:description': string[];
        'media:thumbnail': Array<{
          $: {
            url: string;
            height: string;
            width: string;
          };
        }>;
      };
    }[];
  };
}

export interface AppConfig {
  youtube: {
    channelId: string;
    apiKey: string;
  };
  telegram: {
    botToken: string;
    chatIds: string[];
  };
  platforms: PlatformLinks;
  server: {
    port: number;
    webhookSecret: string;
  };
  logging: {
    level: string;
  };
  redis: {
    url: string;
  };
}

export interface NotificationResult {
  success: boolean;
  chatId: string;
  error?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    youtube: 'up' | 'down';
    telegram: 'up' | 'down';
    redis: 'up' | 'down';
  };
  uptime: number;
}