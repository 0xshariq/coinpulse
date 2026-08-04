/**
 * A simple bounded cache with LRU (Least Recently Used) eviction policy.
 * Automatically removes expired entries and evicts oldest entries when capacity is exceeded.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessedAt: number;
}

export class BoundedCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxSize: number = 50, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize;

    // Periodically clean up expired entries
    this.cleanupInterval = setInterval(() => {
      this.removeExpired();
    }, cleanupIntervalMs);
  }

  /**
   * Set a value in the cache with an optional TTL (in milliseconds).
   */
  set(key: string, value: T, ttlMs: number = 3600000): void {
    const now = Date.now();

    // Remove expired entries if at capacity
    if (this.map.size >= this.maxSize) {
      this.removeExpired();

      // If still at capacity, evict the least recently used entry
      if (this.map.size >= this.maxSize) {
        this.evictLRU();
      }
    }

    this.map.set(key, {
      value,
      expiresAt: now + ttlMs,
      accessedAt: now,
    });
  }

  /**
   * Get a value from the cache.
   * Returns null if the key doesn't exist or the entry has expired.
   */
  get(key: string): T | null {
    const entry = this.map.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (entry.expiresAt <= now) {
      this.map.delete(key);
      return null;
    }

    // Update access time for LRU tracking
    entry.accessedAt = now;
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;

    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a key from the cache.
   */
  delete(key: string): boolean {
    return this.map.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Get the current size of the cache.
   */
  size(): number {
    return this.map.size;
  }

  /**
   * Remove all expired entries.
   */
  private removeExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.map.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.map.delete(key));
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.map.entries()) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.map.delete(oldestKey);
    }
  }

  /**
   * Clean up resources (stop the cleanup interval).
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Factory function to create a bounded cache with serialization support.
 * Useful for syncing with sessionStorage or localStorage.
 */
export function createBoundedCacheWithStorage<T>(
  maxSize: number,
  storageKey: string,
  useSessionStorage: boolean = true
): {
  cache: BoundedCache<T>;
  hydrateFromStorage: () => void;
  syncToStorage: () => void;
} {
  const cache = new BoundedCache<T>(maxSize);
  const storage = useSessionStorage ? sessionStorage : localStorage;

  const hydrateFromStorage = () => {
    try {
      const data = storage.getItem(storageKey);
      if (!data) return;

      const entries: Array<[string, CacheEntry<T>]> = JSON.parse(data);
      const now = Date.now();

      for (const [key, entry] of entries) {
        // Only restore non-expired entries
        if (entry.expiresAt > now) {
          cache.set(
            key,
            entry.value,
            Math.max(entry.expiresAt - now, 0)
          );
        }
      }
    } catch (error) {
      console.error(`Failed to hydrate cache from storage:`, error);
    }
  };

  const syncToStorage = () => {
    try {
      const entries = Array.from((cache as any).map.entries());
      storage.setItem(storageKey, JSON.stringify(entries));
    } catch (error) {
      console.error(`Failed to sync cache to storage:`, error);
    }
  };

  return { cache, hydrateFromStorage, syncToStorage };
}
