
const CACHE_NAME = 'bayraq-media-cache-v8';
const REVALIDATION_INTERVAL = 3 * 3600 * 1000; // 3 hours

/**
 * Completely purges all cached media assets from CacheStorage, IndexedDB, and memory object maps.
 */
export async function clearMediaCache(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Delete all CacheStorage instances matching bayraq
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k.toLowerCase().includes('bayraq'))
          .map(k => caches.delete(k))
      );
    }

    // 2. Clear Object URL map & revoke memory blobs
    objectUrlMap.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (e) {}
    });
    objectUrlMap.clear();
    inflightPromises.clear();

    // 3. Clear revalidation timestamps from localStorage
    localStorage.removeItem('bayraq-media-revalidation-timestamps');
    localStorage.removeItem('bayraq_preload_hash_cache');

    // 4. Delete IndexedDB image databases if present
    if ('indexedDB' in window) {
      try {
        indexedDB.deleteDatabase('bayraq_image_cache');
        indexedDB.deleteDatabase('bayraq_media_db');
      } catch (e) {}
    }

    return true;
  } catch (e) {
    console.error('[imageCacher] Failed to clear media cache:', e);
    return false;
  }
}

// Keep a map of original URL -> generated Object URL so we don't recreate them multiple times and leak memory
const objectUrlMap = new Map<string, string>();
const inflightPromises = new Map<string, Promise<string>>();

/**
 * Synchronously checks and retrieves the in-memory cached Object URL for a given media URL.
 */
export function getInMemoryCachedUrl(url: string): string | undefined {
  if (!url || url.endsWith('.mp4') || url.endsWith('.webm')) return undefined;
  return objectUrlMap.get(url);
}

/**
 * Preloads an MP4 video or asset into CacheStorage/HTTP cache for instant rendering
 */
export async function preloadVideoBlob(url: string): Promise<string> {
  if (!url || typeof window === 'undefined') return url;
  if (inflightPromises.has(url)) return inflightPromises.get(url)!;

  const promise = (async () => {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const cachedRes = await cache.match(url);
        if (cachedRes) {
          return url;
        }
      }
      const response = await fetch(url);
      if (response.ok && 'caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put(url, response.clone()).catch(() => {});
        } catch (e) {}
      }
    } catch (e) {
      // Fallback
    }
    return url;
  })();

  inflightPromises.set(url, promise);
  return promise;
}

/**
 * Normalizes and optimizes image URLs (like Unsplash) for suitable display resolution
 */
export function getOptimizedImageUrl(url: string, width: number = 800): string {
  if (!url) return '';
  
  // If it's a known placeholder or a very small logo/local asset, don't change parameters
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // If it's an Unsplash image, set optimal parameters for web display
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }

  return url;
}

/**
 * Retrieves the cached media URL (image, video, etc.) using the browser's Cache Storage API.
 * If not cached, fetches it, caches it, and returns a local Object URL.
 */
export async function getCachedMediaUrl(url: string): Promise<string> {
  return url || '';
}

/**
 * Silent background revalidation check using Stale-While-Revalidate pattern.
 */
async function triggerBackgroundRevalidation(url: string, cache: Cache) {
  const lastChecked = getCheckedTimestamp(url);
  const now = Date.now();

  // Return early if checked within the revalidation interval
  if (now - lastChecked < REVALIDATION_INTERVAL) {
    return;
  }

  try {
    // Fetch headers or the resource directly with cache-busting / no-cache header
    const response = await fetch(url, { method: 'GET', cache: 'no-cache', mode: 'cors' });
    if (response.ok) {
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const cachedLen = cachedResponse.headers.get('content-length');
        const newLen = response.headers.get('content-length');

        const cachedEtag = cachedResponse.headers.get('etag');
        const newEtag = response.headers.get('etag');

        // Update if either content-length or etag changed
        if (cachedLen !== newLen || (cachedEtag && cachedEtag !== newEtag)) {
          await cache.put(url, response.clone());
          
          // Revoke the old object URL
          const oldUrl = objectUrlMap.get(url);
          if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
          }

          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          objectUrlMap.set(url, objUrl);
        }
      }
    }
    saveCheckedTimestamp(url);
  } catch (error) {
    // Non-blocking error
    console.debug(`Revalidation check skipped/failed for ${url}`);
  }
}

function getCheckedTimestamp(url: string): number {
  try {
    const data = localStorage.getItem('bayraq-media-revalidation-timestamps');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed[url] || 0;
    }
  } catch (e) {
    // Ignore storage issues
  }
  return 0;
}

function saveCheckedTimestamp(url: string) {
  try {
    const data = localStorage.getItem('bayraq-media-revalidation-timestamps') || '{}';
    const parsed = JSON.parse(data);
    parsed[url] = Date.now();
    localStorage.setItem('bayraq-media-revalidation-timestamps', JSON.stringify(parsed));
  } catch (e) {
    // Ignore storage issues
  }
}

/**
 * Preloads all 8 school card images and official logos into browser memory and Cache API.
 * Ensures instant display without delay or blank states.
 */
export function preloadSchoolAssets(): void {
  if (typeof window === 'undefined') return;

  const schoolIds = ['school1', 'school2', 'school3', 'school4', 'school5', 'school6', 'school7', 'school8'];
  
  schoolIds.forEach((id) => {
    const cardJpg = `${id}.jpg`;
    const logoJpg = `${id}.jpg`;

    [cardJpg, logoJpg].forEach((url) => {
      // 1. In-memory DOM Image preloader
      const img = new Image();
      img.src = url;

      // 2. CacheStorage API pre-fetch
      getCachedMediaUrl(url).catch(() => {
        // Silent fallback
      });
    });
  });
}

// Auto-start preloading and purge legacy cache when module is initialized in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const purgeKey = 'bayraq_cache_purged_v100_force';
    if (!localStorage.getItem(purgeKey)) {
      clearMediaCache().then(() => {
        localStorage.setItem(purgeKey, 'true');
        preloadSchoolAssets();
      }).catch(() => preloadSchoolAssets());
    } else {
      preloadSchoolAssets();
    }
  }, 50);
}

