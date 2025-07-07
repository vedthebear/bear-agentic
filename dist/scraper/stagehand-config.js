"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stagehandConfig = void 0;
const env_1 = require("../config/env");
const stagehandConfig = () => ({
    env: "BROWSERBASE",
    apiKey: env_1.config.BROWSERBASE_API_KEY,
    projectId: env_1.config.BROWSERBASE_PROJECT_ID,
    modelName: "gpt-4o",
    modelClientOptions: {
        apiKey: env_1.config.MODEL_API_KEY,
    },
    verbose: 1,
    enableCaching: true,
});
exports.stagehandConfig = stagehandConfig;
