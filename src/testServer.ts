/**
 * Simple Slack Bot Server using Bolt directly
 * 
 * This server uses Bolt's built-in HTTP mode without Express.
 * It handles Slack commands and modal submissions directly through Bolt.
 */

import { App } from '@slack/bolt';
import { config } from './config/env';
import { Logger } from './utils/logger';
import { registerLinkFlow } from './slack/linkFlow';
import { BearLinkStorage } from './storage/supabase';

// Initialize Slack Bolt app in HTTP mode
const slackApp = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  // HTTP mode - no socket mode
  socketMode: false,
});

// Initialize database and register Slack flows
async function initializeServer() {
  try {
    // Initialize Supabase table
    await BearLinkStorage.initializeTable();
    
    // Register Slack flows
    registerLinkFlow(slackApp);
    
    // Start the Bolt app on port 3000
    const PORT = parseInt(config.PORT);
    await slackApp.start(PORT);
    
    Logger.info(`🚀 Slack Bot Server running on port ${PORT}`);
    Logger.info(`🔗 Slack events: http://localhost:${PORT}/slack/events`);
    Logger.info(`🔧 Test commands:`);
    Logger.info(`   - /bear-link - Link your Bear account`);
    Logger.info(`   - /bear-links - View all linked accounts`);
    Logger.info(`📝 Focus: Testing Slack user authentication and Supabase storage`);
    Logger.info(`✅ Bolt HTTP mode active - ready to receive Slack events`);
    Logger.info(`🗄️  Supabase storage initialized`);
  } catch (error) {
    Logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 