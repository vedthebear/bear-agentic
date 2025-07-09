import { WebClient } from '@slack/web-api';
import { bearApiClient } from '../api/client';
import { Logger } from '../utils/logger';
import { config } from '../config/env';
import { generateDailySummary } from '../llm/summarize';

const slackClient = new WebClient(config.SLACK_BOT_TOKEN);

export async function dailySummaryHandler(
  teamId: string, 
  channelId: string, 
  userId: string
): Promise<void> {
  try {
    Logger.info(`Generating daily summary for team ${teamId}, channel ${channelId}, user ${userId}`);

    // Get Bear user ID from the link table (you'll need to implement this)
    // For now, we'll use a placeholder
    const bearUserId = getBearUserId(teamId, userId);
    if (!bearUserId) {
      Logger.error(`No Bear user linked for Slack user ${userId} in team ${teamId}`);
      return;
    }

    // Fetch dashboard data from Bear AI API
    const dashboardResponse = await bearApiClient.getDashboardData(bearUserId);
    if (!dashboardResponse.success || !dashboardResponse.data) {
      Logger.error('Failed to fetch dashboard data:', dashboardResponse.error);
      return;
    }

    const dashboardData = dashboardResponse.data;

    // Generate summary using LLM
    const summary = await generateDailySummary(dashboardData);

    // Post to Slack
    await slackClient.chat.postMessage({
      channel: channelId,
      text: summary,
      unfurl_links: false,
    });

    Logger.info('Daily summary posted successfully');
  } catch (error) {
    Logger.error('Error in daily summary handler:', error);
    throw error;
  }
}

// TODO: Implement proper user linking - this is a placeholder
function getBearUserId(teamId: string, userId: string): string | null {
  // This should integrate with your existing linkFlow.ts user mapping
  // For now, return null to indicate no link
  return null;
} 