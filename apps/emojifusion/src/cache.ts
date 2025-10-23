// Simple memory-based cache with TTL for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Maximum cache entries
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Create cache key from request parameters
  private createKey(words: string, mode: string, tone: string, lines: number): string {
    return `${words}|${mode}|${tone}|${lines}`.toLowerCase();
  }

  // Get cached response if still valid
  get(words: string, mode: string, tone: string, lines: number): any | null {
    const key = this.createKey(words, mode, tone, lines);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('🎯 Cache hit for:', key);
    return entry.data;
  }

  // Set cache entry with optional TTL
  set(words: string, mode: string, tone: string, lines: number, data: any, ttl?: number): void {
    const key = this.createKey(words, mode, tone, lines);
    
    // Implement simple LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
    
    console.log('💾 Cached response for:', key);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log('🧹 Cleaned up', toDelete.length, 'expired cache entries');
    }
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Get cache statistics
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Automatic cleanup every 2 minutes
setInterval(() => {
  apiCache.cleanup();
}, 2 * 60 * 1000);

// Clear cache when page visibility changes (user returns to tab)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      apiCache.cleanup();
    }
  });
}