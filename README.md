# Bear Agentic - Slack Bot

A Slack bot that integrates with Bear AI to provide RAG-powered Q&A and daily summaries.

## Current Focus: Slack Authentication

We're currently focused on getting Slack authentication working properly. The bot allows users to link their Bear AI accounts using their email and password.

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
   npm run test-slack
   ```

## Testing Slack Authentication

1. **Start the server** with `npm run test-slack`

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

## Next Steps

Once Slack authentication is working, we'll:
1. Integrate with Bear AI API for real authentication
2. Implement RAG with Pinecone vector store
3. Add daily summary generation
4. Build the full Q&A system

## Development

- `npm run test-slack` - Start the Slack test server
- `npm run dev` - Start the full server (when ready)
- `npm run build` - Build for production
