"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stagehand_scraper_1 = require("./scraper/stagehand-scraper");
const json_io_1 = require("./storage/json-io");
const logger_1 = require("./utils/logger");
async function main() {
    logger_1.Logger.info("Starting Bear Dashboard Scraper with TypeScript...");
    const scraper = new stagehand_scraper_1.BearDashboardScraper();
    const storage = new json_io_1.JsonStorage();
    try {
        const result = await scraper.scrape();
        if (result.status === 'success') {
            const filepath = await storage.saveData(result.data);
            logger_1.Logger.success(`Data saved to: ${filepath}`);
            console.log("\n" + "=".repeat(50));
            console.log("BEAR DASHBOARD SCRAPING RESULTS");
            console.log("=".repeat(50));
            console.log(`Brand Visibility: ${result.data.brand_visibility_percentage || 'N/A'}`);
            console.log(`Prompt Count: ${result.data.prompt_count || 'N/A'}`);
            console.log(`Extraction Method: ${result.data.extraction_method}`);
            console.log(`Data File: ${filepath}`);
            console.log("=".repeat(50));
        }
        else {
            logger_1.Logger.error(`Scraping failed: ${result.message}`);
        }
    }
    catch (error) {
        logger_1.Logger.error("Unexpected error:", error);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
