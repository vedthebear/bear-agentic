export class Logger {
  static info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  static error(message: string, error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }

  static success(message: string): void {
    console.log(`[SUCCESS] ${new Date().toISOString()}: ${message}`);
  }
}
