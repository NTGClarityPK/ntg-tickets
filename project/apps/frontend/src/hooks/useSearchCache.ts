import { useState, useCallback, useRef } from 'react';
import { CACHE_CONFIG } from '../lib/constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  query: string;
}

interface UseSearchCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cache entries
}

export function useSearchCache<T>(options: UseSearchCacheOptions = {}) {
  const { ttl = CACHE_CONFIG.DEFAULT_TTL, maxSize = CACHE_CONFIG.MAX_SIZE } =
    options;
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback(
    (query: string, filters?: Record<string, unknown>) => {
      const filterString = filters ? JSON.stringify(filters) : '';
      return `${query}-${filterString}`;
    },
    []
  );

  const isExpired = useCallback(
    (entry: CacheEntry<T>) => {
      return Date.now() - entry.timestamp > ttl;
    },
    [ttl]
  );

  const get = useCallback(
    (query: string, filters?: Record<string, unknown>) => {
      const key = getCacheKey(query, filters);
      const entry = cache.get(key);

      if (entry && !isExpired(entry)) {
        return entry.data;
      }

      // Remove expired entry
      if (entry) {
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(key);
          return newCache;
        });
      }

      return null;
    },
    [cache, getCacheKey, isExpired]
  );

  const set = useCallback(
    (query: string, data: T, filters?: Record<string, unknown>) => {
      const key = getCacheKey(query, filters);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        query,
      };

      setCache(prev => {
        const newCache = new Map(prev);

        // Remove oldest entries if cache is full
        if (newCache.size >= maxSize) {
          const entries = Array.from(newCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

          // Remove oldest 25% of entries
          const toRemove = Math.floor(maxSize * 0.25);
          for (let i = 0; i < toRemove; i++) {
            newCache.delete(entries[i][0]);
          }
        }

        newCache.set(key, entry);
        return newCache;
      });
    },
    [getCacheKey, maxSize]
  );

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const clearExpired = useCallback(() => {
    setCache(prev => {
      const newCache = new Map();
      prev.forEach((entry, key) => {
        if (!isExpired(entry)) {
          newCache.set(key, entry);
        }
      });
      return newCache;
    });
  }, [isExpired]);

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  const getAbortSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  return {
    get,
    set,
    clear,
    clearExpired,
    abortPreviousRequest,
    getAbortSignal,
    cacheSize: cache.size,
  };
}
