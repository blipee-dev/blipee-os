import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { cacheConfig } from './config';
import { RedisWrapper } from './redis-wrapper';

/**
 * Redis client configuration with cluster support and connection pooling
 */
export class RedisClient {
  private client: Redis | UpstashRedis | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private isUpstash = false;

  /**
   * Get Redis client instance (wrapped for compatibility)
   */
  async getClient(): Promise<RedisWrapper> {
    // During build, return a dummy wrapper
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return new RedisWrapper(null as any);
    }

    if (this.client && this.isConnected) {
      return new RedisWrapper(this.client);
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
      return new RedisWrapper(this.client!);
    }

    this.connectionPromise = this.connect();
    await this.connectionPromise;
    return new RedisWrapper(this.client!);
  }

  /**
   * Connect to Redis
   */
  private async connect(): Promise<void> {
    // Skip connection during build or static generation
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      this.isConnected = false;
      return;
    }

    try {
      // Check for Upstash credentials first (production-ready solution)
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.isUpstash = true;

        try {
          // Validate environment variables
          if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Missing Upstash Redis environment variables');
          }

          this.client = new UpstashRedis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
            retry: {
              retries: 3,
              backoff: (retryCount) => Math.exp(retryCount) * 50,
            },
          });

          // Check if client was created successfully
          if (!this.client) {
            throw new Error('Failed to create Upstash Redis client');
          }

          // Test connection with timeout - check client exists first
          if (!this.client || typeof (this.client as any).ping !== 'function') {
            throw new Error('Invalid Upstash Redis client');
          }
          const pingPromise = (this.client as UpstashRedis).ping();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
          );

          await Promise.race([pingPromise, timeoutPromise]);
          this.isConnected = true;
          console.log('✅ Connected to Upstash Redis successfully');
          return;
        } catch (error) {
          console.warn('⚠️ Failed to connect to Upstash Redis:', error);
          this.client = null;
          this.isConnected = false;
          // Don't fall back to local Redis - just fail gracefully
          return;
        }
      }

      // Only try local Redis if explicitly configured (no Upstash available)
      if (!process.env.REDIS_HOST) {
        // No Redis configured - skip connection
        this.isConnected = false;
        return;
      }

      // Fall back to regular Redis (only if REDIS_HOST is explicitly set)
      const config = cacheConfig.redis;

      if (config.cluster.enabled && config.cluster.nodes.length > 0) {
        // Cluster mode
        this.client = new Redis.Cluster(config.cluster.nodes, {
          redisOptions: {
            password: config.password,
            tls: config.tls.enabled ? {} : undefined,
          },
          clusterRetryStrategy: (times) => {
            if (times > config.cluster.maxRetries) {
              return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
          },
        }) as any;
      } else {
        // Single instance mode
        this.client = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
          retryStrategy: (times) => {
            if (times > 10) {
              console.error('Redis connection failed after 10 attempts');
              return null;
            }
            return Math.min(times * 100, 3000);
          },
          maxRetriesPerRequest: 3,
          enableOfflineQueue: true,
          lazyConnect: true, // Changed to true to prevent automatic connection
        });

      }

      // Set up event handlers (only for ioredis)
      if (!this.isUpstash && this.client instanceof Redis) {
        this.client.on('connect', () => {
          this.isConnected = true;
        });

        this.client.on('error', (err) => {
          // Suppress error logging during build or when Redis is not expected
          if (process.env.NEXT_PHASE !== 'phase-production-build' &&
              process.env.NODE_ENV !== 'test' &&
              !err.message.includes('ECONNREFUSED')) {
            console.error('Redis error:', err);
          }
          this.isConnected = false;
        });

        this.client.on('close', () => {
          this.isConnected = false;
        });
      }

      // Connect and wait for connection (only for ioredis with lazyConnect)
      if (!this.isUpstash && this.client && this.client instanceof Redis) {
        await (this.client as Redis).connect();
      }

      // Test connection
      if (this.client) {
        await (this.client as any).ping();
        this.isConnected = true;
      } else {
        throw new Error('No Redis client available');
      }

    } catch (error) {
      this.client = null;
      this.isConnected = false;
      // Don't throw error - gracefully fallback to in-memory caching
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      if (!this.isUpstash && this.client instanceof Redis) {
        await this.client.quit();
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Execute a command with automatic reconnection
   */
  async execute<T>(
    command: (client: RedisWrapper) => Promise<T>
  ): Promise<T | null> {
    try {
      const client = await this.getClient();
      return await command(client);
    } catch (error) {
      console.error('Redis command error:', error);
      return null;
    }
  }
}

// Lazy-initialized singleton instance
let _redisClient: RedisClient | null = null;

export const getRedisClient = (): RedisClient => {
  if (!_redisClient) {
    _redisClient = new RedisClient();
  }
  return _redisClient;
};

// Export for backward compatibility with proper method delegation
export const redisClient = new Proxy({} as RedisClient & RedisWrapper, {
  get(_target, prop) {
    const client = getRedisClient();
    const clientProp = client[prop as keyof RedisClient];

    // If it's a RedisClient method, return it
    if (typeof clientProp === 'function') {
      return clientProp.bind(client);
    }

    // If it's a RedisClient property, return it
    if (clientProp !== undefined) {
      return clientProp;
    }

    // Otherwise, delegate to RedisWrapper methods (get, set, setex, del, etc.)
    return async function(...args: any[]) {
      try {
        const wrapper = await client.getClient();
        const wrapperMethod = wrapper[prop as keyof RedisWrapper];

        if (typeof wrapperMethod === 'function') {
          return await (wrapperMethod as any).apply(wrapper, args);
        }

        throw new Error(`Method ${String(prop)} not found on RedisClient or RedisWrapper`);
      } catch (error) {
        console.warn(`Redis method ${String(prop)} failed:`, error);
        return null;
      }
    };
  }
});