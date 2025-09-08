import { cache } from './service';
import { cacheConfig, cacheKeys } from './config';

export interface SessionData {
  userId: string;
  email: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  lastActivity: string;
}

export interface DeviceSession {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastSeen: string;
  fingerprint?: string;
}

/**
 * Session and user data caching
 */
export class SessionCache {
  /**
   * Store user session
   */
  async setSession(
    userId: string,
    session: SessionData,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.session.user(userId);
    
    return cache.set(key, session, {
      ttl: ttl || cacheConfig.ttl.session,
      tags: ['session', `user:${userId}`],
    });
  }

  /**
   * Get user session
   */
  async getSession(userId: string): Promise<SessionData | null> {
    const key = cacheKeys.session.user(userId);
    return cache.get<SessionData>(key);
  }

  /**
   * Update session activity
   */
  async touchSession(userId: string): Promise<boolean> {
    const session = await this.getSession(userId);
    if (!session) return false;
    
    session.lastActivity = new Date().toISOString();
    return this.setSession(userId, session);
  }

  /**
   * Store device session
   */
  async setDeviceSession(
    userId: string,
    deviceId: string,
    deviceData: DeviceSession,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.session.device(userId, deviceId);
    
    return cache.set(key, deviceData, {
      ttl: ttl || cacheConfig.ttl.session,
      tags: ['device-session', `user:${userId}`, `device:${deviceId}`],
    });
  }

  /**
   * Get device session
   */
  async getDeviceSession(
    userId: string,
    deviceId: string
  ): Promise<DeviceSession | null> {
    const key = cacheKeys.session.device(userId, deviceId);
    return cache.get<DeviceSession>(key);
  }

  /**
   * Get all device sessions for user
   */
  async getUserDevices(userId: string): Promise<DeviceSession[]> {
    // This would need to track device IDs separately
    // For now, return empty array
    return [];
  }

  /**
   * Cache user profile
   */
  async setUserProfile<T extends Record<string, any>>(
    userId: string,
    profile: T,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.user.profile(userId);
    
    return cache.set(key, profile, {
      ttl: ttl || cacheConfig.ttl.userProfile,
      tags: ['user-profile', `user:${userId}`],
    });
  }

  /**
   * Get cached user profile
   */
  async getUserProfile<T extends Record<string, any>>(
    userId: string
  ): Promise<T | null> {
    const key = cacheKeys.user.profile(userId);
    return cache.get<T>(key);
  }

  /**
   * Cache user permissions
   */
  async setUserPermissions(
    userId: string,
    permissions: string[],
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.user.permissions(userId);
    
    return cache.set(key, permissions, {
      ttl: ttl || cacheConfig.ttl.userProfile,
      tags: ['user-permissions', `user:${userId}`],
    });
  }

  /**
   * Get cached user permissions
   */
  async getUserPermissions(userId: string): Promise<string[] | null> {
    const key = cacheKeys.user.permissions(userId);
    return cache.get<string[]>(key);
  }

  /**
   * Cache user organizations
   */
  async setUserOrganizations(
    userId: string,
    organizations: any[],
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.user.organizations(userId);
    
    return cache.set(key, organizations, {
      ttl: ttl || cacheConfig.ttl.userProfile,
      tags: ['user-organizations', `user:${userId}`],
    });
  }

  /**
   * Get cached user organizations
   */
  async getUserOrganizations(userId: string): Promise<any[] | null> {
    const key = cacheKeys.user.organizations(userId);
    return cache.get<any[]>(key);
  }

  /**
   * Invalidate all user cache
   */
  async invalidateUser(userId: string): Promise<number> {
    return cache.invalidateByTags([`user:${userId}`]);
  }

  /**
   * Invalidate all sessions
   */
  async invalidateAllSessions(): Promise<number> {
    return cache.invalidateByTags(['session']);
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(userId: string): Promise<boolean> {
    const session = await this.getSession(userId);
    if (!session) return false;
    
    // Check if session is expired based on last activity
    const lastActivity = new Date(session.lastActivity);
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    
    return Date.now() - lastActivity.getTime() < maxInactivity;
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();