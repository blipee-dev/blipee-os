import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface DDoSConfig {
  // Connection limits
  maxConnectionsPerIP: number;
  connectionWindowMs: number;
  
  // Request pattern detection
  suspiciousPatterns: RegExp[];
  
  // Geo-blocking
  blockedCountries?: string[];
  allowedCountries?: string[];
  
  // User agent filtering
  blockedUserAgents?: RegExp[];
  
  // Request size limits
  maxRequestSize: number; // bytes
  maxUrlLength: number;
  
  // Behavioral analysis
  enableBehavioralAnalysis: boolean;
  suspiciousBehaviorThreshold: number;
}

export const DEFAULT_DDOS_CONFIG: DDoSConfig = {
  maxConnectionsPerIP: 100,
  connectionWindowMs: 60000, // 1 minute
  
  suspiciousPatterns: [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /eval\s*\(/gi, // Code injection
    /base64_decode/gi, // Encoded payloads
  ],
  
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  maxUrlLength: 2048,
  
  enableBehavioralAnalysis: true,
  suspiciousBehaviorThreshold: 0.7,
};

interface ConnectionTracker {
  count: number;
  firstSeen: number;
  lastSeen: number;
  suspicious: number;
}

/**
 * DDoS Protection Service
 */
export class DDoSProtection {
  private config: DDoSConfig;
  private connections = new Map<string, ConnectionTracker>();
  private blacklist = new Set<string>();
  private whitelist = new Set<string>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DDoSConfig> = {}) {
    this.config = { ...DEFAULT_DDOS_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Check if request should be blocked
   */
  async shouldBlock(request: NextRequest): Promise<{
    blocked: boolean;
    reason?: string;
    score?: number;
  }> {
    const ip = this.getClientIP(request);
    
    // Check whitelist
    if (this.whitelist.has(ip)) {
      return { blocked: false };
    }

    // Check blacklist
    if (this.blacklist.has(ip)) {
      return { blocked: true, reason: 'IP blacklisted' };
    }

    // Check various protection mechanisms
    const checks = await Promise.all([
      this.checkConnectionLimit(ip),
      this.checkRequestPattern(request),
      this.checkGeoBlocking(request),
      this.checkUserAgent(request),
      this.checkRequestSize(request),
      this.checkBehavior(ip, request),
    ]);

    // Calculate threat score
    const threatScore = this.calculateThreatScore(checks);
    
    // Block if any critical check failed or threat score too high
    const blocked = checks.some(c => c.blocked && 'critical' in c && c.critical) || threatScore > 0.8;
    const reason = checks.find(c => c.blocked)?.reason;

    // Auto-blacklist high threat IPs
    if (threatScore > 0.9) {
      this.blacklist.add(ip);
    }

    return { blocked, reason, score: threatScore };
  }

  /**
   * Check connection limits
   */
  private checkConnectionLimit(ip: string): {
    blocked: boolean;
    reason?: string;
    critical?: boolean;
    score: number;
  } {
    const now = Date.now();
    let tracker = this.connections.get(ip);

    if (!tracker) {
      tracker = {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        suspicious: 0,
      };
      this.connections.set(ip, tracker);
      return { blocked: false, score: 0 };
    }

    // Reset if outside window
    if (now - tracker.firstSeen > this.config.connectionWindowMs) {
      tracker.count = 1;
      tracker.firstSeen = now;
      tracker.lastSeen = now;
      return { blocked: false, score: 0 };
    }

    tracker.count++;
    tracker.lastSeen = now;

    const score = tracker.count / this.config.maxConnectionsPerIP;
    
    if (tracker.count > this.config.maxConnectionsPerIP) {
      return {
        blocked: true,
        reason: 'Connection limit exceeded',
        critical: true,
        score: Math.min(score, 1),
      };
    }

    return { blocked: false, score: score * 0.5 };
  }

  /**
   * Check request patterns for suspicious content
   */
  private checkRequestPattern(request: NextRequest): {
    blocked: boolean;
    reason?: string;
    score: number;
  } {
    const url = request.url;
    const body = request.body;
    
    // Check URL
    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(url)) {
        return {
          blocked: true,
          reason: 'Suspicious request pattern detected',
          score: 1,
        };
      }
    }

    // URL length check
    if (url.length > this.config.maxUrlLength) {
      return {
        blocked: true,
        reason: 'URL too long',
        score: 0.8,
      };
    }

    return { blocked: false, score: 0 };
  }

  /**
   * Check geo-blocking rules
   */
  private async checkGeoBlocking(request: NextRequest): Promise<{
    blocked: boolean;
    reason?: string;
    score: number;
  }> {
    // This would typically use a GeoIP service
    // For now, we'll use CloudFlare headers if available
    const country = request.headers.get('cf-ipcountry');
    
    if (!country) {
      return { blocked: false, score: 0 };
    }

    if (this.config.blockedCountries?.includes(country)) {
      return {
        blocked: true,
        reason: `Access from ${country} is blocked`,
        score: 1,
      };
    }

    if (this.config.allowedCountries && !this.config.allowedCountries.includes(country)) {
      return {
        blocked: true,
        reason: `Access only allowed from specific countries`,
        score: 1,
      };
    }

    return { blocked: false, score: 0 };
  }

  /**
   * Check user agent
   */
  private checkUserAgent(request: NextRequest): {
    blocked: boolean;
    reason?: string;
    score: number;
  } {
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check for missing user agent (suspicious)
    if (!userAgent) {
      return {
        blocked: false,
        score: 0.3,
      };
    }

    // Check blocked patterns
    if (this.config.blockedUserAgents) {
      for (const pattern of this.config.blockedUserAgents) {
        if (pattern.test(userAgent)) {
          return {
            blocked: true,
            reason: 'Blocked user agent',
            score: 0.8,
          };
        }
      }
    }

    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    
    return {
      blocked: false,
      score: isBot ? 0.2 : 0,
    };
  }

  /**
   * Check request size
   */
  private checkRequestSize(request: NextRequest): {
    blocked: boolean;
    reason?: string;
    score: number;
  } {
    const contentLength = request.headers.get('content-length');
    
    if (!contentLength) {
      return { blocked: false, score: 0 };
    }

    const size = parseInt(contentLength);
    
    if (size > this.config.maxRequestSize) {
      return {
        blocked: true,
        reason: 'Request size too large',
        score: 0.9,
      };
    }

    // Calculate score based on size
    const score = size / this.config.maxRequestSize * 0.3;
    
    return { blocked: false, score };
  }

  /**
   * Behavioral analysis
   */
  private checkBehavior(ip: string, request: NextRequest): {
    blocked: boolean;
    reason?: string;
    score: number;
  } {
    if (!this.config.enableBehavioralAnalysis) {
      return { blocked: false, score: 0 };
    }

    const tracker = this.connections.get(ip);
    if (!tracker) {
      return { blocked: false, score: 0 };
    }

    // Analyze request patterns
    const now = Date.now();
    const timeSinceFirst = now - tracker.firstSeen;
    const avgTimeBetweenRequests = timeSinceFirst / tracker.count;

    // Too many requests too quickly
    if (avgTimeBetweenRequests < 100) { // Less than 100ms between requests
      tracker.suspicious++;
      return {
        blocked: false,
        score: 0.7,
      };
    }

    // Check for automated patterns
    if (tracker.count > 10 && avgTimeBetweenRequests < 1000) {
      const variance = this.calculateTimeVariance(ip);
      if (variance < 0.1) { // Very regular intervals (likely automated)
        tracker.suspicious++;
        return {
          blocked: false,
          score: 0.6,
        };
      }
    }

    const suspicionScore = tracker.suspicious / tracker.count;
    
    if (suspicionScore > this.config.suspiciousBehaviorThreshold) {
      return {
        blocked: true,
        reason: 'Suspicious behavior detected',
        score: suspicionScore,
      };
    }

    return { blocked: false, score: suspicionScore * 0.5 };
  }

  /**
   * Calculate threat score from multiple checks
   */
  private calculateThreatScore(checks: Array<{ score: number }>): number {
    const weights = [0.3, 0.2, 0.15, 0.1, 0.15, 0.1]; // Weights for each check
    let totalScore = 0;
    
    checks.forEach((check, index) => {
      totalScore += check.score * (weights[index] || 0.1);
    });

    return Math.min(totalScore, 1);
  }

  /**
   * Calculate time variance for behavioral analysis
   */
  private calculateTimeVariance(ip: string): number {
    // Simplified variance calculation
    // In production, you'd track individual request times
    return 0.5; // Placeholder
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers for real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to remote address
    return request.ip || '127.0.0.1';
  }

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
    this.blacklist.delete(ip);
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
    this.whitelist.delete(ip);
  }

  /**
   * Remove IP from lists
   */
  removeFromLists(ip: string): void {
    this.whitelist.delete(ip);
    this.blacklist.delete(ip);
  }

  /**
   * Get protection stats
   */
  getStats(): {
    totalConnections: number;
    blacklistedIPs: number;
    whitelistedIPs: number;
    suspiciousIPs: number;
  } {
    let suspiciousCount = 0;
    
    const entries = Array.from(this.connections.entries());
    for (const [, tracker] of entries) {
      if (tracker.suspicious > 0) {
        suspiciousCount++;
      }
    }

    return {
      totalConnections: this.connections.size,
      blacklistedIPs: this.blacklist.size,
      whitelistedIPs: this.whitelist.size,
      suspiciousIPs: suspiciousCount,
    };
  }

  /**
   * Cleanup old connections
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.config.connectionWindowMs * 2;

    const entries = Array.from(this.connections.entries());
    for (const [ip, tracker] of entries) {
      if (now - tracker.lastSeen > maxAge) {
        this.connections.delete(ip);
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
let ddosProtection: DDoSProtection | null = null;

export function getDDoSProtection(config?: Partial<DDoSConfig>): DDoSProtection {
  if (!ddosProtection) {
    ddosProtection = new DDoSProtection(config);
  }
  return ddosProtection;
}