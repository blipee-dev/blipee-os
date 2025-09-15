/**
 * Client-side audit logging
 * Browser-safe implementation for audit events
 */

import { ActionType, ActionCategory, ResourceType, OutcomeStatus } from '@/types/audit';

export interface AuditEventDetails {
  resourceId?: string;
  resourceName?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  error?: string;
  userId?: string;
  email?: string;
}

class ClientAuditLogger {
  private async sendAuditEvent(
    action: ActionType,
    category: ActionCategory,
    resource: ResourceType,
    outcome: OutcomeStatus,
    details?: AuditEventDetails
  ) {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: {
            actor: {
              id: details?.userId || null,
              type: details?.userId ? 'user' : 'anonymous',
              email: details?.email,
            },
            action: {
              type: action,
              category,
              timestamp: new Date().toISOString(),
            },
            resource: {
              type: resource,
              id: details?.resourceId || 'unknown',
              name: details?.resourceName,
            },
            outcome: {
              status: outcome,
              error: details?.error,
            },
            changes: details?.changes,
            metadata: details?.metadata,
          },
        }),
      });

      if (!response.ok) {
        console.error('Failed to log audit event:', await response.text());
      }
    } catch (error) {
      console.error('Error sending audit event:', error);
    }
  }

  // CRUD Operations
  async logCreate(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string,
    metadata?: Record<string, any>
  ) {
    return this.sendAuditEvent('create', 'data_management', resource, 'success', {
      resourceId,
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
    return this.sendAuditEvent('update', 'data_management', resource, 'success', {
      resourceId,
      resourceName,
      changes,
    });
  }

  async logDelete(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string
  ) {
    return this.sendAuditEvent('delete', 'data_management', resource, 'success', {
      resourceId,
      resourceName,
    });
  }

  async logView(
    resource: ResourceType,
    resourceId: string,
    resourceName?: string
  ) {
    return this.sendAuditEvent('view', 'access', resource, 'success', {
      resourceId,
      resourceName,
    });
  }

  async logExport(
    resource: ResourceType,
    format: string,
    count?: number
  ) {
    return this.sendAuditEvent('export', 'data_management', resource, 'success', {
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
    return this.sendAuditEvent(
      action,
      'auth',
      'authentication',
      outcome,
      {
        resourceId: details?.userId || 'unknown',
        resourceName: action === 'login' || action === 'logout' ? 'User Session' : 'Authentication Attempt',
        email: details?.email,
        error: details?.error,
        metadata: details?.metadata,
      }
    );
  }

  // Data Operations (for backwards compatibility)
  async logDataOperation(
    action: 'create' | 'update' | 'delete' | 'view',
    resource: ResourceType,
    resourceId: string,
    resourceName?: string,
    outcome: OutcomeStatus = 'success',
    changes?: Record<string, any>
  ) {
    const category: ActionCategory = action === 'view' ? 'access' : 'data_management';
    
    return this.sendAuditEvent(action, category, resource, outcome, {
      resourceId,
      resourceName,
      changes,
    });
  }

  // Custom Events
  async logEvent(
    action: ActionType,
    category: ActionCategory,
    resource: ResourceType,
    resourceId: string,
    outcome: OutcomeStatus,
    details?: Omit<AuditEventDetails, 'resourceId'>
  ) {
    return this.sendAuditEvent(action, category, resource, outcome, {
      ...details,
      resourceId,
    });
  }
}

// Export singleton instance
export const auditLogger = new ClientAuditLogger();