import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

/**
 * Unified wrapper for Redis commands that works with both Upstash and ioredis
 */
export class RedisWrapper {
  constructor(private client: Redis | UpstashRedis | null) {}

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    const result = await this.client.get(key);
    return result as string | null;
  }

  async set(key: string, value: string, expiryMode?: string | any[], time?: number | string, setMode?: string | string[]): Promise<any> {
    if (!this.client) return 'OK';
    if (this.client instanceof UpstashRedis) {
      // Upstash syntax
      if (expiryMode === 'EX' && time) {
        return await this.client.set(key, value, { ex: Number(time) });
      }
      return await this.client.set(key, value);
    } else {
      // ioredis syntax
      const args: any[] = [key, value];
      if (expiryMode) args.push(expiryMode);
      if (time) args.push(time);
      if (setMode) args.push(setMode);
      return await (this.client as Redis).set(...args);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<any> {
    if (!this.client) return 'OK';
    if (this.client instanceof UpstashRedis) {
      return await this.client.set(key, value, { ex: seconds });
    }
    return await (this.client as Redis).setex(key, seconds, value);
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.client) return 0;
    const result = await this.client.del(...keys);
    return Number(result);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    if (this.client instanceof UpstashRedis) {
      // Upstash doesn't support KEYS command directly
      // This is a limitation - in production, use tags instead
      console.warn('KEYS command not supported in Upstash. Use tags for pattern-based operations.');
      return [];
    }
    return await (this.client as Redis).keys(pattern);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const result = await this.client.sadd(key, ...members);
    return Number(result);
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.client.smembers(key);
    return result as string[];
  }

  async expire(key: string, seconds: number): Promise<number> {
    const result = await this.client.expire(key, seconds);
    return Number(result);
  }

  async flushdb(): Promise<string> {
    if (this.client instanceof UpstashRedis) {
      return await this.client.flushdb();
    }
    return await (this.client as Redis).flushdb();
  }

  async ping(): Promise<string> {
    const result = await this.client.ping();
    return result as string;
  }

  async info(section?: string): Promise<string> {
    if (this.client instanceof UpstashRedis) {
      // Upstash doesn't support INFO command
      return 'Upstash Redis (serverless)';
    }
    return await (this.client as Redis).info(section);
  }

  // Pipeline support
  pipeline() {
    if (this.client instanceof UpstashRedis) {
      return this.client.pipeline();
    }
    return (this.client as Redis).pipeline();
  }

  // Check client type
  isUpstash(): boolean {
    return this.client instanceof UpstashRedis;
  }

  // Scan support
  async scan(cursor: number, options?: { match?: string; count?: number }): Promise<{ cursor: number; keys: string[] }> {
    if (this.client instanceof UpstashRedis) {
      // Upstash has limited scan support
      const result = await this.client.scan(cursor, options);
      return {
        cursor: result[0],
        keys: result[1]
      };
    }
    
    const args: any[] = [cursor];
    if (options?.match) {
      args.push('MATCH', options.match);
    }
    if (options?.count) {
      args.push('COUNT', options.count);
    }
    
    const result = await (this.client as Redis).scan(...args);
    return {
      cursor: parseInt(result[0]),
      keys: result[1]
    };
  }

  // Database size
  async dbsize(): Promise<number> {
    if (this.client instanceof UpstashRedis) {
      const result = await this.client.dbsize();
      return result;
    }
    return await (this.client as Redis).dbsize();
  }
}