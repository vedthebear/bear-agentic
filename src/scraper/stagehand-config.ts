import { config } from '../config/env';

export const stagehandConfig = () => ({
  env: "BROWSERBASE" as const,
  apiKey: config.BROWSERBASE_API_KEY,
  projectId: config.BROWSERBASE_PROJECT_ID,
  modelName: "gpt-4o" as const,
  modelClientOptions: {
    apiKey: config.MODEL_API_KEY,
  },
  verbose: 1 as const,
  enableCaching: false,
}); 