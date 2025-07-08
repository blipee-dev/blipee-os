// API Gateway Types

export enum APIKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum APIVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export interface APIKey {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  key_prefix: string;
  last_four: string;
  version: APIVersion;
  allowed_origins?: string[];
  allowed_ips?: string[];
  scopes?: string[];
  rate_limit_override?: number;
  status: APIKeyStatus;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  created_by: string;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
}

export interface APIKeyCreate {
  name: string;
  description?: string;
  version?: APIVersion;
  allowed_origins?: string[];
  allowed_ips?: string[];
  scopes?: string[];
  rate_limit_override?: number;
  expires_at?: string;
}

export interface APIKeyWithSecret extends APIKey {
  key: string; // Only returned on creation
}

export interface APIUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  version: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  ip_address?: string;
  user_agent?: string;
  origin?: string;
  rate_limit_remaining?: number;
  rate_limit_reset?: string;
  created_at: string;
}

export interface APIUsageHourly {
  id: string;
  api_key_id: string;
  hour: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  total_request_bytes: number;
  total_response_bytes: number;
  top_endpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  status_codes: Record<string, number>;
}

export interface APIQuota {
  id: string;
  api_key_id: string;
  quota_type: 'requests' | 'bandwidth' | 'compute';
  limit_value: number;
  period: 'hour' | 'day' | 'month';
  current_usage: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEndpoint {
  id: string;
  organization_id: string;
  url: string;
  description?: string;
  events: string[];
  api_version: string;
  enabled: boolean;
  status: 'active' | 'failing' | 'disabled';
  headers?: Record<string, string>;
  max_retries: number;
  retry_delay_seconds: number;
  last_success_at?: string;
  last_failure_at?: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  event_id: string;
  payload: any;
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
}

// API Gateway Configuration
export interface APIGatewayConfig {
  version: APIVersion;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: {
    version: string;
    timestamp: string;
    request_id: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  documentation_url?: string;
}

// Pagination
export interface APIPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface APIPaginatedResponse<T> extends APIResponse<T[]> {
  pagination: APIPagination;
}

// Rate Limit Headers
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  allowed: boolean;
  retryAfter?: number;
}

// API Scopes
export const API_SCOPES = {
  // Read scopes
  'read:organizations': 'Read organization data',
  'read:buildings': 'Read building data',
  'read:emissions': 'Read emissions data',
  'read:sustainability': 'Read sustainability data',
  'read:users': 'Read user data',
  'read:analytics': 'Read analytics data',
  
  // Write scopes
  'write:organizations': 'Create and update organizations',
  'write:buildings': 'Create and update buildings',
  'write:emissions': 'Submit emissions data',
  'write:sustainability': 'Update sustainability data',
  'write:users': 'Manage users',
  
  // Admin scopes
  'admin:api_keys': 'Manage API keys',
  'admin:webhooks': 'Manage webhooks',
  'admin:all': 'Full administrative access',
} as const;

export type APIScope = keyof typeof API_SCOPES;

// Webhook Events
export const WEBHOOK_EVENTS = {
  // Organization events
  'organization.created': 'Organization created',
  'organization.updated': 'Organization updated',
  'organization.deleted': 'Organization deleted',
  
  // Building events
  'building.created': 'Building created',
  'building.updated': 'Building updated',
  'building.deleted': 'Building deleted',
  
  // Emissions events
  'emissions.reported': 'Emissions data reported',
  'emissions.updated': 'Emissions data updated',
  
  // Alert events
  'alert.triggered': 'Alert triggered',
  'alert.resolved': 'Alert resolved',
  
  // Compliance events
  'compliance.report.generated': 'Compliance report generated',
  'compliance.violation.detected': 'Compliance violation detected',
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;