"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearDashboardScraper = void 0;
const stagehand_1 = require("@browserbasehq/stagehand");
const stagehand_config_1 = require("./stagehand-config");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class BearDashboardScraper {
    constructor() {
        this.stagehand = null;
    }
    async initialize() {
        logger_1.Logger.info("Initializing Stagehand...");
        this.stagehand = new stagehand_1.Stagehand((0, stagehand_config_1.stagehandConfig)());
        await this.stagehand.init();
        logger_1.Logger.info("Stagehand initialized successfully.");
    }
    async login() {
        const page = this.stagehand.page;
        if (!page)
            throw new Error("Failed to get page instance");
        try {
            logger_1.Logger.info("Navigating to Bear dashboard...");
            await page.goto("https://app.usebear.ai");
            logger_1.Logger.info("Logging in...");
            await page.act(`Type '${env_1.config.BEAR_DASHBOARD_EMAIL}' into the email field`);
            await this.delay(3000);
            await page.act(`Type '${env_1.config.BEAR_DASHBOARD_PASSWORD}' into the password field`);
            await this.delay(3000);
            await page.act("Click the login button");
            await this.delay(5000);
            logger_1.Logger.success("Successfully logged in");
            return true;
        }
        catch (error) {
            logger_1.Logger.error("Login failed:", error);
            return false;
        }
    }
    async extractData() {
        const page = this.stagehand.page;
        if (!page)
            throw new Error("Failed to get page instance");
        logger_1.Logger.info("Extracting dashboard data...");
        await this.delay(2000);
        // Extract brand visibility
        const visibilityData = await page.extract({
            instruction: "extract the brand visibility percentage displayed at the top of the dashboard",
            schema: {
                brandVisibilityPercentage: "string",
                basedOnPrompts: "string"
            }
        });
        await this.delay(3000);
        // Extract prompt count
        const promptData = await page.extract({
            instruction: "extract the total prompts count displayed on the dashboard",
            schema: {
                promptCount: "string"
            }
        });
        return {
            brand_visibility_percentage: visibilityData.brandVisibilityPercentage || null,
            prompt_count: promptData.promptCount || null,
            extraction_method: "stagehand_typescript",
            timestamp: new Date().toISOString(),
            url: page.url()
        };
    }
    async scrape() {
        try {
            await this.initialize();
            if (!await this.login()) {
                return {
                    status: 'error',
                    data: this.getEmptyData(),
                    message: 'Failed to login to Bear dashboard'
                };
            }
            const data = await this.extractData();
            return {
                status: 'success',
                data
            };
        }
        catch (error) {
            logger_1.Logger.error("Scraping failed:", error);
            return {
                status: 'error',
                data: this.getEmptyData(),
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        finally {
            await this.cleanup();
        }
    }
    async cleanup() {
        if (this.stagehand) {
            await this.stagehand.close();
            logger_1.Logger.info("Stagehand browser closed");
        }
    }
    getEmptyData() {
        return {
            brand_visibility_percentage: null,
            prompt_count: null,
            extraction_method: "stagehand_typescript",
            timestamp: new Date().toISOString(),
            url: ""
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.BearDashboardScraper = BearDashboardScraper;
