# YouTube Livestream Telegram Notification Bot PRD

## 1. Background & Goals
- Creator runs simultaneous livestreams on YouTube, X, Kick, Twitch, Instagram, and LinkedIn.
- Need instant Telegram notifications when YouTube livestream goes live to inform community and internal team.
- Detection will rely on YouTube's PubSubHubbub (WebSub) to react the moment the livestream content carries the `#live` tag in its description.
- Bot implementation language: TypeScript, deployable within the existing tooling for the 1453 AI community.

## 2. Problem Statement
Current manual sharing of livestream announcements is slow, inconsistent, and error-prone. Followers sometimes miss the start of a stream, and the internal team lacks timely awareness. Automating notifications through a Telegram bot ensures consistent, rapid distribution of livestream links across the audience and team channels the moment the YouTube broadcast begins.

## 3. Objectives
1. Detect the start of a YouTube livestream with minimal delay.
2. Automatically broadcast all relevant platform links to designated Telegram channels and groups.
3. Provide team members with operational context (e.g., stream title, start time, lead host) to align production and moderation efforts.
4. Offer resilience against transient API failures and transparent alerting when notifications cannot be delivered.

## 4. Success Metrics
- **Detection latency:** 90% of livestreams announced within 60 seconds of YouTube going live (stretch target: 30 seconds).
- **Delivery success:** 99% of intended Telegram channels/groups receive the notification without retries.
- **Operational visibility:** Error alerts (if any) available to maintainers within 2 minutes of failure.
- **Manual intervention rate:** Fewer than 5% of streams require manual re-sending.

## 5. In Scope
- Monitoring YouTube livestream status for one creator channel via PubSubHubbub (WebSub) callbacks.
- Aggregating predefined platform URLs per livestream.
- Sending formatted rich messages to multiple Telegram destinations.
- Configuration management for Telegram chat IDs, API keys, and platform link templates via JSON file.
- Logging, alerting hooks, and basic health check endpoint.

## 6. Out of Scope
- Scheduling livestreams or creating events on YouTube.
- Cross-posting to platforms other than Telegram.
- Dynamic generation of platform-specific promo assets (thumbnails, captions).
- Advanced moderation features (e.g., responding to chat messages).

## 7. Personas & Needs
- **Creator (Altudev):** Wants hands-free, reliable announcements as streams begin.
- **Internal Team:** Needs immediate notice to join and support livestream logistics.
- **Community Followers:** Want a single trusted notification containing every platform link.

## 8. User Stories
1. As the creator, I want the bot to detect when a YouTube livestream starts so that I can focus on hosting without manual announcements.
2. As a follower, I want a Telegram message with all platform links so I can choose where to watch.
3. As a moderator, I want to receive the notification in the team channel with notes on the stream to coordinate moderation.
4. As an operator, I want logs and alerts when notifications fail so I can quickly resolve issues.
5. As an admin, I want to update platform links and Telegram destinations without code changes when possible.

## 9. Functional Requirements
1. **YouTube Livestream Monitoring**
   - Subscribe to YouTube PubSubHubbub (WebSub) notifications for the primary channel.
   - Process incoming video publish/update events and filter entries whose description includes the `#live` tag.
   - Extract metadata: title, start time, description snippet, thumbnail, canonical video URL.
2. **Platform Link Aggregation**
   - Maintain configuration mapping each platform (YouTube, X, Kick, Twitch, Instagram, LinkedIn) to either static URLs or templated URLs per stream.
   - Allow optional short descriptions per platform link (e.g., "Watch on Twitch").
3. **Telegram Notification**
   - Send messages to one or more Telegram chats (channels, supergroups) using bot tokens.
   - Message format includes: headline, livestream title, start time, preview image (if supported), platform links list, operational notes, and Turkish copy aligned with community tone.
   - Support Markdown or HTML formatting for readability.
   - Provide optional pinned message or replies if required by channel settings.
4. **Notification Reliability**
   - Implement retry with exponential backoff for API failures.
   - Deduplicate messages to avoid repeated sends for the same livestream instance.
   - Provide manual override command (/notify) to trigger the latest announcement.
5. **Configuration & Secrets Management**
   - Store API keys and chat IDs securely (environment variables, secrets manager).
   - Expose minimal configuration file or admin command to adjust intervals, templates, and destinations.
6. **Operational Monitoring**
   - Structured logging with timestamps, event IDs, and outcome summaries.
   - Optional webhook or Telegram DM for error alerts.
   - Health/status endpoint or heartbeat message for monitoring.

## 10. Non-functional Requirements
- **Performance:** Complete detection-to-send pipeline within 30 seconds under normal conditions.
- **Reliability:** System designed for 24/7 operation with graceful handling of API rate limits and downtime.
- **Security:** Tokens and keys never committed to source control; follow least-privilege principles.
- **Maintainability:** Codebase organized with clear separation of concerns (API clients, schedulers, messaging).
- **Localization:** Single-language (Turkish) messaging; no translation or audience-specific variants required initially.
- **Observability:** Provide logs and metrics that support root-cause analysis (e.g., number of polls, fails, successes).
- **Scalability:** Support future addition of more Telegram destinations and extra streaming platforms without major redesign.

## 11. Dependencies
- YouTube Data API access with sufficient quota (for metadata enrichment when necessary).
- YouTube PubSubHubbub (WebSub) subscription endpoint reachable from the public internet.
- Telegram Bot API access with permissions for target channels.
- Hosting environment capable of running Node.js/TypeScript application (server, serverless, or container).
- Time synchronization (NTP) for accurate scheduling and timestamping.

## 12. Milestones & Deliverables
1. **MVP (Week 1-2):** WebSub subscription + Telegram notification to single channel with static links.
2. **Release Candidate (Week 3):** Multi-channel messaging, templated links, retries, manual override.
3. **Production Launch (Week 4):** Logging, alerting hooks, documentation, deployment automation.

## 13. Risks & Mitigations
- **WebSub delivery delays/outages:** Provide fallback polling of YouTube Data API and alert maintainers when no callbacks arrive within expected windows.
- **Telegram delivery limits:** Batch messages or throttle sends if many destinations; monitor for errors.
- **Stream metadata changes close to start:** Refresh data immediately prior to send; support manual edits.
- **Configuration drift:** Use centralized config file and version control; provide validation on load.
- **Missing `#live` tag:** Notification skipped by design; escalate manual checks in production playbook to avoid silent misses.

## 14. Decisions
1. Bot will not send end-of-stream or schedule-change notifications.
2. All audiences receive the same Turkish-language message copy.
3. Configuration resides in a JSON file committed/deployed with the bot.
4. No localization or multi-language support required at launch.
5. Primary deployment target is the self-hosted Coolify server, with flexibility to explore alternatives later.
6. If the `#live` tag is absent, the bot intentionally skips notification for that entry.
