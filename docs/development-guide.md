# Development Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Style](#code-style)
6. [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.2.22+
- Redis server (for deduplication)
- Git

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/1453-ai-telegram-bot.git
cd 1453-ai-telegram-bot
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Edit the `.env` file** with your configuration, including the new `TELEGRAM_CHAT_CONFIGS` format

5. **Start Redis server**
```bash
# If using Docker
docker run -d -p 6379:6379 redis:alpine

# Or if you have Redis installed locally
redis-server
```

6. **Run the application**
```bash
# Development mode
bun run dev

# Production mode
bun run start
```

## Project Structure

```
1453-ai-telegram-bot/
├── src/
│   ├── config/           # Configuration management
│   ├── handlers/         # Request handlers
│   │   └── websub.ts    # WebSub handler
│   ├── services/         # Business logic
│   │   ├── live-detector.ts  # #live tag detection
│   │   ├── telegram.ts       # Telegram bot integration
│   │   └── youtube.ts        # YouTube API integration
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── deduplication.ts # Redis-based deduplication
│   │   └── logger.ts        # Logging configuration
│   └── index.ts          # Application entry point
├── docs/                 # Documentation
├── logs/                 # Log files
├── .env.example          # Environment variables template
├── .dockerignore         # Docker ignore rules
├── .gitignore            # Git ignore rules
├── coolify.yaml          # Coolify deployment configuration
├── Dockerfile            # Docker configuration
├── bun.lockb             # Bun lock file
├── index.ts              # Main entry point
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

### Key Components

#### Configuration (`src/config/`)
- Manages environment variables and application settings
- Provides type-safe access to configuration values

#### Handlers (`src/handlers/`)
- Handles HTTP requests and responses
- Implements WebSub callback and verification logic

#### Services (`src/services/`)
- Contains business logic
- Integrates with external APIs (YouTube, Telegram)
- Implements core functionality (live detection)

#### Types (`src/types/`)
- Defines TypeScript interfaces and types
- Ensures type safety across the application

#### Utils (`src/utils/`)
- Provides utility functions
- Implements cross-cutting concerns (logging, deduplication)

## Development Workflow

### 1. Feature Development

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
3. Test your changes locally
4. Commit your changes:
```bash
git add .
git commit -m "feat: add your feature description"
```

5. Push your branch:
```bash
git push origin feature/your-feature-name
```

6. Create a pull request

### 2. Bug Fixes

1. Create a new branch for your bug fix:
```bash
git checkout -b fix/your-bug-fix-name
```

2. Make your changes
3. Test your changes locally
4. Commit your changes:
```bash
git add .
git commit -m "fix: describe the bug fix"
```

5. Push your branch:
```bash
git push origin fix/your-bug-fix-name
```

6. Create a pull request

### 3. Code Review Process

1. All code changes must be reviewed by at least one other developer
2. Ensure all automated tests pass
3. Address any review comments
4. Update documentation if necessary
5. Merge the pull request

### 4. Release Process

1. Update version in `package.json`
2. Update changelog
3. Create a release tag:
```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## Testing

### Unit Tests

Run unit tests:
```bash
bun test
```

### Integration Tests

Run integration tests:
```bash
bun test:integration
```

### End-to-End Tests

Run end-to-end tests:
```bash
bun test:e2e
```

### Test Coverage

Generate test coverage report:
```bash
bun test --coverage
```

### Writing Tests

#### Unit Tests

- Test individual functions and methods in isolation
- Mock external dependencies
- Focus on business logic

Example:
```typescript
import { liveDetectorService } from '../services/live-detector';

describe('LiveDetectorService', () => {
  describe('containsLiveTag', () => {
    it('should return true when description contains #live tag', () => {
      const description = 'Check out our new video #live';
      const result = liveDetectorService.containsLiveTag(description);
      expect(result).toBe(true);
    });

    it('should return false when description does not contain #live tag', () => {
      const description = 'Check out our new video';
      const result = liveDetectorService.containsLiveTag(description);
      expect(result).toBe(false);
    });
  });
});
```

#### Integration Tests

- Test interactions between components
- Use real dependencies where possible
- Focus on integration points

Example:
```typescript
import { webSubHandler } from '../handlers/websub';
import { telegramService } from '../services/telegram';

describe('WebSub Integration', () => {
  it('should process WebSub callback and send Telegram notification', async () => {
    // Mock WebSub payload
    const payload = createMockWebSubPayload();
    
    // Process callback
    const response = await testApp.request('/websub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: payload,
    });
    
    // Verify response
    expect(response.status).toBe(200);
    
    // Verify Telegram notification was sent
    expect(telegramService.sendLivestreamNotification).toHaveBeenCalled();
  });
});
```

## Code Style

### TypeScript

- Use strict TypeScript settings
- Prefer explicit types over implicit types
- Use interfaces for object shapes
- Use type aliases for union types and primitives

### Naming Conventions

- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use SCREAMING_SNAKE_CASE for constants and environment variables
- Use kebab-case for file and directory names

### Code Organization

- Group related exports together
- Use absolute imports for internal modules
- Keep functions small and focused
- Use descriptive names for functions and variables

### Comments and Documentation

- Use JSDoc comments for functions, classes, and interfaces
- Include parameter descriptions and return types
- Add inline comments for complex logic
- Keep documentation up to date with code changes

Example:
```typescript
/**
 * Detects if a video description contains the #live tag
 * @param description - The video description to check
 * @returns True if the description contains the #live tag, false otherwise
 */
containsLiveTag(description: string): boolean {
  return this.LIVE_TAG_PATTERN.test(description);
}
```

### Error Handling

- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors with appropriate context
- Gracefully handle external service failures

Example:
```typescript
try {
  const videoMetadata = await youtubeService.getVideoMetadata(videoId);
  if (!videoMetadata) {
    logger.warn(`Could not fetch metadata for video ${videoId}`);
    return null;
  }
  return videoMetadata;
} catch (error) {
  logger.error(`Error fetching video metadata for ${videoId}:`, error);
  throw new Error('Failed to fetch video metadata');
}
```

## Contributing

### Pull Request Guidelines

1. **Title**: Use a clear and descriptive title
2. **Description**: Provide a detailed description of changes
3. **Related Issues**: Link to any related issues
4. **Testing**: Describe how you tested your changes
5. **Documentation**: Update documentation if necessary

### Commit Message Convention

Use the following format for commit messages:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(telegram): add manual notification command

Add a new /notify command that allows authorized users to manually
trigger notifications for the latest video.

Closes #123
```

```
fix(youtube): handle API rate limiting

Implement exponential backoff when YouTube API rate limit is reached.
This prevents the application from failing during high traffic periods.
```

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Follow the project's coding standards