// Webhook Event Types
export enum WebhookEventType {
  // Building Events
  BUILDING_CREATED = 'building.created',
  BUILDING_UPDATED = 'building.updated',
  BUILDING_DELETED = 'building.deleted',
  
  // Emission Events
  EMISSION_RECORDED = 'emission.recorded',
  EMISSION_UPDATED = 'emission.updated',
  EMISSION_DELETED = 'emission.deleted',
  
  // Alert Events
  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_RESOLVED = 'alert.resolved',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  
  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Organization Events
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_MEMBER_ADDED = 'organization.member.added',
  ORGANIZATION_MEMBER_REMOVED = 'organization.member.removed',
  
  // System Events
  SYSTEM_HEALTH_CHECK = 'system.health_check',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  
  // Sustainability Events
  SUSTAINABILITY_REPORT_GENERATED = 'sustainability.report.generated',
  SUSTAINABILITY_TARGET_UPDATED = 'sustainability.target.updated',
  SUSTAINABILITY_MILESTONE_REACHED = 'sustainability.milestone.reached',
  
  // API Events
  API_KEY_CREATED = 'api.key.created',
  API_KEY_REVOKED = 'api.key.revoked',
  API_QUOTA_EXCEEDED = 'api.quota.exceeded',
  
  // Compliance Events
  COMPLIANCE_REPORT_GENERATED = 'compliance.report.generated',
  COMPLIANCE_VIOLATION_DETECTED = 'compliance.violation.detected',
  
  // Authentication Events
  SSO_CONFIGURATION_UPDATED = 'sso.configuration.updated',
  MFA_ENABLED = 'mfa.enabled',
  MFA_DISABLED = 'mfa.disabled',
}

// Webhook Endpoint Configuration
export interface WebhookEndpoint {
  id: string;
  organization_id: string;
  url: string;
  description?: string;
  events: WebhookEventType[];
  api_version: string;
  enabled: boolean;
  status: 'active' | 'failing' | 'disabled';
  secret_key: string;
  headers?: Record<string, string>;
  failure_count: number;
  last_delivery_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  created_at: string;
  updated_at: string;
}

// Webhook Delivery Record
export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: WebhookEventType;
  event_id: string;
  payload: WebhookPayload;
  attempt_number: number;
  status: 'pending' | 'success' | 'failed';
  response_status_code?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  response_time_ms?: number;
  error_message?: string;
  scheduled_at: string;
  delivered_at?: string;
  next_retry_at?: string;
  created_at: string;
}

// Base Webhook Payload
export interface BaseWebhookPayload {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  api_version: string;
  organization_id: string;
  actor?: {
    type: 'user' | 'system' | 'api_key';
    id: string;
    name?: string;
  };
}

// Specific Event Payloads
export interface BuildingEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.BUILDING_CREATED | WebhookEventType.BUILDING_UPDATED | WebhookEventType.BUILDING_DELETED;
  data: {
    building: {
      id: string;
      name: string;
      address: string;
      type: string;
      size_sqft: number;
      organization_id: string;
      created_at: string;
      updated_at: string;
    };
    previous_data?: Partial<BuildingEventPayload['data']['building']>;
  };
}

export interface EmissionEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.EMISSION_RECORDED | WebhookEventType.EMISSION_UPDATED | WebhookEventType.EMISSION_DELETED;
  data: {
    emission: {
      id: string;
      building_id: string;
      scope: 1 | 2 | 3;
      category: string;
      value: number;
      unit: string;
      date: string;
      created_at: string;
      updated_at: string;
    };
    previous_data?: Partial<EmissionEventPayload['data']['emission']>;
  };
}

export interface AlertEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.ALERT_TRIGGERED | WebhookEventType.ALERT_RESOLVED | WebhookEventType.ALERT_ACKNOWLEDGED;
  data: {
    alert: {
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      building_id?: string;
      triggered_at: string;
      resolved_at?: string;
      acknowledged_at?: string;
      acknowledged_by?: string;
    };
  };
}

export interface UserEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.USER_CREATED | WebhookEventType.USER_UPDATED | WebhookEventType.USER_DELETED;
  data: {
    user: {
      id: string;
      email: string;
      full_name?: string;
      role: string;
      created_at: string;
      updated_at: string;
    };
    previous_data?: Partial<UserEventPayload['data']['user']>;
  };
}

export interface OrganizationEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.ORGANIZATION_UPDATED | WebhookEventType.ORGANIZATION_MEMBER_ADDED | WebhookEventType.ORGANIZATION_MEMBER_REMOVED;
  data: {
    organization: {
      id: string;
      name: string;
      industry?: string;
      size?: string;
      updated_at: string;
    };
    member?: {
      id: string;
      email: string;
      role: string;
      joined_at: string;
    };
    previous_data?: any;
  };
}

export interface SystemEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.SYSTEM_HEALTH_CHECK | WebhookEventType.SYSTEM_MAINTENANCE;
  data: {
    system: {
      status: 'healthy' | 'degraded' | 'down' | 'maintenance';
      message: string;
      components?: Array<{
        name: string;
        status: 'healthy' | 'degraded' | 'down';
        response_time_ms?: number;
      }>;
      scheduled_maintenance?: {
        start_time: string;
        end_time: string;
        description: string;
      };
    };
  };
}

export interface SustainabilityEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.SUSTAINABILITY_REPORT_GENERATED | WebhookEventType.SUSTAINABILITY_TARGET_UPDATED | WebhookEventType.SUSTAINABILITY_MILESTONE_REACHED;
  data: {
    sustainability: {
      id: string;
      type: 'report' | 'target' | 'milestone';
      title: string;
      description: string;
      metrics?: Record<string, number>;
      target_value?: number;
      current_value?: number;
      deadline?: string;
      achieved_at?: string;
      report_url?: string;
    };
  };
}

export interface APIEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.API_KEY_CREATED | WebhookEventType.API_KEY_REVOKED | WebhookEventType.API_QUOTA_EXCEEDED;
  data: {
    api_key: {
      id: string;
      name: string;
      version: string;
      scopes: string[];
      created_at: string;
      revoked_at?: string;
      revoked_by?: string;
      revocation_reason?: string;
    };
    quota?: {
      limit: number;
      current: number;
      period: string;
      exceeded_at: string;
    };
  };
}

export interface ComplianceEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.COMPLIANCE_REPORT_GENERATED | WebhookEventType.COMPLIANCE_VIOLATION_DETECTED;
  data: {
    compliance: {
      id: string;
      type: 'gdpr' | 'soc2' | 'iso27001' | 'other';
      title: string;
      description: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      violation_details?: {
        policy: string;
        affected_data: string;
        remediation_required: boolean;
        deadline?: string;
      };
      report_url?: string;
      generated_at: string;
    };
  };
}

export interface AuthEventPayload extends BaseWebhookPayload {
  type: WebhookEventType.SSO_CONFIGURATION_UPDATED | WebhookEventType.MFA_ENABLED | WebhookEventType.MFA_DISABLED;
  data: {
    auth: {
      id: string;
      type: 'sso' | 'mfa';
      configuration?: {
        provider: string;
        enabled: boolean;
        settings: Record<string, any>;
      };
      mfa?: {
        user_id: string;
        method: 'totp' | 'sms' | 'email';
        enabled: boolean;
        enabled_at?: string;
        disabled_at?: string;
      };
    };
  };
}

// Union type for all webhook payloads
export type WebhookPayload = 
  | BuildingEventPayload
  | EmissionEventPayload
  | AlertEventPayload
  | UserEventPayload
  | OrganizationEventPayload
  | SystemEventPayload
  | SustainabilityEventPayload
  | APIEventPayload
  | ComplianceEventPayload
  | AuthEventPayload;

// Webhook Configuration for UI
export interface WebhookEndpointCreate {
  url: string;
  description?: string;
  events: WebhookEventType[];
  api_version: string;
  enabled: boolean;
  headers?: Record<string, string>;
}

export interface WebhookEndpointUpdate {
  url?: string;
  description?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
  headers?: Record<string, string>;
}

// Webhook Statistics
export interface WebhookStats {
  total_endpoints: number;
  active_endpoints: number;
  failing_endpoints: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  average_response_time: number;
  delivery_success_rate: number;
  recent_deliveries: Array<{
    endpoint_id: string;
    event_type: WebhookEventType;
    status: 'success' | 'failed';
    delivered_at: string;
    response_time_ms: number;
  }>;
}

// Webhook Event Categories for UI grouping
export const WEBHOOK_EVENT_CATEGORIES = {
  'Building & Infrastructure': [
    WebhookEventType.BUILDING_CREATED,
    WebhookEventType.BUILDING_UPDATED,
    WebhookEventType.BUILDING_DELETED,
  ],
  'Emissions & Sustainability': [
    WebhookEventType.EMISSION_RECORDED,
    WebhookEventType.EMISSION_UPDATED,
    WebhookEventType.EMISSION_DELETED,
    WebhookEventType.SUSTAINABILITY_REPORT_GENERATED,
    WebhookEventType.SUSTAINABILITY_TARGET_UPDATED,
    WebhookEventType.SUSTAINABILITY_MILESTONE_REACHED,
  ],
  'Alerts & Monitoring': [
    WebhookEventType.ALERT_TRIGGERED,
    WebhookEventType.ALERT_RESOLVED,
    WebhookEventType.ALERT_ACKNOWLEDGED,
    WebhookEventType.SYSTEM_HEALTH_CHECK,
    WebhookEventType.SYSTEM_MAINTENANCE,
  ],
  'Users & Access': [
    WebhookEventType.USER_CREATED,
    WebhookEventType.USER_UPDATED,
    WebhookEventType.USER_DELETED,
    WebhookEventType.ORGANIZATION_UPDATED,
    WebhookEventType.ORGANIZATION_MEMBER_ADDED,
    WebhookEventType.ORGANIZATION_MEMBER_REMOVED,
  ],
  'API & Security': [
    WebhookEventType.API_KEY_CREATED,
    WebhookEventType.API_KEY_REVOKED,
    WebhookEventType.API_QUOTA_EXCEEDED,
    WebhookEventType.SSO_CONFIGURATION_UPDATED,
    WebhookEventType.MFA_ENABLED,
    WebhookEventType.MFA_DISABLED,
  ],
  'Compliance & Governance': [
    WebhookEventType.COMPLIANCE_REPORT_GENERATED,
    WebhookEventType.COMPLIANCE_VIOLATION_DETECTED,
  ],
} as const;

// Webhook retry configuration
export interface WebhookRetryConfig {
  max_attempts: number;
  initial_delay_ms: number;
  backoff_multiplier: number;
  max_delay_ms: number;
  timeout_ms: number;
}

export const DEFAULT_WEBHOOK_RETRY_CONFIG: WebhookRetryConfig = {
  max_attempts: 5,
  initial_delay_ms: 1000,
  backoff_multiplier: 2,
  max_delay_ms: 300000, // 5 minutes
  timeout_ms: 30000, // 30 seconds
};