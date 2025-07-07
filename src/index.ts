import { BearDashboardScraper } from './scraper/stagehand-scraper';
import { JsonStorage } from './storage/json-io';
import { Logger } from './utils/logger';

async function main() {
  Logger.info("Starting Bear Dashboard Scraper with TypeScript...");
  
  const scraper = new BearDashboardScraper();
  const storage = new JsonStorage();
  
  try {
    const result = await scraper.scrape();
    
    if (result.status === 'success') {
      const filepath = await storage.saveData(result.data);
      Logger.success(`Data saved to: ${filepath}`);
      
      console.log("\n" + "=".repeat(50));
      console.log("BEAR DASHBOARD SCRAPING RESULTS");
      console.log("=".repeat(50));
      console.log(`Brand Visibility: ${result.data.brand_visibility_percentage || 'N/A'}`);
      console.log(`Prompt Count: ${result.data.prompt_count || 'N/A'}`);
      console.log(`Extraction Method: ${result.data.extraction_method}`);
      console.log(`Data File: ${filepath}`);
      console.log("=".repeat(50));
    } else {
      Logger.error(`Scraping failed: ${result.message}`);
    }
  } catch (error) {
    Logger.error("Unexpected error:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
