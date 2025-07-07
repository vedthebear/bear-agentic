import dotenv from 'dotenv';
dotenv.config();

export const config = {
  MODEL_API_KEY: process.env.MODEL_API_KEY!,
  BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY!,
  BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID!,
  BEAR_DASHBOARD_EMAIL: process.env.BEAR_DASHBOARD_EMAIL!,
  BEAR_DASHBOARD_PASSWORD: process.env.BEAR_DASHBOARD_PASSWORD!,
}; 