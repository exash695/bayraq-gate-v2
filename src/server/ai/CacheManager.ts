import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.ai_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const memoryCache = new Map<string, any>();

export class CacheManager {
  static generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static async getCachedResult(hash: string): Promise<any | null> {
    try {
      // 1. Check memory
      if (memoryCache.has(hash)) {
        return memoryCache.get(hash);
      }
      
      // 2. Check disk
      const filePath = path.join(CACHE_DIR, `${hash}.json`);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Load into memory for next time
        memoryCache.set(hash, parsed);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  static async saveToCache(hash: string, result: any, metadata: any = {}): Promise<void> {
    try {
      // 1. Save to memory
      memoryCache.set(hash, result);
      if (memoryCache.size > 1000) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }

      // 2. Save to disk
      const filePath = path.join(CACHE_DIR, `${hash}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result), 'utf-8');
    } catch (error) {
      console.error("Cache save error:", error);
    }
  }
}
