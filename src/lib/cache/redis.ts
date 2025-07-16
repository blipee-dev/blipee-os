import { z } from 'zod';

// Lazy load Redis to prevent build-time errors
let Redis: any = null;
if (typeof window === 'undefined') {
  try {
    Redis = require('ioredis');
  } catch (error) {
    console.warn('Redis module not available, using memory cache fallback');
  }
}

const redisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(6379),
  password: z.string().optional(),
  db: z.number().default(0),
  keyPrefix: z.string().default('blipee:'),
  ttl: z.number().default(3600), // 1 hour default TTL
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(100),
  enableOfflineQueue: z.boolean().default(true),
  useMemoryFallback: z.boolean().default(true), // Use memory cache if Redis unavailable
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export class RedisClient {
  private client: any | null = null;
  private config: RedisConfig;
  private isConnected = false;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();

  constructor(config?: Partial<RedisConfig>) {
    this.config = redisConfigSchema.parse(config || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'blipee:',
      useMemoryFallback: process.env.NODE_ENV === 'production',
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    // If Redis module is not available, use memory fallback
    if (!Redis) {
      if (this.config.useMemoryFallback) {
        console.log('Using in-memory cache (Redis not available)');
        this.isConnected = true;
        return;
      }
      throw new Error('Redis module not available and memory fallback disabled');
    }

    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryStrategy: (times: number) => {
          if (times > this.config.maxRetries) {
            console.error('Redis connection failed after maximum retries');
            if (this.config.useMemoryFallback) {
              console.log('Falling back to in-memory cache');
              this.client = null;
              this.isConnected = true; // Use memory cache
              return null;
            }
            return null;
          }
          return Math.min(times * this.config.retryDelay, 2000);
        },
        enableOfflineQueue: this.config.enableOfflineQueue,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error: any) => {
        console.error('Redis error:', error);
        if (this.config.useMemoryFallback && error.code === 'ECONNREFUSED') {
          console.log('Redis unavailable, using memory fallback');
          this.client = null;
          this.isConnected = true; // Use memory cache
        } else {
          this.isConnected = false;
        }
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      if (this.config.useMemoryFallback) {
        console.log('Using in-memory cache fallback');
        this.client = null;
        this.isConnected = true; // Use memory cache
      } else {
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Use memory cache if Redis is not available
    if (!this.client && this.isConnected && this.config.useMemoryFallback) {
      const cached = this.memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      this.memoryCache.delete(key);
      return null;
    }

    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping get operation');
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T = any>(
    key: string, 
    value: T, 
    ttl?: number
  ): Promise<boolean> {
    // Use memory cache if Redis is not available
    if (!this.client && this.isConnected && this.config.useMemoryFallback) {
      const expiry = ttl || this.config.ttl;
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + (expiry * 1000)
      });
      return true;
    }

    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping set operation');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.config.ttl;
      
      if (expiry > 0) {
        await this.client.setex(key, expiry, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    // Use memory cache if Redis is not available
    if (!this.client && this.isConnected && this.config.useMemoryFallback) {
      return this.memoryCache.delete(key);
    }

    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping delete operation');
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async increment(key: string, value: number = 1): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      console.error('Redis increment error:', error);
      return null;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.decrby(key, value);
    } catch (error) {
      console.error('Redis decrement error:', error);
      return null;
    }
  }

  async getPattern(pattern: string): Promise<Record<string, any>> {
    if (!this.client || !this.isConnected) {
      return {};
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return {};

      const values = await this.client.mget(...keys);
      const result: Record<string, any> = {};

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            result[key.replace(this.config.keyPrefix, '')] = JSON.parse(value);
          } catch {
            result[key.replace(this.config.keyPrefix, '')] = value;
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Redis getPattern error:', error);
      return {};
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.client.del(...keys);
    } catch (error) {
      console.error('Redis deletePattern error:', error);
      return 0;
    }
  }

  async flush(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

export const getRedisClient = async (): Promise<RedisClient> => {
  if (!redisClient) {
    redisClient = new RedisClient();
    await redisClient.connect();
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};