/**
 * Slack Bear AI Linking System
 * 
 * This module handles the linking of Slack users to Bear AI accounts.
 * It provides a user-level linking system where each Slack user can link
 * their own Bear AI account, allowing personalized access to their data.
 * 
 * Key Features:
 * - User-level linking (one Bear AI account per Slack user)
 * - Bear AI credential authentication via Supabase
 * - Persistent storage in Supabase database
 * - Slack modal interface for credential collection
 * - Duplicate linking prevention
 */

import { App, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { Logger } from "../utils/logger";
import { authenticateAndGetBearId } from "../integrations/supabase/auth";
import { BearLinkStorage, BearLink } from "../storage/supabase";

// ---------- 1. Data Access Functions ----------

/**
 * Retrieves the Bear AI user ID for a given Slack user
 * 
 * This is the primary function used by the RAG system to determine
 * which Bear AI account's data to query for a given Slack user.
 * 
 * @param slackUserId - The Slack user ID
 * @returns The Bear AI user ID if linked, undefined otherwise
 * 
 * @example
 * const bearId = await getBearId('U1234567890');
 * if (bearId) {
 *   // Query Bear AI data for this account
 * }
 */
export async function getBearId(slackUserId: string): Promise<string | undefined> {
  try {
    const link = await BearLinkStorage.getLinkBySlackUser(slackUserId);
    if (link) {
      // Update last accessed timestamp
      await BearLinkStorage.updateLastAccessed(slackUserId);
      return link.bear_id;
    }
    return undefined;
  } catch (error) {
    Logger.error('Error getting Bear ID:', error);
    return undefined;
  }
}

/**
 * Checks if a Slack user is already linked to a Bear AI account
 * 
 * Used to prevent duplicate linking and to determine if a user
 * can make RAG queries.
 * 
 * @param slackUserId - The Slack user ID
 * @returns true if the user is linked, false otherwise
 */
export async function isUserLinked(slackUserId: string): Promise<boolean> {
  try {
    return await BearLinkStorage.linkExists(slackUserId);
  } catch (error) {
    Logger.error('Error checking if user is linked:', error);
    return false;
  }
}

// ---------- 2. Slack Bolt Integration ----------

/**
 * Registers all Slack commands and interactions for the Bear AI linking system
 * 
 * This function sets up:
 * - /bear-link command: Initiates the linking process
 * - Modal submission handler: Processes Bear AI credentials
 * - /bear-links command: Shows current linking status
 * 
 * @param app - The Slack Bolt App instance
 */
export function registerLinkFlow(app: App) {
  /**
   * /bear-link command handler
   * 
   * This command initiates the Bear AI account linking process.
   * It opens a modal where users can enter their Bear AI credentials.
   * 
   * Flow:
   * 1. User types /bear-link
   * 2. Modal opens with email/password fields
   * 3. User submits credentials
   * 4. System authenticates with Bear AI
   * 5. User is linked to Bear AI account
   */
  app.command("/bear-link", async ({ ack, command, client }) => {
    await ack();

    Logger.info(`Link command triggered by user ${command.user_id} in team ${command.team_id}`);
    Logger.info(`Command details: ${JSON.stringify({
      user_id: command.user_id,
      team_id: command.team_id,
      channel_id: command.channel_id,
      text: command.text,
      trigger_id: command.trigger_id
    })}`);

    try {
      // Check if user is already linked
      const isLinked = await isUserLinked(command.user_id);
      if (isLinked) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: "✅ You already have a Bear AI account linked. Use `/bear-links` to view your link details."
        });
        return;
      }

      // Get detailed user info from Slack for the modal display
      const userInfo = await client.users.info({
        user: command.user_id
      });

      Logger.info(`Retrieved user info: ${JSON.stringify(userInfo.user)}`);

      // Open the Bear AI linking modal
      await client.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: "modal",
          callback_id: "bear_link_modal",
          title: { type: "plain_text", text: "Link Bear Account" },
          submit: { type: "plain_text", text: "Submit" },
          close: { type: "plain_text", text: "Cancel" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Slack User:* ${userInfo.user?.real_name || userInfo.user?.name || 'Unknown'}`
              }
            },
            {
              type: "input",
              block_id: "emailBlock",
              label: { type: "plain_text", text: "Bear AI Email" },
              element: {
                type: "plain_text_input",
                action_id: "emailInput",
                placeholder: {
                  type: "plain_text",
                  text: "Enter your Bear AI email address"
                }
              },
            },
            {
              type: "input",
              block_id: "passBlock",
              label: { type: "plain_text", text: "Bear AI Password" },
              element: {
                type: "plain_text_input",
                action_id: "passInput",
                multiline: false,
                placeholder: {
                  type: "plain_text",
                  text: "Enter your Bear AI password"
                }
              },
            },
          ],
        },
      });
    } catch (error) {
      Logger.error('Error opening link modal:', error);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "❌ Failed to open linking modal. Please try again."
      });
    }
  });

  /**
   * Modal submission handler for Bear AI linking
   * 
   * This handler processes the Bear AI credentials submitted through the modal.
   * It authenticates the user with Bear AI and creates the user link.
   * 
   * Flow:
   * 1. User submits email/password in modal
   * 2. System authenticates with Bear AI
   * 3. Retrieves Bear user ID
   * 4. Creates user link in Supabase
   * 5. Sends confirmation message
   */
  app.view(
    "bear_link_modal",
    async ({ ack, body, view, client }) => {
      await ack();

      Logger.info(`Modal submitted by user ${body.user?.id} in team ${body.team?.id}`);
      Logger.info(`Modal body: ${JSON.stringify(body)}`);

      if (!body.team) throw new Error("Missing team info in Slack payload");
      const teamId = body.team.id;
      const userId = body.user?.id;

      if (!userId) throw new Error("Missing user info in Slack payload");

      // Get the form values
      const email = view.state.values.emailBlock?.emailInput?.value;
      const password = view.state.values.passBlock?.passInput?.value;

      Logger.info(`Form values: ${JSON.stringify({ email, password: password ? '[HIDDEN]' : 'MISSING' })}`);

      try {
        // Step 1: Check if this user is already linked to prevent duplicates
        if (await isUserLinked(userId)) {
          await client.chat.postMessage({
            channel: userId,
            text: `✅ You already have a Bear AI account linked.`,
          });
          return;
        }

        // Step 2: Get detailed user info from Slack for logging and display
        const userInfo = await client.users.info({
          user: userId
        });

        Logger.info(`User info for linking: ${JSON.stringify(userInfo.user)}`);

        // Step 2.5: Fetch Slack team (workspace) info for team name
        const teamInfo = await client.team.info({ team: teamId });
        const teamName = teamInfo.team?.name || teamId;
        Logger.info(`Slack team name: ${teamName}`);

        // Step 3: Authenticate with Bear AI and retrieve the Bear user ID
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        const bearUserId = await authenticateAndGetBearId(email, password);

        // Step 4: Create and store the user link in Supabase
        const bearLink = await BearLinkStorage.createLink(userId, teamId, teamName, bearUserId);

        Logger.info(`User link created: ${JSON.stringify(bearLink)}`);

        // Step 5: Send confirmation message to the user
        await client.chat.postMessage({
          channel: userId,
          text: `✅ Your Bear AI account is now linked!

*Linked By:* ${userInfo.user?.real_name || userInfo.user?.name || 'Unknown'}
*Bear User ID:* ${bearUserId}
*Linked At:* ${new Date().toLocaleString()}

You can now ask questions about your Bear data!`,
        });

        Logger.success(`Successfully linked user ${userId} to Bear ID ${bearUserId}`);

      } catch (error) {
        Logger.error('Error in modal submission:', error);
        
        // Send error message to user with helpful guidance
        await client.chat.postMessage({
          channel: userId,
          text: `❌ Failed to link your Bear account: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
        });
      }
    },
  );

  /**
   * /bear-links command handler
   * 
   * This command shows the current linking status for the user and team.
   * It's useful for debugging and for users to verify their linking status.
   * 
   * Shows:
   * - Whether the user is linked
   * - Who created the link
   * - When it was created
   * - The Bear user ID
   * - All links in the team (for admins)
   */
  app.command("/bear-links", async ({ ack, command, client }) => {
    await ack();

    try {
      // Check if this user is linked to a Bear AI account
      const userLink = await BearLinkStorage.getLinkBySlackUser(command.user_id);

      if (!userLink) {
        // No link found - prompt user to create one
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: "No Bear account is currently linked to your Slack account. Use `/bear-link` to link your Bear AI account."
        });
        return;
      }

      // Display the user's linking information
      const userLinkText = `*Your Linked Bear Account:*\n• *Bear User ID:* ${userLink.bear_id}\n• *Linked At:* ${new Date(userLink.created_at).toLocaleString()}\n• *Last Accessed:* ${new Date(userLink.last_accessed).toLocaleString()}`;

      // Get all links in the team for admin view
      let teamLinksText = '';
      try {
        const teamLinks = await BearLinkStorage.getLinksByTeam(command.team_id);
        if (teamLinks.length > 1) {
          teamLinksText = `\n\n*All Bear Links in This Team:*`;
          teamLinks.forEach(link => {
            teamLinksText += `\n• <@${link.slack_user_id}> - ${link.bear_id} (${new Date(link.created_at).toLocaleDateString()})`;
          });
        }
      } catch (err) {
        Logger.error('Error getting team links:', err);
        teamLinksText = '\n\n*Could not retrieve team links*';
      }

      // Send the information as an ephemeral message
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `${userLinkText}${teamLinksText}`
      });
    } catch (error) {
      Logger.error('Error in bear-links command:', error);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "❌ Failed to retrieve link information. Please try again."
      });
    }
  });
}
