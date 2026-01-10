// Simple in-memory cache for scraped mentions
// Persists for the lifetime of the server process
// Falls back to cached data when API quotas are exhausted

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface MentionCache {
  [key: string]: CacheEntry<any>;
}

// Global cache object (persists across requests in the same process)
const cache: MentionCache = {};

// Cache TTL in milliseconds (default: 6 hours)
const DEFAULT_TTL = 6 * 60 * 60 * 1000;

// Maximum age for stale cache fallback (24 hours)
const MAX_STALE_AGE = 24 * 60 * 60 * 1000;

/**
 * Generate a cache key from source and brand
 */
export function getCacheKey(source: string, brand: string): string {
  return `${source.toLowerCase()}_${brand.toLowerCase()}`;
}

/**
 * Get cached data if available and not expired
 * Returns null if no cache or expired
 */
export function getCache<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;

  const now = Date.now();
  if (now < entry.expiresAt) {
    return entry.data as T;
  }

  return null;
}

/**
 * Get stale cached data (for fallback when API fails)
 * Returns data even if expired, as long as it's within MAX_STALE_AGE
 */
export function getStaleCache<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;

  const now = Date.now();
  const age = now - entry.timestamp;

  if (age < MAX_STALE_AGE) {
    return entry.data as T;
  }

  return null;
}

/**
 * Set cache data with optional custom TTL
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const now = Date.now();
  cache[key] = {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  };
}

/**
 * Check if cache exists (even if expired)
 */
export function hasCache(key: string): boolean {
  return key in cache;
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(key: string): number | null {
  const entry = cache[key];
  if (!entry) return null;
  return Date.now() - entry.timestamp;
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  for (const key in cache) {
    delete cache[key];
  }
}

/**
 * Get cache stats
 */
export function getCacheStats(): { entries: number; keys: string[] } {
  return {
    entries: Object.keys(cache).length,
    keys: Object.keys(cache),
  };
}

/**
 * Format cache age for display
 */
export function formatCacheAge(key: string): string {
  const age = getCacheAge(key);
  if (age === null) return 'No cache';

  const minutes = Math.floor(age / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }
  return `${minutes}m ago`;
}
