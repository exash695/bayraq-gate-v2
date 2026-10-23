import React from 'react';

/**
 * Enhanced lazy loader with automatic retry mechanism for Vite dynamic imports.
 * Handles transient network dropouts, dev server rebuilds, and module resolution glitches.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<any>,
  namedExport?: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const module = await componentImport();
        if (module && module.default) {
          return { default: module.default };
        }
        if (namedExport && module && module[namedExport]) {
          return { default: module[namedExport] };
        }
        if (module && typeof module === 'object') {
          // Find first component export if neither default nor namedExport match
          const possibleComponent = Object.values(module).find(
            (val) => typeof val === 'function'
          );
          if (possibleComponent) {
            return { default: possibleComponent as T };
          }
        }
        return { default: module };
      } catch (err: any) {
        lastError = err;
        console.warn(`[lazyWithRetry] Attempt ${attempt} failed for component:`, err);
        if (attempt < 3) {
          // Brief backoff before next attempt
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
        }
      }
    }

    // If all attempts fail, check if it's a dynamic module import failure
    const isModuleFetchError =
      lastError?.message?.includes('Failed to fetch dynamically imported module') ||
      lastError?.message?.includes('dynamically imported module') ||
      lastError?.name === 'ChunkLoadError' ||
      lastError?.name === 'TypeError';

    const hasRefreshed = sessionStorage.getItem('lazy_retry_refreshed');
    if (isModuleFetchError && !hasRefreshed) {
      sessionStorage.setItem('lazy_retry_refreshed', 'true');
      console.warn('[lazyWithRetry] Refreshing page to recover from stale Vite module cache...');
      window.location.reload();
    }

    throw lastError || new Error('Failed to load component dynamically');
  });
}
