// src/slack/boltApp.ts
import { App } from "@slack/bolt";
import { registerLinkFlow, getBearId } from "./linkFlow";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

registerLinkFlow(app);

// Example usage inside your Q&A handler
app.event("app_mention", async ({ event, say, context }) => {
  if (!context.team_id) {
    await say("🚫 Could not determine your Slack team. Please try again.");
    return;
  }
  if (!event.user) {
    await say("🚫 Could not determine your Slack user. Please try again.");
    return;
  }
  const bearId = getBearId(context.team_id, event.user);
  if (!bearId) {
    await say("🚫 You haven’t linked your Bear account. Use `/bear-link`.");
    return;
  }
  // … proceed to call API with bearId …
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running");
})();
