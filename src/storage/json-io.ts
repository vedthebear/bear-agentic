import fs from 'fs/promises';
import path from 'path';
import { BearDashboardData } from '../types';

export class JsonStorage {
  private dataDir = path.join(process.cwd(), 'data', 'scraped');

  async saveData(data: BearDashboardData): Promise<string> {
    await this.ensureDataDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bear_dashboard_data_${timestamp}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    return filepath;
  }

  async listScrapes(): Promise<string[]> {
    await this.ensureDataDir();
    const files = await fs.readdir(this.dataDir);
    return files.filter(file => file.endsWith('.json'));
  }

  async loadScrape(filename: string): Promise<BearDashboardData> {
    const filepath = path.join(this.dataDir, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }
}
