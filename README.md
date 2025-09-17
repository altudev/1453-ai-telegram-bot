# 1453-ai-telegram-bot

YouTube Livestream Telegram Notification Bot that monitors YouTube's PubSub notifications for video description updates, detects the "#live" tag, and sends notifications to Telegram channels.

## Features

- Monitors YouTube channel for new videos via WebSub (PubSubHubbub)
- Detects "#live" tag in video descriptions
- Sends formatted notifications to Telegram channels
- Turkish language support for notifications
- Deduplication to prevent repeated notifications
- Error handling and retry mechanisms
- Health check endpoint
- Docker support for easy deployment

## Prerequisites

- Node.js 18+ or Bun 1.2.22+
- Redis server (for deduplication)
- YouTube Data API key
- Telegram bot token
- YouTube channel ID

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/1453-ai-telegram-bot.git
cd 1453-ai-telegram-bot
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration:
```env
# YouTube Configuration
YOUTUBE_CHANNEL_ID=UCyour_channel_id_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_IDS=chat_id_1,chat_id_2,chat_id_3

# Platform Links (JSON format)
PLATFORM_LINKS={"youtube":"https://youtube.com/@yourchannel","x":"https://x.com/yourusername","kick":"https://kick.com/yourusername","twitch":"https://twitch.tv/yourusername","instagram":"https://instagram.com/yourusername","linkedin":"https://linkedin.com/in/yourusername"}

# Server Configuration
PORT=3000
WEBHOOK_SECRET=your_webhook_secret_here
BASE_URL=https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info

# Redis Configuration (for deduplication)
REDIS_URL=redis://localhost:6379
```

## Running the Application

### Development

```bash
bun run dev
```

### Production

```bash
bun run start
```

## Docker Deployment

### Building the Docker Image

```bash
docker build -t 1453-ai-telegram-bot .
```

### Running with Docker

```bash
docker run -d \
  --name 1453-ai-telegram-bot \
  -p 3000:3000 \
  -e YOUTUBE_CHANNEL_ID=your_channel_id \
  -e YOUTUBE_API_KEY=your_api_key \
  -e TELEGRAM_BOT_TOKEN=your_bot_token \
  -e TELEGRAM_CHAT_IDS=your_chat_ids \
  -e PLATFORM_LINKS='{"youtube":"https://youtube.com/@yourchannel","x":"https://x.com/yourusername","kick":"https://kick.com/yourusername","twitch":"https://twitch.tv/yourusername","instagram":"https://instagram.com/yourusername","linkedin":"https://linkedin.com/in/yourusername"}' \
  -e WEBHOOK_SECRET=your_webhook_secret \
  -e BASE_URL=https://yourdomain.com \
  -e REDIS_URL=redis://redis:6379 \
  1453-ai-telegram-bot
```

### Coolify Deployment

1. Create a new application in Coolify
2. Connect your Git repository
3. Use the provided `coolify.yaml` configuration
4. Set up the required environment variables in Coolify
5. Deploy the application

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /websub` - WebSub subscription verification
- `POST /websub` - WebSub callback endpoint

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_CHANNEL_ID` | The YouTube channel ID to monitor | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API key | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes |
| `TELEGRAM_CHAT_IDS` | Comma-separated list of Telegram chat IDs | Yes |
| `PLATFORM_LINKS` | JSON string with platform links | Yes |
| `PORT` | Port for the HTTP server | No (default: 3000) |
| `WEBHOOK_SECRET` | Secret for verifying WebSub callbacks | Yes |
| `BASE_URL` | Base URL for WebSub callbacks | Yes |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | No (default: info) |
| `REDIS_URL` | Redis connection URL | Yes |

### Platform Links Format

The `PLATFORM_LINKS` environment variable should be a JSON string with the following structure:

```json
{
  "youtube": "https://youtube.com/@yourchannel",
  "x": "https://x.com/yourusername",
  "kick": "https://kick.com/yourusername",
  "twitch": "https://twitch.tv/yourusername",
  "instagram": "https://instagram.com/yourusername",
  "linkedin": "https://linkedin.com/in/yourusername"
}
```

## Monitoring and Logging

- Logs are written to both console and files (`logs/error.log` and `logs/combined.log`)
- Health check endpoint available at `/health`
- Structured logging with Winston

## Troubleshooting

### Common Issues

1. **WebSub subscription fails**
   - Ensure the `BASE_URL` is correctly set and accessible from the internet
   - Check that the webhook secret matches between your application and YouTube

2. **Telegram notifications not sending**
   - Verify the bot token is correct
   - Ensure the bot has permission to send messages to the specified chat IDs
   - Check the logs for error messages

3. **Redis connection errors**
   - Verify Redis is running and accessible
   - Check the `REDIS_URL` environment variable

4. **YouTube API errors**
   - Verify the API key is correct and has the necessary permissions
   - Check if you've exceeded the API quota

### Manual Override

To manually trigger a notification, you can use the `/notify` command in Telegram (if implemented).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
