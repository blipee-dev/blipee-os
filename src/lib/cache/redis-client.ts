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
    // Skip connection during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⏭️  Skipping Redis connection during build');
      return;
    }

    try {
      // Check for Upstash credentials first
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.log('🚀 Using Upstash Redis (Serverless)');
        this.isUpstash = true;
        
        this.client = new UpstashRedis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
          retry: {
            retries: 3,
            backoff: (retryCount) => Math.exp(retryCount) * 50,
          },
        });

        // Test connection
        await (this.client as UpstashRedis).ping();
        this.isConnected = true;
        console.log('✅ Upstash Redis connected');
        return;
      }

      // Fall back to regular Redis
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
          lazyConnect: false,
        });

      }

      // Set up event handlers (only for ioredis)
      if (!this.isUpstash && this.client instanceof Redis) {
        this.client.on('connect', () => {
          console.log('✅ Redis connected');
          this.isConnected = true;
        });

        this.client.on('error', (err) => {
          console.error('Redis error:', err);
          this.isConnected = false;
        });

        this.client.on('close', () => {
          console.log('Redis connection closed');
          this.isConnected = false;
        });
      }

      // Wait for connection
      await (this.client as any).ping();
      this.isConnected = true;

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      throw error;
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

// Export singleton instance
export const redisClient = new RedisClient();