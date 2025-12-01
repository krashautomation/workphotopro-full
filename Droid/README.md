# Katya AI Agent Module 🤖

Katya is an AI-powered team assistant that can make comments, ask questions, and boost morale in your WorkPhotoPro job chats.

## Overview

Katya integrates seamlessly with your existing messaging system, appearing as a regular user in job chats. She can:
- **Comment** on photos and work updates
- **Ask questions** about project progress and blockers
- **Boost morale** with encouragement and recognition

## Architecture

- **Backend**: Appwrite Cloud Function that listens to message events
- **AI Provider**: OpenAI GPT-3.5 Turbo (configurable)
- **Integration**: Uses existing `messages` collection and `messageService`

## Quick Start

1. **Set up Katya user account** (see `SETUP.md`)
2. **Deploy Cloud Function** (see `SETUP.md`)
3. **Configure webhook** in Appwrite Console
4. **Enable Katya** per team/job (optional)

## Files Structure

```
Droid/
├── README.md                    # This file
├── SETUP.md                     # Setup instructions
├── function/                    # Appwrite Cloud Function code
│   └── index.js                 # Main function handler
├── lib/                         # Client-side code
│   └── katya.ts                 # Katya service helpers
├── config/                      # Configuration files
│   ├── prompts.ts               # AI prompt templates
│   └── personality.ts           # Katya's personality config
└── scripts/                     # Setup scripts
    └── create-katya-user.js    # Script to create Katya user account
```

## Cost Estimate

- **Appwrite**: Free tier (25K function executions/month)
- **OpenAI GPT-3.5 Turbo**: ~$2-5/month (moderate usage)
- **Total**: ~$3-5/month

## Features

- ✅ Event-driven responses (triggers on new messages)
- ✅ Context-aware conversations
- ✅ Rate limiting (prevents spam)
- ✅ Team/job-level enable/disable
- ✅ Configurable personality and behavior

## Next Steps

See `SETUP.md` for detailed setup instructions.

