export enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILED = 'auth.login.failed',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_MFA_ENABLED = 'auth.mfa.enabled',
  AUTH_MFA_DISABLED = 'auth.mfa.disabled',
  AUTH_MFA_VERIFIED = 'auth.mfa.verified',
  AUTH_MFA_FAILED = 'auth.mfa.failed',
  
  // WebAuthn Events
  MFA_WEBAUTHN_REGISTRATION_STARTED = 'mfa.webauthn.registration.started',
  MFA_WEBAUTHN_REGISTERED = 'mfa.webauthn.registered',
  MFA_WEBAUTHN_REGISTRATION_FAILED = 'mfa.webauthn.registration.failed',
  MFA_WEBAUTHN_AUTHENTICATION_STARTED = 'mfa.webauthn.authentication.started',
  MFA_WEBAUTHN_VERIFIED = 'mfa.webauthn.verified',
  MFA_WEBAUTHN_VERIFICATION_FAILED = 'mfa.webauthn.verification.failed',
  MFA_WEBAUTHN_CREDENTIAL_DELETED = 'mfa.webauthn.credential.deleted',
  MFA_WEBAUTHN_CREDENTIAL_DISABLED = 'mfa.webauthn.credential.disabled',
  MFA_WEBAUTHN_COUNTER_ANOMALY = 'mfa.webauthn.counter.anomaly',
  AUTH_PASSWORD_CHANGED = 'auth.password.changed',
  AUTH_PASSWORD_RESET = 'auth.password.reset',
  AUTH_SESSION_CREATED = 'auth.session.created',
  AUTH_SESSION_TERMINATED = 'auth.session.terminated',
  
  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_INVITED = 'user.invited',
  USER_INVITATION_ACCEPTED = 'user.invitation.accepted',
  USER_ROLE_CHANGED = 'user.role.changed',
  USER_PERMISSIONS_CHANGED = 'user.permissions.changed',
  
  // Organization Management
  ORG_CREATED = 'org.created',
  ORG_UPDATED = 'org.updated',
  ORG_DELETED = 'org.deleted',
  ORG_MEMBER_ADDED = 'org.member.added',
  ORG_MEMBER_REMOVED = 'org.member.removed',
  ORG_SETTINGS_CHANGED = 'org.settings.changed',
  
  // Building Management
  BUILDING_CREATED = 'building.created',
  BUILDING_UPDATED = 'building.updated',
  BUILDING_DELETED = 'building.deleted',
  BUILDING_ACCESS_GRANTED = 'building.access.granted',
  BUILDING_ACCESS_REVOKED = 'building.access.revoked',
  
  // Data Operations
  DATA_EXPORTED = 'data.exported',
  DATA_IMPORTED = 'data.imported',
  DATA_DELETED = 'data.deleted',
  DATA_ACCESSED = 'data.accessed',
  DATA_MODIFIED = 'data.modified',
  
  // Security Events
  SECURITY_THREAT_DETECTED = 'security.threat.detected',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  SECURITY_ACCESS_DENIED = 'security.access.denied',
  SECURITY_POLICY_VIOLATION = 'security.policy.violation',
  
  // API Events
  API_KEY_CREATED = 'api.key.created',
  API_KEY_REVOKED = 'api.key.revoked',
  API_REQUEST_FAILED = 'api.request.failed',
  API_QUOTA_EXCEEDED = 'api.quota.exceeded',
  
  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_CONFIG_CHANGED = 'system.config.changed',
  SYSTEM_BACKUP_CREATED = 'system.backup.created',
  SYSTEM_BACKUP_RESTORED = 'system.backup.restored',
  
  // Compliance Events
  POLICY_CREATED = 'policy.created',
  POLICY_UPDATED = 'policy.updated',
  REPORT_GENERATED = 'report.generated',
  DATA_ACCESS = 'data.access',
}

export enum AuditEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditEventSeverity;
  actor: {
    type: 'user' | 'system' | 'api';
    id?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  context: {
    organizationId?: string;
    buildingId?: string;
    sessionId?: string;
    requestId?: string;
    apiKeyId?: string;
  };
  metadata: Record<string, any>;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  result: 'success' | 'failure';
  errorDetails?: {
    code: string;
    message: string;
    stackTrace?: string;
  };
}

export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  types?: AuditEventType[];
  severities?: AuditEventSeverity[];
  actorId?: string;
  actorType?: 'user' | 'system' | 'api';
  targetId?: string;
  targetType?: string;
  organizationId?: string;
  buildingId?: string;
  result?: 'success' | 'failure';
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<AuditEventSeverity, number>;
  eventsByResult: {
    success: number;
    failure: number;
  };
  topActors: Array<{
    actorId: string;
    actorEmail?: string;
    eventCount: number;
  }>;
  recentSecurityEvents: AuditEvent[];
}