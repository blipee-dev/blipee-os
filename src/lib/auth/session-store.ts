/**
 * Session store implementation
 * Uses in-memory storage with TTL support as a fallback when Redis is not available
 */

interface SessionData {
  value: any;
  expiresAt: number;
}

class InMemorySessionStore {
  private store: Map<string, SessionData> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired sessions every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  async get(key: string): Promise<any | null> {
    const data = this.store.get(key);
    
    if (!data) {
      return null;
    }
    
    if (Date.now() > data.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return data.value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const data = this.store.get(key);
    
    if (!data) {
      return false;
    }
    
    if (Date.now() > data.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  async ttl(key: string): Promise<number> {
    const data = this.store.get(key);
    
    if (!data) {
      return -2; // Key does not exist
    }
    
    const ttl = Math.floor((data.expiresAt - Date.now()) / 1000);
    
    if (ttl < 0) {
      this.store.delete(key);
      return -2;
    }
    
    return ttl;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const data = this.store.get(key);
    
    if (!data) {
      return false;
    }
    
    data.expiresAt = Date.now() + (ttlSeconds * 1000);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    
    for (const [key, data] of entries) {
      if (now > data.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Export singleton instance
export const sessionStore = new InMemorySessionStore();