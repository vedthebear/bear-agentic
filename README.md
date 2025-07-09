# Bear Agentic - Slack Authentication Test

**Current Focus: Slack Authentication Only**

This is a focused test environment for Slack authentication. All other features (Bear AI API, RAG, LLM, etc.) are temporarily disabled to focus on getting Slack user linking working properly.

## What's Active

✅ **Slack Authentication System**
- `/bear-link` command for linking Bear accounts
- `/bear-links` command to view linked accounts
- Comprehensive Slack user data capture
- In-memory user linking storage
- Detailed logging for debugging

✅ **Test Endpoints**
- `GET /health` - Health check
- `GET /api/links` - View all linked accounts
- `POST /slack/events` - Slack event processing

## What's Disabled

❌ Bear AI API integration
❌ RAG (Retrieval-Augmented Generation)
❌ LLM summarization
❌ Daily summaries
❌ Q&A functionality

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Slack app credentials:
   - `SLACK_BOT_TOKEN` - Your Slack bot token (starts with `xoxb-`)
   - `SLACK_SIGNING_SECRET` - Your Slack app signing secret
   - `SLACK_APP_TOKEN` - Your Slack app token (starts with `xapp-`)

3. **Start the test server:**
   ```bash
   npm run dev
   # or
   npm run test-slack
   ```

## Testing Slack Authentication

1. **Start the server** with `npm run dev`

2. **Use ngrok** to expose your local server:
   ```bash
   npx ngrok http 3000
   ```

3. **Configure your Slack app** to use the ngrok URL:
   - Event Subscriptions: `https://your-ngrok-url.ngrok.io/slack/events`
   - Slash Commands: `/bear-link` and `/bear-links`

4. **Test the commands:**
   - `/bear-link` - Opens a modal to link your Bear account
   - `/bear-links` - Shows all linked accounts in your workspace

5. **Check the API endpoints:**
   - `http://localhost:3000/health` - Health check
   - `http://localhost:3000/api/links` - View all linked accounts

## What We're Capturing

The bot captures the following Slack user information:
- User ID
- Team ID
- Real name
- Display name
- Email (if available)
- Timezone
- Admin/owner status
- Account restrictions
- Last updated timestamp

## File Structure

```
src/
├── testServer.ts          # Main test server (ACTIVE)
├── slack/
│   └── linkFlow.ts        # Slack authentication (ACTIVE)
├── config/
│   └── env.ts            # Environment config (ACTIVE)
└── utils/
    └── logger.ts         # Logging (ACTIVE)

# Disabled files (renamed with .disabled suffix):
├── server.ts.disabled
├── slack/dailySummary.ts.disabled
├── slack/qaHandler.ts.disabled
├── slack/boltApp.ts.disabled
└── api/*.ts.disabled
```

## Next Steps

Once Slack authentication is working perfectly, we'll:
1. Re-enable Bear AI API integration
2. Add real Bear AI authentication
3. Implement RAG with Pinecone
4. Add LLM summarization
5. Build the full Q&A system

## Development

- `npm run dev` - Start the Slack test server
- `npm run test-slack` - Same as dev (alias)
- `npm run watch` - Start with auto-reload
