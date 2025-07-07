"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static info(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    }
    static error(message, error) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    }
    static success(message) {
        console.log(`[SUCCESS] ${new Date().toISOString()}: ${message}`);
    }
}
exports.Logger = Logger;
