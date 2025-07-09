// src/slack/linkFlow.ts
import { App, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../utils/logger";

// ---------- 1. in-memory store ----------
type LinkKey = `${string}:${string}`;                        // team:user
interface UserLink {
  bearUserId: string;
  slackUser: {
    id: string;
    team_id: string;
    name?: string;
    real_name?: string;
    email?: string;
    tz?: string;
    is_admin?: boolean;
    is_owner?: boolean;
    is_primary_owner?: boolean;
    is_restricted?: boolean;
    is_ultra_restricted?: boolean;
    is_bot?: boolean;
    updated?: number;
  };
  linkedAt: string;
}

const linkTable = new Map<LinkKey, UserLink>();

export function getBearId(team: string, user: string) {
  return linkTable.get(`${team}:${user}`)?.bearUserId;
}

export function getUserLink(team: string, user: string): UserLink | undefined {
  return linkTable.get(`${team}:${user}`);
}

export function getAllLinks(): UserLink[] {
  return Array.from(linkTable.values());
}

// ---------- 2. register with Bolt ----------
export function registerLinkFlow(app: App) {
  // /bear link command
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
        // Get detailed user info from Slack
        const userInfo = await client.users.info({
          user: command.user_id
        });

        Logger.info(`Retrieved user info: ${JSON.stringify(userInfo.user)}`);

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

  // Modal submission handler
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
        // Get detailed user info from Slack
        const userInfo = await client.users.info({
          user: userId
        });

        Logger.info(`User info for linking: ${JSON.stringify(userInfo.user)}`);

        // TODO: Actually authenticate with Bear AI API
        // For now, we'll use a fake Bear user ID
        const fakeBearId = uuidv4();

        // Store the link with detailed user info
        const userLink: UserLink = {
          bearUserId: fakeBearId,
          slackUser: {
            id: userInfo.user?.id || userId,
            team_id: teamId,
            name: userInfo.user?.name,
            real_name: userInfo.user?.real_name,
            email: userInfo.user?.profile?.email,
            tz: userInfo.user?.tz,
            is_admin: userInfo.user?.is_admin,
            is_owner: userInfo.user?.is_owner,
            is_primary_owner: userInfo.user?.is_primary_owner,
            is_restricted: userInfo.user?.is_restricted,
            is_ultra_restricted: userInfo.user?.is_ultra_restricted,
            is_bot: userInfo.user?.is_bot,
            updated: userInfo.user?.updated
          },
          linkedAt: new Date().toISOString()
        };

        linkTable.set(`${teamId}:${userId}`, userLink);

        Logger.info(`User link created: ${JSON.stringify(userLink)}`);

        // DM confirmation
        await client.chat.postMessage({
          channel: userId,
          text: `✅ Your Bear account is now linked!

*Slack User:* ${userInfo.user?.real_name || userInfo.user?.name || 'Unknown'}
*Bear User ID:* ${fakeBearId.slice(0, 8)}…
*Linked At:* ${new Date().toLocaleString()}

You can now use @bear-bot to ask questions about your Bear data!`,
        });

        Logger.success(`Successfully linked user ${userId} in team ${teamId} to Bear ID ${fakeBearId}`);

      } catch (error) {
        Logger.error('Error in modal submission:', error);
        
        // Send error message to user
        await client.chat.postMessage({
          channel: userId,
          text: `❌ Failed to link your Bear account. Please try again or contact support.`,
        });
      }
    },
  );

  // Add a command to show current links (for debugging)
  app.command("/bear-links", async ({ ack, command, client }) => {
    await ack();

    const links = getAllLinks();
    const userLinks = links.filter(link => link.slackUser.team_id === command.team_id);

    if (userLinks.length === 0) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "No Bear accounts are currently linked in this workspace."
      });
      return;
    }

    const linkText = userLinks.map(link => 
      `• *${link.slackUser.real_name || link.slackUser.name || 'Unknown'}* (${link.slackUser.id}) → Bear ID: ${link.bearUserId.slice(0, 8)}…`
    ).join('\n');

    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `*Linked Bear Accounts:*\n${linkText}`
    });
  });
}
