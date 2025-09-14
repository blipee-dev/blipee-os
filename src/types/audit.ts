// =====================================================
// AUDIT EVENT TYPES
// Following best practices from Salesforce, AWS CloudTrail
// =====================================================

export type ActorType = 'user' | 'system' | 'agent' | 'api' | 'anonymous';
export type ActionCategory = 'auth' | 'data' | 'permission' | 'system' | 'security' | 'api' | 'agent';
export type OutcomeStatus = 'success' | 'failure' | 'partial' | 'pending';
export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditActor {
  id: string | null;
  type: ActorType;
  email?: string;
  name?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface AuditAction {
  type: string; // 'create', 'update', 'delete', 'login', etc.
  category: ActionCategory;
  description?: string;
  timestamp: string;
}

export interface AuditResource {
  type: string; // 'organization', 'user', 'site', etc.
  id: string;
  name?: string;
  path?: string;
  metadata?: Record<string, any>;
}

export interface AuditContext {
  organization_id?: string;
  site_id?: string;
  ip?: string;
  user_agent?: string;
  session_id?: string;
  correlation_id?: string;
  request_id?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export interface AuditOutcome {
  status: OutcomeStatus;
  error?: string;
  message?: string;
  duration_ms?: number;
}

export interface AuditChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  diff?: Record<string, { old: any; new: any }>;
}

export interface AuditMetadata {
  severity?: Severity;
  tags?: string[];
  description?: string;
  compliance?: string[];
  [key: string]: any;
}

export interface AuditEvent {
  id: string;
  created_at: string;
  actor: AuditActor;
  action: AuditAction;
  resource: AuditResource;
  context: AuditContext;
  outcome: AuditOutcome;
  changes?: AuditChanges;
  metadata?: AuditMetadata;
}

// Database table structure
export interface AuditEventRecord {
  id: string;
  created_at: string;
  event: AuditEvent;

  // Computed fields for fast querying
  actor_id?: string;
  actor_type?: ActorType;
  actor_email?: string;
  action_type?: string;
  action_category?: ActionCategory;
  resource_type?: string;
  resource_id?: string;
  organization_id?: string;
  outcome_status?: OutcomeStatus;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  session_id?: string;
  severity?: Severity;
}

// Common action types
export const AuditActionTypes = {
  // Authentication
  AUTH: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    LOGIN_FAILED: 'login_failed',
    PASSWORD_RESET: 'password_reset',
    PASSWORD_CHANGED: 'password_changed',
    MFA_ENABLED: 'mfa_enabled',
    MFA_DISABLED: 'mfa_disabled',
    MFA_VERIFIED: 'mfa_verified',
    SSO_LOGIN: 'sso_login',
  },

  // Data operations
  DATA: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
    IMPORT: 'import',
    BULK_UPDATE: 'bulk_update',
    BULK_DELETE: 'bulk_delete',
  },

  // Permission operations
  PERMISSION: {
    GRANT: 'permission_grant',
    REVOKE: 'permission_revoke',
    ROLE_ASSIGNED: 'role_assigned',
    ROLE_REMOVED: 'role_removed',
    INVITE_SENT: 'invite_sent',
    INVITE_ACCEPTED: 'invite_accepted',
    INVITE_REJECTED: 'invite_rejected',
  },

  // System operations
  SYSTEM: {
    CONFIG_CHANGED: 'config_changed',
    MAINTENANCE_START: 'maintenance_start',
    MAINTENANCE_END: 'maintenance_end',
    BACKUP_CREATED: 'backup_created',
    BACKUP_RESTORED: 'backup_restored',
  },

  // Security events
  SECURITY: {
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    ACCESS_DENIED: 'access_denied',
    TOKEN_EXPIRED: 'token_expired',
    IP_BLOCKED: 'ip_blocked',
  },

  // API operations
  API: {
    KEY_CREATED: 'api_key_created',
    KEY_REVOKED: 'api_key_revoked',
    WEBHOOK_CREATED: 'webhook_created',
    WEBHOOK_FAILED: 'webhook_failed',
  },

  // Agent operations
  AGENT: {
    TASK_STARTED: 'agent_task_started',
    TASK_COMPLETED: 'agent_task_completed',
    TASK_FAILED: 'agent_task_failed',
    DECISION_MADE: 'agent_decision_made',
    LEARNING_UPDATED: 'agent_learning_updated',
  },
} as const;

// Resource types
export const ResourceTypes = {
  ORGANIZATION: 'organization',
  USER: 'user',
  SITE: 'site',
  DEVICE: 'device',
  ROLE: 'role',
  PERMISSION: 'permission',
  API_KEY: 'api_key',
  WEBHOOK: 'webhook',
  AGENT: 'agent',
  REPORT: 'report',
  DOCUMENT: 'document',
  CONFIGURATION: 'configuration',
} as const;

// Filter interface for querying
export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  actorId?: string;
  actorType?: ActorType;
  actionType?: string;
  actionCategory?: ActionCategory;
  resourceType?: string;
  resourceId?: string;
  organizationId?: string;
  severity?: Severity;
  outcomeStatus?: OutcomeStatus;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

// Statistics interface
export interface AuditLogStats {
  totalEvents: number;
  eventsByCategory: Record<ActionCategory, number>;
  eventsBySeverity: Record<Severity, number>;
  eventsByOutcome: Record<OutcomeStatus, number>;
  topActors: Array<{ actor: AuditActor; count: number }>;
  topResources: Array<{ resource: AuditResource; count: number }>;
  recentFailures: AuditEventRecord[];
  suspiciousActivities: AuditEventRecord[];
}