/**
 * Cache Persister for React Query
 *
 * Persists React Query cache to localStorage/IndexedDB
 * so cached data survives page refreshes
 */

import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const CACHE_VERSION = 12; // Fixed scope-analysis endpoint date filtering
const CACHE_KEY = `blipee-dashboard-cache-v${CACHE_VERSION}`;
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a persister that uses localStorage for cache persistence
 */
export const createCachePersister = (): Persister => {
  if (typeof window === 'undefined') {
    // Return a no-op persister for SSR
    return {
      persistClient: async () => {},
      restoreClient: async () => undefined,
      removeClient: async () => {},
    };
  }

  return {
    persistClient: async (client: PersistedClient) => {
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(client));
      } catch (error) {
        console.warn('Failed to persist cache:', error);
      }
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const cached = window.localStorage.getItem(CACHE_KEY);
        if (!cached) return undefined;

        const client = JSON.parse(cached) as PersistedClient;

        // Check if cache is expired
        const now = Date.now();
        if (now - client.timestamp > MAX_AGE) {
          await window.localStorage.removeItem(CACHE_KEY);
          return undefined;
        }

        return client;
      } catch (error) {
        console.warn('Failed to restore cache:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        window.localStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.warn('Failed to remove cache:', error);
      }
    },
  };
};

/**
 * Clears the persisted cache
 */
export const clearPersistedCache = () => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(CACHE_KEY);
      console.log('✅ Persisted cache cleared');
    } catch (error) {
      console.warn('Failed to clear persisted cache:', error);
    }
  }
};

/**
 * Gets the size of the persisted cache in bytes
 */
export const getPersistedCacheSize = (): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    return cached ? new Blob([cached]).size : 0;
  } catch (error) {
    console.warn('Failed to get cache size:', error);
    return 0;
  }
};

/**
 * Checks if persisted cache exists
 */
export const hasPersistedCache = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(CACHE_KEY) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Gets cache statistics
 */
export const getCacheStats = () => {
  const size = getPersistedCacheSize();
  const exists = hasPersistedCache();
  const sizeInKB = (size / 1024).toFixed(2);
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);

  return {
    exists,
    size,
    sizeInKB: `${sizeInKB} KB`,
    sizeInMB: `${sizeInMB} MB`,
    version: CACHE_VERSION,
    maxAge: MAX_AGE,
  };
};

export { CACHE_KEY, CACHE_VERSION, MAX_AGE };
