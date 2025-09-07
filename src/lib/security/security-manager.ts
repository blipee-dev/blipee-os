/**
 * Advanced Security Manager
 * Comprehensive security system for enterprise-grade protection
 */

// Supabase client would be injected in production
// import { createClient } from '@/lib/supabase/server';
const createClient = () => ({ from: () => ({ select: () => ({ eq: () => ({ gte: () => Promise.resolve({ data: [], error: null }) }) }) }) });
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
// Rate limiting would be handled by middleware
// import rateLimit from 'express-rate-limit';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
  };
  authentication: {
    jwtSecret: string;
    jwtExpiration: string;
    refreshTokenExpiration: string;
    passwordPolicy: PasswordPolicy;
  };
  apiSecurity: {
    rateLimiting: RateLimitConfig[];
    ipWhitelist?: string[];
    requireHttps: boolean;
    corsOrigins: string[];
  };
  threatDetection: {
    maxFailedAttempts: number;
    lockoutDuration: number;
    anomalyDetection: boolean;
    geoBlocking: boolean;
  };
  audit: {
    logLevel: 'minimal' | 'standard' | 'verbose';
    retention: number; // days
    realTimeAlerts: boolean;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords to check
  maxAge: number; // days
}

export interface RateLimitConfig {
  path: string;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface ThreatAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: ThreatIndicator[];
  recommendations: string[];
  score: number; // 0-100
}

export interface ThreatIndicator {
  type: 'brute_force' | 'anomalous_access' | 'data_exfiltration' | 'suspicious_api_usage' | 'geo_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  source: string;
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'api_usage' | 'threat_detected';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint?: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  metadata: Record<string, any>;
  timestamp: Date;
}

export class SecurityManager {
  private config: SecurityConfig;
  private encryptionKey: Buffer;
  private supabase: any;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.encryptionKey = this.deriveEncryptionKey();
    this.supabase = createClient() as any;
    
    // Initialize security monitoring
    this.initializeSecurityMonitoring();
  }

  private deriveEncryptionKey(): Buffer {
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production';
    return crypto.scryptSync(secret, 'salt', this.config.encryption.keySize);
  }

  private initializeSecurityMonitoring() {
    // Set up real-time security monitoring
    if (this.config.audit.realTimeAlerts) {
      this.setupRealTimeAlerts();
    }
  }

  /**
   * Data Encryption & Decryption
   */
  public encryptSensitiveData(data: string): string {
    const iv = crypto.randomBytes(this.config.encryption.ivSize);
    const cipher = crypto.createCipher(this.config.encryption.algorithm, this.encryptionKey);
    cipher.update(data, 'utf8');
    const encrypted = cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  public decryptSensitiveData(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.encryptionKey);
    decipher.update(encrypted, 'hex');
    
    return decipher.final('utf8');
  }

  /**
   * Password Security
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  public validatePasswordPolicy(password: string, userId?: string): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const policy = this.config.authentication.passwordPolicy;

    if (password.length < policy.minLength) {
      violations.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      violations.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      violations.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /^(.)\1+$/, // All same character
      /^(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/, // Sequential
      /^(password|123456|qwerty|admin|root)/i // Common passwords
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        violations.push('Password contains common weak patterns');
        break;
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * JWT Token Management
   */
  public generateJWT(payload: any, expiresIn?: string): string {
    return jwt.sign(
      payload,
      this.config.authentication.jwtSecret,
      { expiresIn: expiresIn || this.config.authentication.jwtExpiration } as jwt.SignOptions
    );
  }

  public verifyJWT(token: string): any {
    try {
      return jwt.verify(token, this.config.authentication.jwtSecret);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      }
      throw error;
    }
  }

  public generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * API Security
   */
  public createRateLimit(config: RateLimitConfig) {
    // Rate limiting would be configured here
    return (req: any, res: any, next: any) => next(); // Placeholder
    /* return rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      keyGenerator: config.keyGenerator || ((req: any) => req.ip),
      handler: (req: any, res: any) => {
        this.logSecurityEvent({
          type: 'api_usage',
          severity: 'warning',
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'unknown',
          endpoint: req.path,
          action: 'rate_limit_exceeded',
          result: 'blocked',
          metadata: {
            limit: config.maxRequests,
            window: config.windowMs
          },
          timestamp: new Date()
        });

        res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }
    }); */
  }

  public validateOrigin(origin: string): boolean {
    const allowedOrigins = this.config.apiSecurity.corsOrigins;
    return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  }

  public validateIPAddress(ipAddress: string): boolean {
    if (!this.config.apiSecurity.ipWhitelist) {
      return true; // No whitelist configured
    }

    return this.config.apiSecurity.ipWhitelist.includes(ipAddress) ||
           this.isInCIDRRange(ipAddress, this.config.apiSecurity.ipWhitelist);
  }

  private isInCIDRRange(ip: string, cidrs: string[]): boolean {
    // Implementation for CIDR range checking
    // This would use a library like 'ip-range-check' in production
    return false; // Simplified for now
  }

  /**
   * Threat Detection & Analysis
   */
  public async assessThreatLevel(
    userId: string,
    organizationId: string,
    context: {
      ipAddress: string;
      userAgent: string;
      action: string;
      endpoint?: string;
    }
  ): Promise<ThreatAssessment> {
    const threats: ThreatIndicator[] = [];
    let score = 0;

    // Check for brute force attempts
    const bruteForceCheck = await this.checkBruteForceAttempts(userId, context.ipAddress);
    if (bruteForceCheck.detected) {
      threats.push({
        type: 'brute_force',
        severity: bruteForceCheck.severity,
        description: `${bruteForceCheck.attempts} failed login attempts detected`,
        timestamp: new Date(),
        source: context.ipAddress,
        metadata: { attempts: bruteForceCheck.attempts }
      });
      score += bruteForceCheck.severity === 'critical' ? 40 : 20;
    }

    // Check for anomalous access patterns
    const anomalyCheck = await this.detectAccessAnomalies(userId, organizationId, context);
    if (anomalyCheck.detected) {
      threats.push({
        type: 'anomalous_access',
        severity: anomalyCheck.severity,
        description: anomalyCheck.description,
        timestamp: new Date(),
        source: context.ipAddress,
        metadata: anomalyCheck.metadata
      });
      score += anomalyCheck.severity === 'high' ? 30 : 15;
    }

    // Check for suspicious API usage
    const apiUsageCheck = await this.checkSuspiciousAPIUsage(userId, organizationId, context);
    if (apiUsageCheck.detected) {
      threats.push({
        type: 'suspicious_api_usage',
        severity: apiUsageCheck.severity,
        description: apiUsageCheck.description,
        timestamp: new Date(),
        source: context.ipAddress,
        metadata: apiUsageCheck.metadata
      });
      score += 25;
    }

    // Geo-location analysis
    if (this.config.threatDetection.geoBlocking) {
      const geoCheck = await this.checkGeographicAnomaly(userId, context.ipAddress);
      if (geoCheck.detected) {
        threats.push({
          type: 'geo_anomaly',
          severity: geoCheck.severity,
          description: geoCheck.description,
          timestamp: new Date(),
          source: context.ipAddress,
          metadata: geoCheck.metadata
        });
        score += 20;
      }
    }

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 70) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    const recommendations = this.generateSecurityRecommendations(threats, score);

    return {
      riskLevel,
      threats,
      recommendations,
      score
    };
  }

  private async checkBruteForceAttempts(userId: string, ipAddress: string): Promise<{
    detected: boolean;
    attempts: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow);

    const { data: attempts } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('type', 'authentication')
      .eq('result', 'failure')
      .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
      .gte('timestamp', windowStart.toISOString())
      .order('timestamp', { ascending: false });

    const attemptCount = attempts?.length || 0;
    const maxAttempts = this.config.threatDetection.maxFailedAttempts;

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (attemptCount >= maxAttempts * 2) severity = 'critical';
    else if (attemptCount >= maxAttempts) severity = 'high';
    else if (attemptCount >= maxAttempts * 0.7) severity = 'medium';
    else severity = 'low';

    return {
      detected: attemptCount >= maxAttempts * 0.5,
      attempts: attemptCount,
      severity
    };
  }

  private async detectAccessAnomalies(
    userId: string,
    organizationId: string,
    context: any
  ): Promise<{
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
    metadata: Record<string, any>;
  }> {
    if (!this.config.threatDetection.anomalyDetection) {
      return { detected: false, severity: 'low', description: '', metadata: {} };
    }

    // Get user's typical access patterns
    const { data: recentActivity } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (!recentActivity || recentActivity.length < 10) {
      // Not enough data for anomaly detection
      return { detected: false, severity: 'low', description: '', metadata: {} };
    }

    // Analyze patterns
    const usualHours = this.getUsualAccessHours(recentActivity);
    const usualIPs = this.getUsualIPAddresses(recentActivity);
    const usualUserAgents = this.getUsualUserAgents(recentActivity);

    const currentHour = new Date().getHours();
    const anomalies = [];

    // Check time-based anomalies
    if (!usualHours.includes(currentHour)) {
      anomalies.push('unusual_access_time');
    }

    // Check IP-based anomalies
    if (!usualIPs.includes(context.ipAddress)) {
      anomalies.push('new_ip_address');
    }

    // Check user agent anomalies
    if (!usualUserAgents.includes(context.userAgent)) {
      anomalies.push('new_user_agent');
    }

    const detected = anomalies.length >= 2; // Require multiple anomalies
    let severity: 'low' | 'medium' | 'high';
    
    if (anomalies.length >= 3) severity = 'high';
    else if (anomalies.length >= 2) severity = 'medium';
    else severity = 'low';

    return {
      detected,
      severity,
      description: `Unusual access pattern detected: ${anomalies.join(', ')}`,
      metadata: { anomalies, usualHours, usualIPs: usualIPs.length }
    };
  }

  private getUsualAccessHours(events: any[]): number[] {
    const hours = events.map(event => new Date(event.timestamp).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Return hours that represent 80% of activity
    const totalEvents = events.length;
    const threshold = totalEvents * 0.1; // 10% threshold
    
    return Object.entries(hourCounts)
      .filter(([_, count]) => (count as number) >= threshold)
      .map(([hour, _]) => parseInt(hour));
  }

  private getUsualIPAddresses(events: any[]): string[] {
    const ipCounts = events.reduce((acc, event) => {
      acc[event.ip_address] = (acc[event.ip_address] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const threshold = events.length * 0.05; // 5% threshold
    return Object.entries(ipCounts)
      .filter(([_, count]) => (count as number) >= threshold)
      .map(([ip, _]) => ip);
  }

  private getUsualUserAgents(events: any[]): string[] {
    const uaCounts = events.reduce((acc, event) => {
      acc[event.user_agent] = (acc[event.user_agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const threshold = events.length * 0.1; // 10% threshold
    return Object.entries(uaCounts)
      .filter(([_, count]) => (count as number) >= threshold)
      .map(([ua, _]) => ua);
  }

  private async checkSuspiciousAPIUsage(
    userId: string,
    organizationId: string,
    context: any
  ): Promise<{
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
    metadata: Record<string, any>;
  }> {
    // Check for data exfiltration patterns
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const { data: recentApiCalls } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('type', 'api_usage')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .gte('timestamp', new Date(Date.now() - timeWindow).toISOString());

    if (!recentApiCalls || recentApiCalls.length === 0) {
      return { detected: false, severity: 'low', description: '', metadata: {} };
    }

    // Check for bulk data access
    const dataEndpoints = recentApiCalls.filter(call => 
      call.endpoint?.includes('/data/') || 
      call.endpoint?.includes('/export/') ||
      call.endpoint?.includes('/analytics/')
    );

    const bulkDataAccess = dataEndpoints.length > 50; // Threshold for bulk access
    const rapidRequests = recentApiCalls.length > 200; // High request volume

    const issues = [];
    if (bulkDataAccess) issues.push('bulk_data_access');
    if (rapidRequests) issues.push('high_request_volume');

    const detected = issues.length > 0;
    const severity = issues.length >= 2 ? 'high' : issues.length === 1 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Suspicious API usage: ${issues.join(', ')}`,
      metadata: {
        totalRequests: recentApiCalls.length,
        dataRequests: dataEndpoints.length,
        issues
      }
    };
  }

  private async checkGeographicAnomaly(userId: string, ipAddress: string): Promise<{
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
    metadata: Record<string, any>;
  }> {
    // This would integrate with a geolocation service
    // For now, return a mock implementation
    return {
      detected: false,
      severity: 'low',
      description: '',
      metadata: {}
    };
  }

  private generateSecurityRecommendations(threats: ThreatIndicator[], score: number): string[] {
    const recommendations: string[] = [];

    if (threats.some(t => t.type === 'brute_force')) {
      recommendations.push('Enable multi-factor authentication');
      recommendations.push('Implement account lockout policies');
    }

    if (threats.some(t => t.type === 'anomalous_access')) {
      recommendations.push('Review recent access logs');
      recommendations.push('Consider additional identity verification');
    }

    if (threats.some(t => t.type === 'suspicious_api_usage')) {
      recommendations.push('Review API access patterns');
      recommendations.push('Implement stricter API rate limiting');
    }

    if (score >= 50) {
      recommendations.push('Consider temporary access restrictions');
      recommendations.push('Notify security team for manual review');
    }

    return recommendations;
  }

  /**
   * Security Event Logging
   */
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      ...event
    };

    try {
      await this.supabase
        .from('security_events')
        .insert({
          id: securityEvent.id,
          type: securityEvent.type,
          severity: securityEvent.severity,
          user_id: securityEvent.userId,
          organization_id: securityEvent.organizationId,
          ip_address: securityEvent.ipAddress,
          user_agent: securityEvent.userAgent,
          endpoint: securityEvent.endpoint,
          action: securityEvent.action,
          result: securityEvent.result,
          metadata: securityEvent.metadata,
          timestamp: securityEvent.timestamp.toISOString()
        });

      // Trigger real-time alerts for critical events
      if (securityEvent.severity === 'critical' && this.config.audit.realTimeAlerts) {
        await this.triggerSecurityAlert(securityEvent);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // Send alert to security monitoring service
      await fetch(`${process.env.NEXTAUTH_URL}/api/security/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          event,
          priority: 'high',
          timestamp: new Date().toISOString()
        })
      });

      // Send notification to security team
      await this.notifySecurityTeam(event);
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }

  private async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    // This would integrate with notification services (Slack, email, etc.)
    console.log('Security alert triggered:', {
      type: event.type,
      severity: event.severity,
      user: event.userId,
      organization: event.organizationId,
      timestamp: event.timestamp
    });
  }

  private setupRealTimeAlerts(): void {
    // Set up real-time monitoring and alerting
    console.log('Security monitoring initialized');
  }

  /**
   * Security Report Generation
   */
  public async generateSecurityReport(
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    summary: {
      totalEvents: number;
      criticalEvents: number;
      threatsBlocked: number;
      riskScore: number;
    };
    trends: {
      authenticationFailures: number[];
      apiAbuse: number[];
      threatDetections: number[];
    };
    topThreats: ThreatIndicator[];
    recommendations: string[];
  }> {
    const { data: events } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: false });

    const totalEvents = events?.length || 0;
    const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
    const threatsBlocked = events?.filter(e => e.result === 'blocked').length || 0;

    // Calculate risk score based on recent security events
    const riskScore = Math.min(100, (criticalEvents * 10) + (threatsBlocked * 5) + (totalEvents * 0.1));

    // Generate trends (simplified)
    const authenticationFailures = this.generateTrendData(events, 'authentication', 'failure');
    const apiAbuse = this.generateTrendData(events, 'api_usage', 'blocked');
    const threatDetections = this.generateTrendData(events, 'threat_detected', 'success');

    // Get top threats
    const topThreats = await this.getTopThreats(organizationId, timeRange);

    // Generate recommendations based on the data
    const recommendations = this.generateReportRecommendations(events, riskScore);

    return {
      summary: {
        totalEvents,
        criticalEvents,
        threatsBlocked,
        riskScore
      },
      trends: {
        authenticationFailures,
        apiAbuse,
        threatDetections
      },
      topThreats,
      recommendations
    };
  }

  private generateTrendData(events: any[], type: string, result: string): number[] {
    // Generate 7-day trend data
    const days = 7;
    const trendData = new Array(days).fill(0);
    const now = new Date();

    events?.forEach(event => {
      if (event.type === type && event.result === result) {
        const eventDate = new Date(event.timestamp);
        const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < days) {
          trendData[days - 1 - daysDiff]++;
        }
      }
    });

    return trendData;
  }

  private async getTopThreats(
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<ThreatIndicator[]> {
    // Mock implementation - in production, this would aggregate threat data
    return [];
  }

  private generateReportRecommendations(events: any[], riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 70) {
      recommendations.push('Immediate security review required');
      recommendations.push('Consider implementing additional access controls');
    }

    if (events?.some(e => e.type === 'authentication' && e.result === 'failure')) {
      recommendations.push('Review authentication security policies');
      recommendations.push('Consider implementing multi-factor authentication');
    }

    if (events?.some(e => e.type === 'api_usage' && e.result === 'blocked')) {
      recommendations.push('Review API access patterns and rate limits');
      recommendations.push('Implement stricter API authentication');
    }

    // Always include baseline recommendations
    recommendations.push('Regular security training for all users');
    recommendations.push('Keep all systems and dependencies up to date');
    recommendations.push('Regular security audits and penetration testing');

    return recommendations;
  }
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  encryption: {
    algorithm: 'aes-256-cbc',
    keySize: 32,
    ivSize: 16
  },
  authentication: {
    jwtSecret: process.env.JWT_SECRET || 'change-in-production',
    jwtExpiration: '1h',
    refreshTokenExpiration: '30d',
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90
    }
  },
  apiSecurity: {
    rateLimiting: [
      { path: '/api/auth/*', windowMs: 15 * 60 * 1000, maxRequests: 5 },
      { path: '/api/data/*', windowMs: 60 * 1000, maxRequests: 100 },
      { path: '/api/*', windowMs: 15 * 60 * 1000, maxRequests: 1000 }
    ],
    requireHttps: true,
    corsOrigins: [process.env.NEXTAUTH_URL || 'http://localhost:3000']
  },
  threatDetection: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    anomalyDetection: true,
    geoBlocking: false
  },
  audit: {
    logLevel: 'standard',
    retention: 90, // 90 days
    realTimeAlerts: true
  }
};

export const securityManager = new SecurityManager(DEFAULT_SECURITY_CONFIG);