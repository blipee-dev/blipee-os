/**
 * LRU (Least Recently Used) Cache implementation
 * Efficient in-memory caching with size limits
 */

export class LRUCache<T> {
  private cache: Map<string, T>;
  private accessOrder: Map<string, number>;
  public readonly maxSize: number;
  private accessCounter = 0;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.accessOrder = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Update access order
      this.accessOrder.set(key, ++this.accessCounter);
      this.hits++;
      return value;
    }

    this.misses++;
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.accessOrder.set(key, ++this.accessCounter);
      return;
    }

    // If cache is full, evict LRU item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new item
    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get hit rate
   */
  get hitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }
}