import express from 'express';
import { App } from '@slack/bolt';
import { config } from './config/env';
import { Logger } from './utils/logger';
import { registerLinkFlow, getAllLinks } from './slack/linkFlow';

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize Slack Bolt app
const slackApp = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  appToken: config.SLACK_APP_TOKEN,
  socketMode: !!config.SLACK_APP_TOKEN,
});

// Register Slack flows
registerLinkFlow(slackApp);

// Test endpoint to see all current links
app.get('/api/links', (req, res) => {
  const links = getAllLinks();
  res.json({
    total: links.length,
    links: links.map(link => ({
      bearUserId: link.bearUserId,
      slackUser: {
        id: link.slackUser.id,
        team_id: link.slackUser.team_id,
        name: link.slackUser.name,
        real_name: link.slackUser.real_name,
        email: link.slackUser.email,
        is_admin: link.slackUser.is_admin,
        is_owner: link.slackUser.is_owner,
      },
      linkedAt: link.linkedAt
    }))
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    links: getAllLinks().length
  });
});

// Slack event endpoint
app.post('/slack/events', async (req, res) => {
  try {
    await slackApp.processEvent(req, res);
  } catch (error) {
    Logger.error('Slack event processing error:', error);
    res.status(500).json({ error: 'Event processing failed' });
  }
});

// Start server
const PORT = parseInt(config.PORT);
app.listen(PORT, () => {
  Logger.info(`🚀 Test server running on port ${PORT}`);
  Logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  Logger.info(`🔗 Slack events: http://localhost:${PORT}/slack/events`);
  Logger.info(`📋 View links: http://localhost:${PORT}/api/links`);
  Logger.info(`🔧 Test commands:`);
  Logger.info(`   - /bear-link - Link your Bear account`);
  Logger.info(`   - /bear-links - View all linked accounts`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 