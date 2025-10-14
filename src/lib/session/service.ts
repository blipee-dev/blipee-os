import crypto from 'crypto';
// Dynamic import to avoid Edge Runtime issues
type RedisInstance = any;

export interface SessionData {
  userId: string;
  organizationId?: string;
  permissions: string[];
  mfaVerified?: boolean;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}

export interface SessionConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    tls?: boolean;
    keyPrefix?: string;
  };
  upstash?: {
    url: string;
    token: string;
    keyPrefix?: string;
  };
  sessionTTL?: number; // seconds
  slidingExpiration?: boolean;
  cookieName?: string;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
}

/**
 * Enterprise-grade session management with Redis
 */
export class SessionService {
  private redis: RedisInstance | null = null;
  private config: Required<SessionConfig>;
  private readonly DEFAULT_TTL = 8 * 60 * 60; // 8 hours

  constructor(config: SessionConfig = {}) {
    // Initialize with global session store
    this.inMemorySessions = ((global as any).__sessionStore__ ||= new Map<string, SessionData>());

    this.config = {
      redis: config.redis,
      upstash: config.upstash === undefined ? (
        // Auto-detect Upstash from environment
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? {
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
          keyPrefix: 'session:',
        } : undefined
      ) : config.upstash,
      sessionTTL: config.sessionTTL || this.DEFAULT_TTL,
      slidingExpiration: config.slidingExpiration !== false,
      cookieName: config.cookieName || 'sessionid',
      cookieOptions: {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
        ...config.cookieOptions,
      },
    };

    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (typeof window !== 'undefined') {
        return; // Client-side, skip Redis initialization
      }

      // Try Upstash Redis first (REST API - works in serverless)
      if (this.config.upstash) {
        const { Redis } = await import('@upstash/redis');
        this.redis = new Redis({
          url: this.config.upstash.url,
          token: this.config.upstash.token,
        });

        // Wrap Upstash client to match ioredis API
        const upstashClient = this.redis;
        const keyPrefix = this.config.upstash.keyPrefix || '';
        this.redis = {
          async get(key: string) {
            return await upstashClient.get(keyPrefix + key);
          },
          async set(key: string, value: string, ex?: string, ttl?: number) {
            if (ex === 'EX' && ttl) {
              return await upstashClient.set(keyPrefix + key, value, { ex: ttl });
            }
            return await upstashClient.set(keyPrefix + key, value);
          },
          async del(key: string) {
            return await upstashClient.del(keyPrefix + key);
          },
          async ping() {
            return await upstashClient.ping();
          }
        };

        // Test connection
        await this.redis.ping();
        console.log('✅ Upstash Redis session store connected');
        return;
      }

      // Fallback to traditional ioredis (TCP - for self-hosted Redis)
      if (this.config.redis) {
        const ioredis = await import('ioredis');
        const Redis = ioredis.default || ioredis.Redis;

        this.redis = new Redis({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          tls: this.config.redis.tls ? {} : undefined,
          keyPrefix: this.config.redis.keyPrefix,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          connectTimeout: 5000,
          commandTimeout: 5000,
          retryStrategy: (times) => {
            if (process.env.NODE_ENV !== 'production' && times > 5) {
              console.log('Redis not available after 5 attempts, using in-memory sessions');
              return null;
            }
            if (times > 10) {
              return 30000;
            }
            return Math.min(times * 50, 2000);
          },
          reconnectOnError: (err) => {
            return err.message.includes('READONLY');
          },
        });

        await Promise.race([
          this.redis.ping(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
          )
        ]);
        console.log('✅ ioredis session store connected');
        return;
      }

      // No Redis configured, use in-memory
      console.log('ℹ️ No Redis configured, using in-memory sessions');
    } catch (error) {
      console.error('Failed to connect to Redis, falling back to in-memory sessions:', error);
      this.redis = null;
    }
  }

  /**
   * Create a new session
   */
  async createSession(data: Omit<SessionData, 'createdAt' | 'lastAccessedAt' | 'expiresAt'>): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTTL * 1000);

    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
    };

    await this.setSession(sessionId, sessionData);
    return sessionId;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;

    try {
      if (this.redis) {
        const data = await this.redis.get(sessionId);
        if (!data) return null;

        const session: SessionData = JSON.parse(data);
        
        // Check expiration
        if (new Date(session.expiresAt) < new Date()) {
          await this.deleteSession(sessionId);
          return null;
        }

        // Update last accessed time if sliding expiration is enabled
        if (this.config.slidingExpiration) {
          session.lastAccessedAt = new Date();
          session.expiresAt = new Date(Date.now() + this.config.sessionTTL * 1000);
          await this.setSession(sessionId, session);
        }

        return session;
      } else {
        // Fallback to in-memory storage (development only)
        return this.getInMemorySession(sessionId);
      }
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      lastAccessedAt: new Date(),
    };

    await this.setSession(sessionId, updatedSession);
    return true;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(sessionId);
    } else {
      this.deleteInMemorySession(sessionId);
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    if (!this.redis) {
      console.warn('Cannot delete user sessions without Redis');
      return 0;
    }

    let deletedCount = 0;
    const stream = this.redis.scanStream({
      match: `${this.config.redis!.keyPrefix}*`,
      count: 100,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const session: SessionData = JSON.parse(data);
          if (session.userId === userId) {
            await this.redis.del(key);
            deletedCount++;
          }
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Array<SessionData & { sessionId: string }>> {
    if (!this.redis) {
      console.warn('Cannot get user sessions without Redis');
      return [];
    }

    const sessions: Array<SessionData & { sessionId: string }> = [];
    const stream = this.redis.scanStream({
      match: `${this.config.redis!.keyPrefix}*`,
      count: 100,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const session: SessionData = JSON.parse(data);
          if (session.userId === userId && new Date(session.expiresAt) > new Date()) {
            sessions.push({
              ...session,
              sessionId: key.replace(this.config.redis!.keyPrefix!, ''),
            });
          }
        }
      }
    }

    return sessions.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }

  /**
   * Validate session and check permissions
   */
  async validateSession(
    sessionId: string, 
    requiredPermissions?: string[]
  ): Promise<{ valid: boolean; session?: SessionData; reason?: string }> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found or expired' };
    }

    // Check MFA requirement
    if (!session.mfaVerified && this.requiresMFA(session)) {
      return { valid: false, reason: 'MFA verification required', session };
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermissions = requiredPermissions.every(perm => 
        session.permissions.includes(perm) || session.permissions.includes('*')
      );
      
      if (!hasPermissions) {
        return { valid: false, reason: 'Insufficient permissions', session };
      }
    }

    return { valid: true, session };
  }

  /**
   * Refresh session expiration
   */
  async refreshSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    session.expiresAt = new Date(Date.now() + this.config.sessionTTL * 1000);
    await this.setSession(sessionId, session);
    return true;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    userCount: number;
  }> {
    if (!this.redis) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        userCount: 0,
      };
    }

    let totalSessions = 0;
    let activeSessions = 0;
    let expiredSessions = 0;
    const uniqueUsers = new Set<string>();

    const stream = this.redis.scanStream({
      match: `${this.config.redis!.keyPrefix}*`,
      count: 100,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        totalSessions++;
        const data = await this.redis.get(key);
        if (data) {
          const session: SessionData = JSON.parse(data);
          if (new Date(session.expiresAt) > new Date()) {
            activeSessions++;
            uniqueUsers.add(session.userId);
          } else {
            expiredSessions++;
          }
        }
      }
    }

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      userCount: uniqueUsers.size,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    if (!this.redis) return 0;

    let cleanedCount = 0;
    const stream = this.redis.scanStream({
      match: `${this.config.redis!.keyPrefix}*`,
      count: 100,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const session: SessionData = JSON.parse(data);
          if (new Date(session.expiresAt) < new Date()) {
            await this.redis.del(key);
            cleanedCount++;
          }
        }
      }
    }

    return cleanedCount;
  }

  // Helper methods
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async setSession(sessionId: string, data: SessionData): Promise<void> {
    if (this.redis) {
      await this.redis.setex(
        sessionId,
        this.config.sessionTTL,
        JSON.stringify(data)
      );
    } else {
      this.setInMemorySession(sessionId, data);
    }
  }

  private requiresMFA(session: SessionData): boolean {
    // Implement your MFA requirement logic here
    // For example, check if user has MFA enabled
    return false; // Placeholder
  }

  // Global in-memory fallback for development (shared across all instances)
  // Use global scope to persist sessions across hot reloads
  private inMemorySessions: Map<string, SessionData>;

  private getInMemorySession(sessionId: string): SessionData | null {
    console.log('🔍 Getting in-memory session:', {
      sessionId,
      totalSessions: this.inMemorySessions.size,
      sessionKeys: Array.from(this.inMemorySessions.keys())
    });
    const session = this.inMemorySessions.get(sessionId);
    if (!session) {
      console.log('❌ Session not found in memory store');
      return null;
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.inMemorySessions.delete(sessionId);
      return null;
    }

    if (this.config.slidingExpiration) {
      session.lastAccessedAt = new Date();
      session.expiresAt = new Date(Date.now() + this.config.sessionTTL * 1000);
    }

    return session;
  }

  private setInMemorySession(sessionId: string, data: SessionData): void {
    console.log('💾 Setting in-memory session:', {
      sessionId,
      userId: data.userId,
      totalSessionsBefore: this.inMemorySessions.size
    });
    this.inMemorySessions.set(sessionId, data);
    console.log('✅ Session stored, total sessions now:', this.inMemorySessions.size);
    
    // Schedule cleanup
    setTimeout(() => {
      this.inMemorySessions.delete(sessionId);
    }, this.config.sessionTTL * 1000);
  }

  private deleteInMemorySession(sessionId: string): void {
    this.inMemorySessions.delete(sessionId);
  }

  /**
   * List all active sessions
   */
  async list(): Promise<SessionData[]> {
    // Clean up expired sessions first
    const now = new Date();
    for (const [sessionId, session] of this.inMemorySessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.inMemorySessions.delete(sessionId);
      }
    }

    // Return all remaining sessions
    return Array.from(this.inMemorySessions.values());
  }

  /**
   * Parse session cookie from request headers
   */
  parseSessionCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies[this.config.cookieName] || null;
  }

  /**
   * Generate session cookie header
   */
  generateCookieHeader(sessionId: string): string {
    const options = this.config.cookieOptions;
    const parts = [`${this.config.cookieName}=${sessionId}`];

    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    if (options.path) parts.push(`Path=${options.path}`);
    
    parts.push(`Max-Age=${this.config.sessionTTL}`);

    return parts.join('; ');
  }

  /**
   * Generate logout cookie header
   */
  generateLogoutCookieHeader(): string {
    const options = this.config.cookieOptions;
    return `${this.config.cookieName}=; Max-Age=0; Path=${options.path || '/'}`;
  }
}