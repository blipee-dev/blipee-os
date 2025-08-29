import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  MFA_VERIFIED = 'MFA_VERIFIED',
  MFA_FAILED = 'MFA_FAILED',
  
  // Session events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_ROTATED = 'SESSION_ROTATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  CONCURRENT_SESSION_LIMIT = 'CONCURRENT_SESSION_LIMIT',
  
  // Security violations
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Access control
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  
  // Data access
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  
  // API security
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // High-risk behaviors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  IP_CHANGE_DETECTED = 'IP_CHANGE_DETECTED',
  DEVICE_CHANGE_DETECTED = 'DEVICE_CHANGE_DETECTED',
  
  // AI and system operations
  AI_STREAM_STARTED = 'AI_STREAM_STARTED',
  DATABASE_REPAIR = 'DATABASE_REPAIR',
  DATABASE_HEALTH_CHECK = 'DATABASE_HEALTH_CHECK',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  AI_TEST_RUN = 'AI_TEST_RUN',
  CONVERSATION_ACCESSED = 'CONVERSATION_ACCESSED',
  DATABASE_ADMIN_ACTION = 'DATABASE_ADMIN_ACTION',
}

/**
 * Security event severity levels
 */
export enum SecuritySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Security audit log entry
 */
export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
  metadata?: {
    organizationId?: string;
    buildingId?: string;
    apiKeyId?: string;
    requestId?: string;
  };
}

/**
 * Security audit logger service
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private supabase: any;
  private buffer: SecurityAuditLog[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Skip initialization during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }
    
    // Initialize Supabase client for audit logs
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
          },
        }
      );
    }
    
    // Start buffer flush interval
    this.flushInterval = setInterval(() => {
      this.flushBuffer().catch(console.error);
    }, 5000); // Flush every 5 seconds
  }
  
  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }
  
  /**
   * Log a security event
   */
  async log(params: {
    eventType: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    result: 'success' | 'failure';
    details?: Record<string, any>;
    metadata?: SecurityAuditLog['metadata'];
  }): Promise<void> {
    // Skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }
    
    const logEntry: SecurityAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: params.eventType,
      severity: params.severity || this.getSeverityForEvent(params.eventType),
      ...params,
    };
    
    // Add to buffer
    this.buffer.push(logEntry);
    
    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY_AUDIT] ${logEntry.severity.toUpperCase()}:`, {
        event: logEntry.eventType,
        user: logEntry.userId,
        ip: logEntry.ipAddress,
        result: logEntry.result,
        details: logEntry.details,
      });
    }
    
    // Flush immediately for critical events
    if (logEntry.severity === SecuritySeverity.CRITICAL) {
      await this.flushBuffer();
    }
  }
  
  /**
   * Get default severity for event type
   */
  private getSeverityForEvent(eventType: SecurityEventType): SecuritySeverity {
    const criticalEvents = [
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.DATA_DELETION,
    ];
    
    const errorEvents = [
      SecurityEventType.CSRF_VIOLATION,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.PERMISSION_DENIED,
      SecurityEventType.INVALID_API_KEY,
    ];
    
    const warningEvents = [
      SecurityEventType.LOGIN_FAILED,
      SecurityEventType.MFA_FAILED,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.CONCURRENT_SESSION_LIMIT,
      SecurityEventType.IP_CHANGE_DETECTED,
      SecurityEventType.DEVICE_CHANGE_DETECTED,
    ];
    
    if (criticalEvents.includes(eventType)) {
      return SecuritySeverity.CRITICAL;
    } else if (errorEvents.includes(eventType)) {
      return SecuritySeverity.ERROR;
    } else if (warningEvents.includes(eventType)) {
      return SecuritySeverity.WARNING;
    }
    
    return SecuritySeverity.INFO;
  }
  
  /**
   * Flush buffered logs to storage
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }
    
    const logsToFlush = [...this.buffer];
    this.buffer = [];
    
    try {
      if (this.supabase) {
        // Insert logs into security_audit_logs table
        const { error } = await this.supabase
          .from('security_audit_logs')
          .insert(logsToFlush);
        
        if (error) {
          console.error('[SECURITY_AUDIT] Failed to flush logs:', error);
          // Re-add failed logs to buffer
          this.buffer.unshift(...logsToFlush);
        }
      } else {
        // Fallback: Write to file in production
        if (process.env.NODE_ENV === 'production') {
          const fs = await import('fs').then(m => m.promises);
          const logFile = `security-audit-${new Date().toISOString().split('T')[0]}.log`;
          await fs.appendFile(
            logFile,
            logsToFlush.map(log => JSON.stringify(log)).join('\n') + '\n'
          );
        }
      }
    } catch (error) {
      console.error('[SECURITY_AUDIT] Flush error:', error);
      // Re-add failed logs to buffer
      this.buffer.unshift(...logsToFlush);
    }
  }
  
  /**
   * Query audit logs
   */
  async query(params: {
    eventTypes?: SecurityEventType[];
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    severity?: SecuritySeverity[];
    limit?: number;
  }): Promise<SecurityAuditLog[]> {
    if (!this.supabase) {
      return [];
    }
    
    let query = this.supabase
      .from('security_audit_logs')
      .select('*');
    
    if (params.eventTypes?.length) {
      query = query.in('eventType', params.eventTypes);
    }
    
    if (params.userId) {
      query = query.eq('userId', params.userId);
    }
    
    if (params.startTime) {
      query = query.gte('timestamp', params.startTime.toISOString());
    }
    
    if (params.endTime) {
      query = query.lte('timestamp', params.endTime.toISOString());
    }
    
    if (params.severity?.length) {
      query = query.in('severity', params.severity);
    }
    
    query = query
      .order('timestamp', { ascending: false })
      .limit(params.limit || 100);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[SECURITY_AUDIT] Query error:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Generate security report
   */
  async generateReport(params: {
    startTime: Date;
    endTime: Date;
    groupBy?: 'eventType' | 'userId' | 'severity';
  }): Promise<Record<string, any>> {
    const logs = await this.query({
      startTime: params.startTime,
      endTime: params.endTime,
    });
    
    const report: Record<string, any> = {
      period: {
        start: params.startTime.toISOString(),
        end: params.endTime.toISOString(),
      },
      totalEvents: logs.length,
      summary: {},
    };
    
    // Group by severity
    const bySeverity = logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report.summary.bySeverity = bySeverity;
    
    // Group by event type
    const byEventType = logs.reduce((acc, log) => {
      acc[log.eventType] = (acc[log.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report.summary.byEventType = byEventType;
    
    // Failed vs successful
    const outcomes = logs.reduce((acc, log) => {
      acc[log.result] = (acc[log.result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report.summary.outcomes = outcomes;
    
    // Top users by events
    const userEvents = logs.reduce((acc, log) => {
      if (log.userId) {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    report.summary.topUsers = Object.entries(userEvents)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
    
    return report;
  }
  
  /**
   * Cleanup old logs
   */
  async cleanup(retentionDays: number = 90): Promise<void> {
    if (!this.supabase) {
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const { error } = await this.supabase
      .from('security_audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());
    
    if (error) {
      console.error('[SECURITY_AUDIT] Cleanup error:', error);
    }
  }
  
  /**
   * Shutdown logger
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flushBuffer();
  }
}

// Export singleton instance
export const securityAuditLogger = SecurityAuditLogger.getInstance();