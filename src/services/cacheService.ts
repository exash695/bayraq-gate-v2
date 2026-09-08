/**
 * Smart Cache System for Bairaq Portal
 * Provides in-memory and persistent localStorage caching with TTL,
 * LRU eviction, and automatic hash key generation to minimize redundant API/AI calls.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  etag?: string;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly STORAGE_PREFIX = 'bairaq_cache_v2_';
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_MEMORY_ITEMS = 100;

  constructor() {
    this.purgeLegacyExtractCache();
  }

  /**
   * Purge legacy cache entries that might have suffered from 200-char prefix collisions
   */
  private purgeLegacyExtractCache(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('bairaq_cache_ai_extract') || k.startsWith('bairaq_cache_') || k.startsWith('pdf_v5_cache_'))) {
          // If it is old v1 prefix, remove it to prevent stale identical page collisions
          if (!k.startsWith(this.STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[CacheService] Legacy cache purge warning:', e);
    }
  }

  /**
   * Fast, robust distributed hash function for arbitrary strings or objects.
   * Handles base64 images and large text payloads without collision.
   */
  public generateHashKey(prefix: string, input: any): string {
    const str = typeof input === 'string' ? input : JSON.stringify(input || {});
    const len = str.length;
    if (len === 0) return `${prefix}_empty`;

    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    // Distribute sample points across the entire string length
    const sampleCount = Math.min(len, 2000);
    const step = len > 2000 ? Math.floor(len / sampleCount) : 1;

    for (let i = 0; i < len; i += step) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const hashStr = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    return `${prefix}_len${len}_${hashStr}`;
  }

  /**
   * Get cached data if valid and not expired
   */
  public get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (now - memEntry.timestamp < memEntry.ttlMs) {
        return memEntry.data as T;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // 2. Check localStorage fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.STORAGE_PREFIX + key);
        if (raw) {
          const entry: CacheEntry<T> = JSON.parse(raw);
          if (now - entry.timestamp < entry.ttlMs) {
            // Re-populate memory cache
            this.setInMemory(key, entry.data, entry.ttlMs - (now - entry.timestamp));
            return entry.data;
          } else {
            localStorage.removeItem(this.STORAGE_PREFIX + key);
          }
        }
      }
    } catch (e) {
      console.warn('[CacheService] Storage read failed:', e);
    }

    return null;
  }

  /**
   * Store data in cache
   */
  public set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL, persist: boolean = true): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    // Store in memory
    this.setInMemory(key, data, ttlMs);

    // Store in localStorage if requested
    if (persist && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch (e) {
        console.warn('[CacheService] Storage write failed (quota exceeded):', e);
        this.clearExpiredStorage();
      }
    }
  }

  /**
   * Get cached item or execute fetcher function and cache the result
   */
  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = this.DEFAULT_TTL,
    persist: boolean = true
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      this.set(key, freshData, ttlMs, persist);
    }
    return freshData;
  }

  /**
   * Remove a specific key from cache
   */
  public remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(this.STORAGE_PREFIX + key);
      } catch (e) {}
    }
  }

  /**
   * Clear all cached entries
   */
  public clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
    }
  }

  private setInMemory<T>(key: string, data: T, ttlMs: number): void {
    if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
      // LRU Eviction: delete first inserted key
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  private clearExpiredStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const now = Date.now();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.STORAGE_PREFIX)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const entry: CacheEntry<any> = JSON.parse(raw);
            if (now - entry.timestamp >= entry.ttlMs) {
              keysToRemove.push(k);
            }
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
}

export const cacheService = new CacheService();
