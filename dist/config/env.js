"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    MODEL_API_KEY: process.env.MODEL_API_KEY,
    BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY,
    BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID,
    BEAR_DASHBOARD_EMAIL: process.env.BEAR_DASHBOARD_EMAIL,
    BEAR_DASHBOARD_PASSWORD: process.env.BEAR_DASHBOARD_PASSWORD,
};
