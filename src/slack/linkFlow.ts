// src/slack/linkFlow.ts
import { App, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { v4 as uuidv4 } from "uuid";

// ---------- 1. in-memory store ----------
type LinkKey = `${string}:${string}`;                        // team:user
const linkTable = new Map<LinkKey, { bearUserId: string }>();

export function getBearId(team: string, user: string) {
  return linkTable.get(`${team}:${user}`)?.bearUserId;
}

// ---------- 2. register with Bolt ----------
export function registerLinkFlow(app: App) {
  // /bear link command
  app.command("/bear-link", async ({ ack, command, client }) => {
    await ack();

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
            type: "input",
            block_id: "emailBlock",
            label: { type: "plain_text", text: "Email" },
            element: {
              type: "plain_text_input",
              action_id: "emailInput",
            },
          },
          {
            type: "input",
            block_id: "passBlock",
            label: { type: "plain_text", text: "Password" },
            element: {
              type: "plain_text_input",
              action_id: "passInput",
              dispatch_action_config: { trigger_actions_on: ["on_enter_pressed"] },
            },
          },
        ],
      },
    });
  });

  // Modal submission handler
  app.view(
    "bear_link_modal",
    async ({ ack, body, view, client }) => {
      await ack();

      if (!body.team) throw new Error("Missing team info in Slack payload");
      const teamId = body.team.id;
      const userId = body.user.id;

      // --- pretend to auth; assign dummy bear_user_id ---
      const fakeBearId = uuidv4();                    // e.g., 7aa4…

      linkTable.set(`${teamId}:${userId}`, { bearUserId: fakeBearId });

      // DM confirmation
      await client.chat.postMessage({
        channel: userId,
        text: `✅ Your Bear account is now linked (id: ${fakeBearId.slice(0, 8)}…).`,
      });
    },
  );
}
