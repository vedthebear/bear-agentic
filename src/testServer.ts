import express from 'express';
import { App } from '@slack/bolt';
import { config } from './config/env';
import { Logger } from './utils/logger';
import { registerLinkFlow, getAllLinks } from './slack/linkFlow';
import { WebClient } from '@slack/web-api';

const slackClient = new WebClient(config.SLACK_BOT_TOKEN);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- Needed for Slack slash commands

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
    links: getAllLinks().length,
    message: 'Slack authentication test server is running'
  });
});

// Slack event endpoint
app.post('/slack/events', async (req, res) => {
  try {
    Logger.info('Slack event received');
    Logger.info(`Event type: ${req.body?.type}`);
    Logger.info(`Event data: ${JSON.stringify(req.body)}`);

    // Handle slash command for /bear-link
    if (req.body && req.body.command === '/bear-link') {
      // Open a modal
      await slackClient.views.open({
        trigger_id: req.body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'bear_link_modal',
          title: { type: 'plain_text', text: 'Link Bear Account' },
          submit: { type: 'plain_text', text: 'Submit' },
          close: { type: 'plain_text', text: 'Cancel' },
          blocks: [
            {
              type: 'input',
              block_id: 'emailBlock',
              label: { type: 'plain_text', text: 'Bear AI Email' },
              element: {
                type: 'plain_text_input',
                action_id: 'emailInput',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter your Bear AI email address'
                }
              }
            },
            {
              type: 'input',
              block_id: 'passBlock',
              label: { type: 'plain_text', text: 'Bear AI Password' },
              element: {
                type: 'plain_text_input',
                action_id: 'passInput',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter your Bear AI password'
                }
              }
            }
          ]
        }
      });
      // Respond quickly to Slack to avoid timeout
      return res.status(200).send();
    }

    // For other events, just acknowledge
    res.status(200).send('OK');
  } catch (error) {
    Logger.error('Slack event processing error:', error);
    res.status(500).json({ error: 'Event processing failed' });
  }
});

// Start server
const PORT = parseInt(config.PORT);
app.listen(PORT, () => {
  Logger.info(`🚀 Slack Authentication Test Server running on port ${PORT}`);
  Logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  Logger.info(`🔗 Slack events: http://localhost:${PORT}/slack/events`);
  Logger.info(`📋 View links: http://localhost:${PORT}/api/links`);
  Logger.info(`🔧 Test commands:`);
  Logger.info(`   - /bear-link - Link your Bear account`);
  Logger.info(`   - /bear-links - View all linked accounts`);
  Logger.info(`📝 Focus: Testing Slack user authentication and linking`);
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