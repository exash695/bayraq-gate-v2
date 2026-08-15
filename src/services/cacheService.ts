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
  private readonly STORAGE_PREFIX = 'bairaq_cache_';
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_MEMORY_ITEMS = 100;

  /**
   * Simple string hash for cache keys
   */
  public generateHashKey(prefix: string, input: any): string {
    const str = typeof input === 'string' ? input : JSON.stringify(input || {});
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${prefix}_${Math.abs(hash).toString(36)}`;
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
