# Katya AI Agent Architecture

## Overview

Katya is an AI-powered team assistant that integrates seamlessly with WorkPhotoPro's messaging system. She appears as a regular user in job chats and can comment, ask questions, and boost morale.

## Architecture Diagram

```
┌─────────────────┐
│  User Posts     │
│  Message        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Appwrite       │
│  Webhook         │
│  (on message     │
│   create)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloud Function  │
│  (katya-ai-agent)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Rate   │ │ OpenAI    │
│ Limit  │ │ API       │
│ Check  │ │ (GPT-3.5) │
└────┬───┘ └─────┬─────┘
     │           │
     └─────┬─────┘
           │
           ▼
    ┌─────────────┐
    │ Generate    │
    │ Response    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Post Message│
    │ as Katya    │
    └─────────────┘
```

## Components

### 1. Appwrite Cloud Function (`function/index.js`)

**Purpose**: Server-side handler that processes message events and generates AI responses.

**Responsibilities**:
- Listen to webhook events (message creation)
- Rate limiting (prevent spam)
- Context gathering (recent messages)
- AI API integration (OpenAI)
- Message posting (as Katya user)

**Key Functions**:
- `checkRateLimit()` - Ensures Katya doesn't respond too frequently
- `getRecentMessages()` - Fetches conversation context
- `generateAIResponse()` - Calls OpenAI API
- `postKatyaMessage()` - Creates message document

### 2. Client-Side Service (`lib/katya.ts`)

**Purpose**: Helper functions for client app to interact with Katya.

**Responsibilities**:
- Identify Katya messages
- Format Katya messages for display
- Enable/disable Katya per team (optional)

**Note**: Most functionality is server-side. Client code is minimal.

### 3. Configuration (`config/personality.ts`)

**Purpose**: Customize Katya's behavior and personality.

**Features**:
- Personality presets (friendly, professional, enthusiastic, supportive)
- Response triggers (when to respond)
- Response types (comment, question, encouragement, etc.)

### 4. Setup Scripts (`scripts/create-katya-user.js`)

**Purpose**: Automate Katya user account creation.

**Features**:
- Creates Katya user in Appwrite
- Generates secure password
- Saves credentials securely

## Data Flow

### Message Creation Flow

1. **User posts message** → Stored in `messages` collection
2. **Webhook triggered** → Appwrite sends event to Cloud Function
3. **Function receives event** → Validates and processes
4. **Rate limit check** → Ensures appropriate response timing
5. **Context gathering** → Fetches recent messages
6. **AI generation** → Calls OpenAI API with context
7. **Message posting** → Creates new message as Katya
8. **Real-time update** → Message appears in chat via Appwrite Realtime

### Rate Limiting Logic

Katya uses two-level rate limiting:

1. **Message count**: Requires minimum N human messages before responding
2. **Time-based**: Minimum time between responses (e.g., 1 minute)

This prevents:
- Spamming conversations
- Responding to every single message
- High API costs

## Security Considerations

### API Keys
- Stored as encrypted environment variables in Appwrite
- Never exposed to client
- Rotated periodically

### User Permissions
- Katya uses Appwrite API key (server-side)
- Has permissions to create messages
- Cannot access other user data unnecessarily

### Rate Limiting
- Prevents abuse
- Protects against API cost spikes
- Ensures natural conversation flow

## Cost Optimization

### Strategies Used

1. **GPT-3.5 Turbo** (cheaper than GPT-4)
2. **Limited context** (last 10-20 messages)
3. **Short responses** (max 150 tokens)
4. **Rate limiting** (prevents excessive calls)
5. **Smart triggers** (only responds when appropriate)

### Estimated Costs

- **Low usage** (50 messages/day): ~$1-2/month
- **Medium usage** (100 messages/day): ~$2-5/month
- **High usage** (500 messages/day): ~$10-15/month

## Scalability

### Current Limits

- **Appwrite Free Tier**: 25K function executions/month
- **OpenAI**: Pay-as-you-go (no hard limits)

### Scaling Considerations

1. **Function execution limits**: Upgrade Appwrite plan if needed
2. **AI API costs**: Monitor usage, set alerts
3. **Database queries**: Optimize message fetching
4. **Rate limiting**: Adjust based on usage patterns

## Future Enhancements

### Potential Features

1. **Team-level enable/disable**: Allow teams to toggle Katya
2. **Custom personalities**: Different Katya styles per team
3. **Scheduled check-ins**: Daily/weekly team updates
4. **Photo analysis**: Comment on specific photos
5. **Task reminders**: Help with task management
6. **Analytics**: Track Katya's impact on team morale

### Technical Improvements

1. **Caching**: Cache common responses
2. **Batch processing**: Process multiple jobs efficiently
3. **Error handling**: Better retry logic
4. **Monitoring**: Detailed logging and metrics
5. **A/B testing**: Test different response styles

## Integration Points

### Existing Systems

- **Messages Collection**: Uses existing schema
- **Message Service**: Compatible with `messageService`
- **Real-time**: Works with Appwrite Realtime subscriptions
- **Teams/Orgs**: Respects multi-tenant structure

### No Breaking Changes

- Katya appears as regular user
- No schema changes required
- No client code changes needed (optional)
- Backward compatible

## Monitoring & Debugging

### Logs

- Function execution logs in Appwrite Console
- OpenAI API usage dashboard
- Error tracking via function logs

### Key Metrics

- Response rate (messages per day)
- API costs (OpenAI usage)
- Function executions (Appwrite usage)
- User engagement (replies to Katya)

## Troubleshooting

### Common Issues

1. **Katya not responding**
   - Check webhook configuration
   - Verify function is deployed
   - Check function logs
   - Verify environment variables

2. **Rate limiting too strict**
   - Adjust `MIN_MESSAGES_BEFORE_RESPONSE`
   - Adjust `MIN_TIME_BETWEEN_RESPONSES_MS`

3. **High API costs**
   - Switch to GPT-3.5 Turbo
   - Reduce context window
   - Increase rate limiting

4. **Function errors**
   - Check Appwrite logs
   - Verify API keys
   - Check database permissions

