import { Stagehand } from '@browserbasehq/stagehand';
import { stagehandConfig } from './stagehand-config';
import { BearDashboardData, ScrapingResult } from '../types';
import { config } from '../config/env';
import { Logger } from '../utils/logger';
import { z } from 'zod';

export class BearDashboardScraper {
  private stagehand: Stagehand | null = null;

  async initialize(): Promise<void> {
    Logger.info("Initializing Stagehand...");
    this.stagehand = new Stagehand(stagehandConfig());
    await this.stagehand.init();
    Logger.info("Stagehand initialized successfully.");
  }

  async login(): Promise<boolean> {
    const page = this.stagehand!.page;
    if (!page) throw new Error("Failed to get page instance");

    try {
      Logger.info("Navigating to Bear dashboard...");
      await page.goto("https://app.usebear.ai");

      Logger.info("Logging in...");
      await page.act(`Type '${config.BEAR_DASHBOARD_EMAIL}' into the email field`);
      await this.delay(3000);
      
      await page.act(`Type '${config.BEAR_DASHBOARD_PASSWORD}' into the password field`);
      await this.delay(3000);
      
      await page.act("Click the login button");
      await this.delay(5000);

      Logger.success("Successfully logged in");
      return true;
    } catch (error) {
      Logger.error("Login failed:", error);
      return false;
    }
  }

  async extractData(): Promise<BearDashboardData> {
    const page = this.stagehand!.page;
    if (!page) throw new Error("Failed to get page instance");

    Logger.info("Extracting dashboard data...");
    await this.delay(2000);

    // Extract brand visibility
    const visibilitySchema = z.object({
      brandVisibilityPercentage: z.string().optional(),
      basedOnPrompts: z.string().optional(),
    });
    const visibilityData = await page.extract({
      instruction: "extract the brand visibility percentage displayed at the top of the dashboard",
      schema: visibilitySchema,
    });

    await this.delay(3000);

    // Extract prompt count
    const promptSchema = z.object({
      promptCount: z.string().optional(),
    });
    const promptData = await page.extract({
      instruction: "extract the total prompts count displayed on the dashboard",
      schema: promptSchema,
    });

    return {
      brand_visibility_percentage: visibilityData.brandVisibilityPercentage || null,
      prompt_count: promptData.promptCount || null,
      extraction_method: "stagehand_typescript",
      timestamp: new Date().toISOString(),
      url: page.url(),
    };
  }

  async scrape(): Promise<ScrapingResult> {
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
    } catch (error) {
      Logger.error("Scraping failed:", error);
      return {
        status: 'error',
        data: this.getEmptyData(),
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await this.cleanup();
    }
  }

  private async cleanup(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      Logger.info("Stagehand browser closed");
    }
  }

  private getEmptyData(): BearDashboardData {
    return {
      brand_visibility_percentage: null,
      prompt_count: null,
      extraction_method: "stagehand_typescript",
      timestamp: new Date().toISOString(),
      url: ""
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
