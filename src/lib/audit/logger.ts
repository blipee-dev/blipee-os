import { NextRequest } from 'next/server';
import { AuditEventType, AuditEventSeverity } from './types';
import { getAuditService } from './service';

/**
 * Simplified audit logging interface
 */
export class AuditLogger {
  private auditService = getAuditService();

  /**
   * Extract actor information from request
   */
  private getActorFromRequest(request: NextRequest) {
    return {
      type: 'user' as const,
      id: request.headers.get('x-user-id') || undefined,
      email: undefined, // Would need to look up from user service
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') || 
          request.ip || 
          undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };
  }

  /**
   * Extract context from request
   */
  private getContextFromRequest(request: NextRequest) {
    return {
      organizationId: request.headers.get('x-organization-id') || undefined,
      buildingId: request.headers.get('x-building-id') || undefined,
      sessionId: request.cookies.get('blipee-session')?.value || undefined,
      requestId: request.headers.get('x-request-id') || undefined,
      apiKeyId: request.headers.get('x-api-key-id') || undefined,
    };
  }

  /**
   * Log authentication success
   */
  async logAuthSuccess(
    request: NextRequest,
    userId: string,
    email: string,
    method: 'password' | 'mfa' | 'sso' = 'password'
  ) {
    await this.auditService.log({
      type: AuditEventType.AUTH_LOGIN_SUCCESS,
      severity: AuditEventSeverity.INFO,
      actor: {
        ...this.getActorFromRequest(request),
        id: userId,
        email,
      },
      context: this.getContextFromRequest(request),
      metadata: {
        authMethod: method,
      },
      result: 'success',
    });
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure(
    request: NextRequest,
    email: string,
    reason: string,
    errorCode?: string
  ) {
    await this.auditService.log({
      type: AuditEventType.AUTH_LOGIN_FAILED,
      severity: AuditEventSeverity.WARNING,
      actor: {
        ...this.getActorFromRequest(request),
        email,
      },
      context: this.getContextFromRequest(request),
      metadata: {
        attemptedEmail: email,
      },
      result: 'failure',
      errorDetails: {
        code: errorCode || 'AUTH_FAILED',
        message: reason,
      },
    });
  }

  /**
   * Log MFA verification
   */
  async logMFAVerification(
    request: NextRequest,
    userId: string,
    success: boolean,
    method: 'totp' | 'sms' | 'email' = 'totp'
  ) {
    await this.auditService.log({
      type: success ? AuditEventType.AUTH_MFA_VERIFIED : AuditEventType.AUTH_MFA_FAILED,
      severity: success ? AuditEventSeverity.INFO : AuditEventSeverity.WARNING,
      actor: {
        ...this.getActorFromRequest(request),
        id: userId,
      },
      context: this.getContextFromRequest(request),
      metadata: {
        mfaMethod: method,
      },
      result: success ? 'success' : 'failure',
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    request: NextRequest,
    resource: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    success: boolean = true
  ) {
    await this.auditService.log({
      type: AuditEventType.DATA_ACCESSED,
      severity: AuditEventSeverity.INFO,
      actor: this.getActorFromRequest(request),
      target: {
        type: resource,
        id: resourceId,
      },
      context: this.getContextFromRequest(request),
      metadata: {
        action,
      },
      result: success ? 'success' : 'failure',
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    request: NextRequest,
    eventType: 'rate_limit' | 'suspicious_activity' | 'access_denied' | 'threat_detected',
    details: Record<string, any>,
    severity: AuditEventSeverity = AuditEventSeverity.WARNING
  ) {
    const typeMap = {
      rate_limit: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      suspicious_activity: AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
      access_denied: AuditEventType.SECURITY_ACCESS_DENIED,
      threat_detected: AuditEventType.SECURITY_THREAT_DETECTED,
    };

    await this.auditService.log({
      type: typeMap[eventType],
      severity,
      actor: this.getActorFromRequest(request),
      context: this.getContextFromRequest(request),
      metadata: details,
      result: 'failure',
    });
  }

  /**
   * Log user management action
   */
  async logUserAction(
    request: NextRequest,
    action: 'created' | 'updated' | 'deleted' | 'invited' | 'role_changed',
    targetUserId: string,
    changes?: Array<{ field: string; oldValue: any; newValue: any }>
  ) {
    const typeMap = {
      created: AuditEventType.USER_CREATED,
      updated: AuditEventType.USER_UPDATED,
      deleted: AuditEventType.USER_DELETED,
      invited: AuditEventType.USER_INVITED,
      role_changed: AuditEventType.USER_ROLE_CHANGED,
    };

    await this.auditService.log({
      type: typeMap[action],
      severity: AuditEventSeverity.INFO,
      actor: this.getActorFromRequest(request),
      target: {
        type: 'user',
        id: targetUserId,
      },
      context: this.getContextFromRequest(request),
      metadata: {},
      changes,
      result: 'success',
    });
  }

  /**
   * Log organization action
   */
  async logOrgAction(
    request: NextRequest,
    action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed',
    orgId: string,
    orgName?: string,
    metadata?: Record<string, any>
  ) {
    const typeMap = {
      created: AuditEventType.ORG_CREATED,
      updated: AuditEventType.ORG_UPDATED,
      deleted: AuditEventType.ORG_DELETED,
      member_added: AuditEventType.ORG_MEMBER_ADDED,
      member_removed: AuditEventType.ORG_MEMBER_REMOVED,
    };

    await this.auditService.log({
      type: typeMap[action],
      severity: AuditEventSeverity.INFO,
      actor: this.getActorFromRequest(request),
      target: {
        type: 'organization',
        id: orgId,
        name: orgName,
      },
      context: this.getContextFromRequest(request),
      metadata: metadata || {},
      result: 'success',
    });
  }

  /**
   * Log API request
   */
  async logAPIRequest(
    request: NextRequest,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    error?: Error
  ) {
    const severity = statusCode >= 500 
      ? AuditEventSeverity.ERROR 
      : statusCode >= 400 
      ? AuditEventSeverity.WARNING 
      : AuditEventSeverity.INFO;

    await this.auditService.log({
      type: statusCode >= 400 ? AuditEventType.API_REQUEST_FAILED : AuditEventType.DATA_ACCESSED,
      severity,
      actor: this.getActorFromRequest(request),
      context: this.getContextFromRequest(request),
      metadata: {
        endpoint,
        method,
        statusCode,
        responseTime,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
      },
      result: statusCode < 400 ? 'success' : 'failure',
      errorDetails: error ? {
        code: error.name,
        message: error.message,
        stackTrace: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : undefined,
    });
  }

  /**
   * Log system error
   */
  async logSystemError(
    error: Error,
    context: Record<string, any>,
    severity: AuditEventSeverity = AuditEventSeverity.ERROR
  ) {
    await this.auditService.log({
      type: AuditEventType.SYSTEM_ERROR,
      severity,
      actor: {
        type: 'system',
      },
      context: {
        ...context,
      },
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        ...context,
      },
      result: 'failure',
      errorDetails: {
        code: error.name,
        message: error.message,
        stackTrace: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();