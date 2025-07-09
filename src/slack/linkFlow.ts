/**
 * Slack Bear AI Linking System
 * 
 * This module handles the linking of Slack workspaces to Bear AI accounts.
 * It provides a team-level linking system where one Bear AI account is linked
 * to one Slack workspace, allowing all users in that workspace to access
 * their Bear AI data through RAG queries.
 * 
 * Key Features:
 * - Team-level linking (one Bear AI account per Slack workspace)
 * - Bear AI credential authentication via Supabase
 * - In-memory storage of team links
 * - Slack modal interface for credential collection
 * - Duplicate linking prevention
 */

import { App, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { Logger } from "../utils/logger";
import { authenticateAndGetBearId } from "../integrations/supabase/auth";

// ---------- 1. In-Memory Data Store ----------

/**
 * Type definition for team link keys
 * Uses the Slack team ID as the unique identifier
 */
type TeamLinkKey = string;  // Just the team_id

/**
 * Interface defining the structure of a team link
 * 
 * This represents the mapping between a Slack workspace and a Bear AI account.
 * Only one Bear AI account can be linked per Slack workspace.
 */
interface TeamLink {
  /** The Bear AI user ID retrieved from authentication */
  bearUserId: string;
  /** The Slack workspace ID this account is linked to */
  slackTeamId: string;
  /** Information about who created this link */
  linkedBy: {
    id: string;           // Slack user ID who created the link
    name?: string;        // Slack username
    real_name?: string;   // Slack display name
    email?: string;       // Slack user email
  };
  /** When this link was created (ISO timestamp) */
  linkedAt: string;
}

/**
 * In-memory storage for team links
 * 
 * Maps Slack team IDs to their corresponding Bear AI account information.
 * In production, this would be replaced with a persistent database.
 */
const teamLinkTable = new Map<TeamLinkKey, TeamLink>();

// ---------- 2. Data Access Functions ----------

/**
 * Retrieves the Bear AI user ID for a given Slack team
 * 
 * This is the primary function used by the RAG system to determine
 * which Bear AI account's data to query for a given Slack workspace.
 * 
 * @param team - The Slack team/workspace ID
 * @returns The Bear AI user ID if linked, undefined otherwise
 * 
 * @example
 * const bearId = getBearId('T1234567890');
 * if (bearId) {
 *   // Query Bear AI data for this account
 * }
 */
export function getBearId(team: string): string | undefined {
  return teamLinkTable.get(team)?.bearUserId;
}

/**
 * Retrieves the complete team link information for a given Slack team
 * 
 * @param team - The Slack team/workspace ID
 * @returns Complete TeamLink object if linked, undefined otherwise
 */
export function getTeamLink(team: string): TeamLink | undefined {
  return teamLinkTable.get(team);
}

/**
 * Retrieves all team links in the system
 * 
 * Useful for debugging and administrative purposes.
 * 
 * @returns Array of all TeamLink objects
 */
export function getAllLinks(): TeamLink[] {
  return Array.from(teamLinkTable.values());
}

/**
 * Checks if a Slack team is already linked to a Bear AI account
 * 
 * Used to prevent duplicate linking and to determine if a team
 * can make RAG queries.
 * 
 * @param team - The Slack team/workspace ID
 * @returns true if the team is linked, false otherwise
 */
export function isTeamLinked(team: string): boolean {
  return teamLinkTable.has(team);
}

// ---------- 3. Slack Bolt Integration ----------

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
   * 5. Team is linked to Bear AI account
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
        // Get detailed user info from Slack for the modal display
        // This shows who is initiating the linking process
        const userInfo = await client.users.info({
          user: command.user_id
        });

        Logger.info(`Retrieved user info: ${JSON.stringify(userInfo.user)}`);

        // Open the Bear AI linking modal
        // This modal collects the user's Bear AI credentials
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
    }
  });

  /**
   * Modal submission handler for Bear AI linking
   * 
   * This handler processes the Bear AI credentials submitted through the modal.
   * It authenticates the user with Bear AI and creates the team link.
   * 
   * Flow:
   * 1. User submits email/password in modal
   * 2. System authenticates with Supabase
   * 3. Retrieves Bear user ID
   * 4. Creates team link in memory
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
        // Step 1: Check if this team is already linked to prevent duplicates
        // Only one Bear AI account can be linked per Slack workspace
        if (isTeamLinked(teamId)) {
          await client.chat.postMessage({
            channel: userId,
            text: `✅ This Slack workspace is already linked to a Bear AI account.`,
          });
          return;
        }

        // Step 2: Get detailed user info from Slack for logging and display
        // This information is stored with the link for audit purposes
        const userInfo = await client.users.info({
          user: userId
        });

        Logger.info(`User info for linking: ${JSON.stringify(userInfo.user)}`);

        // Step 3: Authenticate with Bear AI and retrieve the Bear user ID
        // This validates the credentials and gets the Bear account identifier
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        const bearUserId = await authenticateAndGetBearId(email, password);

        // Step 4: Create and store the team link in memory
        // This link maps the Slack workspace to the Bear AI account
        // All users in this workspace will now be able to query Bear AI data
        const teamLink: TeamLink = {
          bearUserId: bearUserId,
          slackTeamId: teamId,
          linkedBy: {
            id: userInfo.user?.id || userId,
            name: userInfo.user?.name,
            real_name: userInfo.user?.real_name,
            email: userInfo.user?.profile?.email,
          },
          linkedAt: new Date().toISOString()
        };

        // Store the link in our in-memory table
        // In production, this would be stored in a persistent database
        teamLinkTable.set(teamId, teamLink);

        Logger.info(`Team link created: ${JSON.stringify(teamLink)}`);

        // Step 5: Send confirmation message to the user
        // This confirms the linking was successful and provides details
        await client.chat.postMessage({
          channel: userId,
          text: `✅ Your Bear AI account is now linked to this Slack workspace!

*Linked By:* ${userInfo.user?.real_name || userInfo.user?.name || 'Unknown'}
*Bear User ID:* ${bearUserId}
*Linked At:* ${new Date().toLocaleString()}

All users in this workspace can now ask questions about your Bear data!`,
        });

        Logger.success(`Successfully linked team ${teamId} to Bear ID ${bearUserId}`);

      } catch (error) {
        Logger.error('Error in modal submission:', error);
        
        // Send error message to user with helpful guidance
        // This helps users understand what went wrong and what to do next
        await client.chat.postMessage({
          channel: userId,
          text: `❌ Failed to link your Bear account. Please try again or contact support.`,
        });
      }
    },
  );

  /**
   * /bear-links command handler
   * 
   * This command shows the current linking status for the workspace.
   * It's useful for debugging and for users to verify their linking status.
   * 
   * Shows:
   * - Whether the workspace is linked
   * - Who created the link
   * - When it was created
   * - The Bear user ID
   */
  app.command("/bear-links", async ({ ack, command, client }) => {
    await ack();

    // Check if this workspace is linked to a Bear AI account
    const teamLink = getTeamLink(command.team_id);

    if (!teamLink) {
      // No link found - prompt user to create one
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "No Bear account is currently linked in this workspace. Use `/bear-link` to link your Bear AI account."
      });
      return;
    }

    // Display the linking information in a formatted message
    const linkText = `• *Linked By:* ${teamLink.linkedBy.real_name || teamLink.linkedBy.name || 'Unknown'} (${teamLink.linkedBy.id})
• *Bear User ID:* ${teamLink.bearUserId}
• *Linked At:* ${new Date(teamLink.linkedAt).toLocaleString()}`;

    // Send the information as an ephemeral message (only visible to the user)
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `*Linked Bear Account:*\n${linkText}`
    });
  });
}
