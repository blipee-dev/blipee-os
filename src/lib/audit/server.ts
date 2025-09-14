/**
 * Server-side audit logging
 * Direct database access for audit events
 */

import { createClient } from '@/lib/supabase/server';
import { ActionType, ActionCategory, ResourceType, OutcomeStatus } from '@/types/audit';
import { headers } from 'next/headers';

export interface ServerAuditEventDetails {
  resourceName?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  error?: string;
}

class ServerAuditLogger {
  private async getRequestContext() {
    const headersList = headers();
    return {
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
      userAgent: headersList.get('user-agent') || undefined,
    };
  }

  async logEvent(
    action: ActionType,
    category: ActionCategory,
    resource: ResourceType,
    resourceId: string,
    outcome: OutcomeStatus,
    details?: ServerAuditEventDetails
  ) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const context = await this.getRequestContext();

      const event = {
        actor: {
          id: user?.id || null,
          type: user ? 'user' : 'anonymous',
          email: user?.email,
        },
        action: {
          type: action,
          category,
          timestamp: new Date().toISOString(),
        },
        resource: {
          type: resource,
          id: resourceId,
          name: details?.resourceName,
        },
        context: {
          ip: context.ipAddress,
          user_agent: context.userAgent,
          session_id: user?.id ? `session-${user.id}` : undefined,
        },
        outcome: {
          status: outcome,
          error: details?.error,
        },
        changes: details?.changes,
        metadata: details?.metadata,
      };

      await supabase.from('audit_events').insert({ event });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // CRUD Operations
  async logCreate(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string,
    metadata?: Record<string, any>
  ) {
    return this.logEvent('create', 'data_management', resource, resourceId, 'success', {
      resourceName,
      metadata,
    });
  }

  async logUpdate(
    resource: ResourceType,
    resourceId: string,
    changes: Record<string, any>,
    resourceName?: string
  ) {
    return this.logEvent('update', 'data_management', resource, resourceId, 'success', {
      resourceName,
      changes,
    });
  }

  async logDelete(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string
  ) {
    return this.logEvent('delete', 'data_management', resource, resourceId, 'success', {
      resourceName,
    });
  }

  async logView(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string
  ) {
    return this.logEvent('view', 'access', resource, resourceId, 'success', {
      resourceName,
    });
  }

  async logExport(
    resource: ResourceType,
    format: string,
    count?: number
  ) {
    return this.logEvent('export', 'data_management', resource, 'export', 'success', {
      metadata: { format, count },
    });
  }

  // Authentication Events
  async logAuth(
    action: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'mfa_verified',
    outcome: OutcomeStatus,
    details?: {
      email?: string;
      userId?: string;
      error?: string;
      metadata?: Record<string, any>;
    }
  ) {
    return this.logEvent(
      action,
      'auth',
      'authentication',
      details?.userId || 'unknown',
      outcome,
      {
        resourceName: action === 'login' || action === 'logout' ? 'User Session' : 'Authentication Attempt',
        error: details?.error,
        metadata: {
          email: details?.email,
          ...details?.metadata,
        },
      }
    );
  }
}

// Export singleton instance
export const serverAuditLogger = new ServerAuditLogger();

// Export alias for compatibility
export const auditLogger = serverAuditLogger;