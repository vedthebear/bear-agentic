import express from 'express';
import { App } from '@slack/bolt';
import { config } from './config/env';
import { Logger } from './utils/logger';
import { registerLinkFlow } from './slack/linkFlow';
import { dailySummaryHandler } from './slack/dailySummary';
import { qaHandler } from './slack/qaHandler';

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize Slack Bolt app
const slackApp = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  appToken: config.SLACK_APP_TOKEN,
  socketMode: !!config.SLACK_APP_TOKEN, // Use socket mode if app token is provided
});

// Register Slack flows
registerLinkFlow(slackApp);

// Slack event handlers
slackApp.event('app_mention', qaHandler);

// Express routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Daily summary endpoint (can be called by cron job)
app.post('/api/daily-summary', async (req, res) => {
  try {
    const { teamId, channelId, userId } = req.body;
    
    if (!teamId || !channelId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: teamId, channelId, userId' 
      });
    }

    await dailySummaryHandler(teamId, channelId, userId);
    res.json({ success: true, message: 'Daily summary sent' });
  } catch (error) {
    Logger.error('Daily summary error:', error);
    res.status(500).json({ error: 'Failed to send daily summary' });
  }
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
  Logger.info(`🚀 Server running on port ${PORT}`);
  Logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  Logger.info(`🔗 Slack events: http://localhost:${PORT}/slack/events`);
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