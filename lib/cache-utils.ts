/**
 * Advanced caching utilities for the results system
 * Implements in-memory caching with TTL and LRU eviction
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTtl: config.defaultTtl || 5 * 60 * 1000, // 5 minutes
      cleanupInterval: config.cleanupInterval || 60 * 1000 // 1 minute
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.config.cleanupInterval);
  }

  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.config.maxSize) {
      const lruKey = this.findLRUKey();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private findLRUKey(): string | null {
    let lruKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    return lruKey;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      averageAccessCount: entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map(entry => entry.timestamp)),
      newestEntry: Math.max(...entries.map(entry => entry.timestamp))
    };
  }
}

// Global cache instances
export const visitsCache = new LRUCache<any>({
  maxSize: 500,
  defaultTtl: 2 * 60 * 1000, // 2 minutes
  cleanupInterval: 30 * 1000 // 30 seconds
});

export const leaderboardCache = new LRUCache<any>({
  maxSize: 100,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
});

export const seasonsCache = new LRUCache<any>({
  maxSize: 10,
  defaultTtl: 10 * 60 * 1000, // 10 minutes
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
});

/**
 * Cache key generators for consistent key formatting
 */
export const CacheKeys = {
  visits: (season: number, page: number, limit: number, filters: Record<string, any>) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `visits_${season}_${page}_${limit}_${filterStr}`;
  },

  leaderboard: (season: number, sortByVisits: boolean, searchQuery?: string) => {
    return `leaderboard_${season}_${sortByVisits}_${searchQuery || ''}`;
  },

  seasons: () => 'available_seasons',

  userStats: (userId: string, season: number) => `user_stats_${userId}_${season}`,

  searchResults: (query: string, season: number, limit: number) => {
    return `search_${query}_${season}_${limit}`;
  }
};

/**
 * Cache wrapper function for API responses
 */
export async function withCache<T>(
  cache: LRUCache<T>,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  try {
    const data = await fetchFn();
    cache.set(key, data, ttl);
    return data;
  } catch (error) {
    console.error(`Cache fetch error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCachePattern(cache: LRUCache<any>, pattern: RegExp): number {
  let invalidatedCount = 0;
  
  // Since we can't iterate over Map keys directly with pattern matching,
  // we'll need to implement this differently in a real scenario
  // For now, we'll provide a placeholder implementation
  
  console.log(`Invalidating cache entries matching pattern: ${pattern}`);
  return invalidatedCount;
}

/**
 * Cache warming utility
 */
export async function warmCache() {
  try {
    console.log('Starting cache warming...');

    // Pre-warm seasons cache
    const seasonsKey = CacheKeys.seasons();
    if (!seasonsCache.has(seasonsKey)) {
      const response = await fetch('/api/results/seasons');
      if (response.ok) {
        const seasons = await response.json();
        seasonsCache.set(seasonsKey, seasons);
        console.log('Warmed seasons cache');
      }
    }

    // Pre-warm current year data
    const currentYear = new Date().getFullYear();
    const currentYearKey = CacheKeys.visits(currentYear, 1, 50, { state: 'APPROVED' });
    if (!visitsCache.has(currentYearKey)) {
      const response = await fetch(`/api/results/visits/${currentYear}?page=1&limit=50&state=APPROVED`);
      if (response.ok) {
        const visits = await response.json();
        visitsCache.set(currentYearKey, visits);
        console.log('Warmed current year visits cache');
      }
    }

    console.log('Cache warming completed');
  } catch (error) {
    console.error('Error warming cache:', error);
  }
}

/**
 * Cache performance monitoring
 */
export function getCacheStats() {
  return {
    visits: visitsCache.getStats(),
    leaderboard: leaderboardCache.getStats(),
    seasons: seasonsCache.getStats()
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  visitsCache.clear();
  leaderboardCache.clear();
  seasonsCache.clear();
  console.log('All caches cleared');
}

/**
 * Cache middleware for API routes
 */
export function createCacheMiddleware<T>(
  cache: LRUCache<T>,
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return async function cacheMiddleware(
    req: Request,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const key = keyGenerator(req);
    return withCache(cache, key, fetchFn, ttl);
  };
}
