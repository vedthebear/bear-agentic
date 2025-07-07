"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class JsonStorage {
    constructor() {
        this.dataDir = path_1.default.join(process.cwd(), 'data', 'scraped');
    }
    async saveData(data) {
        await this.ensureDataDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `bear_dashboard_data_${timestamp}.json`;
        const filepath = path_1.default.join(this.dataDir, filename);
        await promises_1.default.writeFile(filepath, JSON.stringify(data, null, 2));
        return filepath;
    }
    async listScrapes() {
        await this.ensureDataDir();
        const files = await promises_1.default.readdir(this.dataDir);
        return files.filter(file => file.endsWith('.json'));
    }
    async loadScrape(filename) {
        const filepath = path_1.default.join(this.dataDir, filename);
        const content = await promises_1.default.readFile(filepath, 'utf-8');
        return JSON.parse(content);
    }
    async ensureDataDir() {
        try {
            await promises_1.default.access(this.dataDir);
        }
        catch {
            await promises_1.default.mkdir(this.dataDir, { recursive: true });
        }
    }
}
exports.JsonStorage = JsonStorage;
