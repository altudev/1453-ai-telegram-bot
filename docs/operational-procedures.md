# Operational Procedures

## Table of Contents
1. [Deployment](#deployment)
2. [Monitoring](#monitoring)
3. [Troubleshooting](#troubleshooting)
4. [Maintenance](#maintenance)
5. [Backup and Recovery](#backup-and-recovery)

## Deployment

### Prerequisites
- Access to the Coolify platform
- Redis server instance
- YouTube Data API key
- Telegram bot token
- YouTube channel ID
- Telegram chat IDs and optional topic IDs

### Deployment Steps

1. **Prepare Environment Variables**
   - Gather all required environment variables
   - Ensure they are properly formatted
   - For `TELEGRAM_CHAT_CONFIGS`, use the JSON format with optional topic IDs
   - Test them locally before deployment

2. **Deploy to Coolify**
   - Connect your Git repository to Coolify
   - Use the provided `coolify.yaml` configuration
   - Set up the required environment variables in Coolify
   - Deploy the application

3. **Verify Deployment**
   - Check the health endpoint: `GET /health`
   - Verify logs in Coolify dashboard
   - Test WebSub subscription

4. **Post-Deployment Checks**
   - Verify Telegram bot is responding to commands
   - Check Redis connection
   - Test notification flow with a test video

### Rollback Procedure

1. In Coolify, navigate to the application
2. Select the previous version from the deployment history
3. Click "Redeploy" to rollback to that version
4. Verify the application is functioning correctly

## Monitoring

### Health Checks

The application provides a health check endpoint at `/health` that returns:
- Application status
- Timestamp
- Uptime

### Logging

- Logs are written to both console and files (`logs/error.log` and `logs/combined.log`)
- Log levels: error, warn, info, debug
- Structured logging with Winston

### Monitoring Metrics

Monitor the following metrics:
- HTTP response times
- Error rates
- Memory usage
- CPU usage
- Redis connection status

### Alerting

Set up alerts for:
- Application downtime (health check failures)
- High error rates
- Memory or CPU usage exceeding thresholds
- Redis connection failures

## Troubleshooting

### Common Issues

#### 1. WebSub Subscription Fails

**Symptoms:**
- No notifications received for new videos
- Logs show subscription errors

**Causes:**
- Incorrect BASE_URL configuration
- Firewall blocking incoming requests
- Invalid webhook secret

**Solutions:**
- Verify BASE_URL is correct and accessible
- Check firewall settings
- Ensure webhook secret matches between application and YouTube

#### 2. Telegram Notifications Not Sending

**Symptoms:**
- No Telegram messages received
- Logs show Telegram API errors

**Causes:**
- Invalid bot token
- Bot doesn't have permission to send messages
- Rate limiting by Telegram
- Invalid chat or topic IDs
- Incorrect `TELEGRAM_CHAT_CONFIGS` JSON format

**Solutions:**
- Verify bot token is correct
- Ensure bot is added to the channel with appropriate permissions
- Check for rate limiting and implement backoff
- Verify chat and topic IDs are correct
- Ensure `TELEGRAM_CHAT_CONFIGS` is valid JSON
- Test with a simple message to verify connectivity

#### 3. Redis Connection Errors

**Symptoms:**
- Application fails to start
- Deduplication not working
- Logs show Redis connection errors

**Causes:**
- Redis server not running
- Incorrect REDIS_URL
- Network connectivity issues

**Solutions:**
- Verify Redis server is running
- Check REDIS_URL configuration
- Test network connectivity

#### 4. YouTube API Errors

**Symptoms:**
- Failed to fetch video metadata
- Logs show YouTube API errors

**Causes:**
- Invalid API key
- API quota exceeded
- Incorrect channel ID

**Solutions:**
- Verify API key is correct and has necessary permissions
- Check API quota usage
- Verify channel ID is correct

### Diagnostic Commands

#### Health Check
```bash
curl https://yourdomain.com/health
```

#### Check Logs
```bash
# In Coolify dashboard, check application logs
# Or if using SSH:
docker logs <container_id>
```

#### Test Redis Connection
```bash
# Connect to Redis container
docker exec -it <redis_container_id> redis-cli
# Test connection
PING
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor application logs for errors
- Check notification delivery rates

#### Weekly
- Verify WebSub subscription is active
- Check Redis memory usage
- Review system resource usage

#### Monthly
- Update dependencies
- Review and rotate secrets if necessary
- Check for YouTube API quota usage

### Dependency Updates

1. Check for outdated packages:
```bash
bun outdated
```

2. Update packages:
```bash
bun update
```

3. Test the application after updates:
```bash
bun run test
```

### Secret Rotation

1. Generate new secrets:
   - YouTube API key
   - Telegram bot token
   - Webhook secret

2. Update environment variables in Coolify

3. Redeploy the application

4. Verify the application is functioning correctly

## Backup and Recovery

### What to Back Up

1. **Application Code**
   - Git repository

2. **Configuration**
   - Environment variables
   - Coolify configuration

3. **Data**
   - Redis data (if using persistent storage)

### Backup Procedures

#### Application Code
- Ensure regular commits to Git repository
- Consider using GitHub backups or similar services

#### Configuration
- Document all environment variables
- Store them in a secure location (e.g., password manager)

#### Redis Data
- If using persistent Redis storage, set up regular backups:
```bash
# Create Redis backup
docker exec <redis_container_id> redis-cli SAVE
# Copy the dump file to a secure location
```

### Recovery Procedures

#### Application Recovery
1. Restore from Git repository
2. Configure environment variables in Coolify
3. Deploy the application

#### Configuration Recovery
1. Retrieve environment variables from secure storage
2. Update environment variables in Coolify
3. Redeploy the application

#### Redis Data Recovery
1. Stop the Redis container
2. Replace the dump file with the backup
3. Start the Redis container
4. Verify data integrity

### Disaster Recovery

1. **Identify Critical Components**
   - Application code
   - Configuration
   - Redis data
   - External services (YouTube API, Telegram API)

2. **Establish Recovery Time Objectives (RTO)**
   - Maximum acceptable downtime
   - Prioritize critical components

3. **Create Recovery Plan**
   - Step-by-step procedures
   - Contact information for support
   - Fallback options

4. **Test Recovery Plan**
   - Regular disaster recovery drills
   - Update plan based on test results