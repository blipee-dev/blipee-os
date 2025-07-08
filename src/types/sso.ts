// Enterprise SSO Types

export enum SSOProvider {
  SAML = "saml",
  OIDC = "oidc",
}

// Alias for backward compatibility
export const SSOProtocol = SSOProvider;

export enum SSOStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CONFIGURING = "configuring",
  ERROR = "error",
}

export interface SSOConfiguration {
  id: string;
  organization_id: string;
  provider: SSOProvider;
  protocol?: SSOProvider; // Alias for provider
  enabled: boolean;
  status: SSOStatus;
  
  // Common fields
  name: string;
  domain: string; // Email domain for auto-assignment
  
  // SAML-specific fields
  saml_metadata_url?: string;
  saml_metadata_xml?: string;
  saml_issuer?: string;
  saml_sso_url?: string;
  saml_certificate?: string;
  saml_attribute_mapping?: SAMLAttributeMapping;
  
  // OIDC-specific fields
  oidc_client_id?: string;
  oidc_client_secret?: string;
  oidc_issuer_url?: string;
  oidc_discovery_url?: string;
  oidc_authorization_endpoint?: string;
  oidc_token_endpoint?: string;
  oidc_userinfo_endpoint?: string;
  oidc_jwks_uri?: string;
  oidc_scopes?: string[];
  oidc_attribute_mapping?: OIDCAttributeMapping;
  
  // Auto-provisioning settings
  auto_provision_users: boolean;
  autoProvision?: boolean; // Alias for auto_provision_users
  default_role?: string;
  defaultRole?: string; // Alias for default_role
  default_permissions?: string[];
  
  // Structured configs (used by UI)
  saml_config?: {
    issuer?: string;
    sso_url?: string;
    slo_url?: string;
    certificate?: string;
    metadata_url?: string;
    metadata_xml?: string;
    sp_entity_id?: string;
    attribute_mapping?: SAMLAttributeMapping;
  };
  samlConfig?: SSOConfiguration['saml_config']; // Alias
  
  oidc_config?: {
    client_id?: string;
    client_secret?: string;
    issuer_url?: string;
    discovery_url?: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
    end_session_endpoint?: string;
    jwks_uri?: string;
    scopes?: string[];
    attribute_mapping?: OIDCAttributeMapping;
  };
  oidcConfig?: SSOConfiguration['oidc_config']; // Alias
  
  attributeMapping?: SAMLAttributeMapping | OIDCAttributeMapping;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  last_tested_at?: string;
  last_test_status?: "success" | "failed";
  last_test_error?: string;
}

export interface SAMLAttributeMapping {
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  groups?: string;
  department?: string;
  employee_id?: string;
  custom_attributes?: Record<string, string>;
}

export interface OIDCAttributeMapping {
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  groups?: string;
  department?: string;
  employee_id?: string;
  custom_claims?: Record<string, string>;
}

export interface SSOSession {
  id: string;
  user_id: string;
  sso_configuration_id: string;
  provider: SSOProvider;
  
  // Session data
  session_index?: string; // SAML session index
  name_id?: string; // SAML NameID
  oidc_access_token?: string;
  oidc_refresh_token?: string;
  oidc_id_token?: string;
  
  // Metadata
  created_at: string;
  expires_at: string;
  last_activity_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface SSOAuthenticationRequest {
  id: string;
  sso_configuration_id: string;
  provider: SSOProvider;
  state: string;
  nonce?: string; // For OIDC
  relay_state?: string; // For SAML
  redirect_uri: string;
  created_at: string;
  expires_at: string;
}

export interface SSOUser {
  id: string;
  email: string;
  sso_configuration_id: string;
  external_id: string; // ID from the SSO provider
  
  // User attributes from SSO
  full_name?: string;
  first_name?: string;
  last_name?: string;
  groups?: string[];
  department?: string;
  employee_id?: string;
  custom_attributes?: Record<string, any>;
  
  // Provisioning
  auto_provisioned: boolean;
  last_synced_at: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// SAML-specific types
export interface SAMLRequest {
  id: string;
  issuer: string;
  destination: string;
  assertionConsumerServiceURL: string;
  protocolBinding?: string;
  version?: string;
  issueInstant: string;
}

export interface SAMLResponse {
  id: string;
  issuer: string;
  status: {
    code: string;
    message?: string;
  };
  assertion?: SAMLAssertion;
}

export interface SAMLAssertion {
  id: string;
  issuer: string;
  subject: {
    nameId: string;
    nameIdFormat?: string;
    sessionIndex?: string;
  };
  conditions?: {
    notBefore?: string;
    notOnOrAfter?: string;
    audienceRestriction?: string[];
  };
  attributes: Record<string, any>;
}

// OIDC-specific types
export interface OIDCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OIDCUserInfo {
  sub: string; // Subject identifier
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  groups?: string[];
  [key: string]: any; // Allow custom claims
}

// Service interfaces
export interface ISSOService {
  // Configuration management
  createConfiguration(config: Omit<SSOConfiguration, "id" | "created_at" | "updated_at">): Promise<SSOConfiguration>;
  updateConfiguration(id: string, updates: Partial<SSOConfiguration>): Promise<SSOConfiguration>;
  getConfiguration(id: string): Promise<SSOConfiguration | null>;
  getConfigurationByDomain(domain: string): Promise<SSOConfiguration | null>;
  listConfigurations(organizationId: string): Promise<SSOConfiguration[]>;
  deleteConfiguration(id: string): Promise<void>;
  testConfiguration(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Authentication flows
  initiateAuthentication(configId: string, redirectUri: string): Promise<{ url: string; requestId: string }>;
  handleAuthenticationResponse(provider: SSOProvider, data: any): Promise<SSOAuthenticationResult>;
  
  // Session management
  createSSOSession(userId: string, configId: string, sessionData: any): Promise<SSOSession>;
  getSSOSession(sessionId: string): Promise<SSOSession | null>;
  invalidateSSOSession(sessionId: string): Promise<void>;
  
  // User provisioning
  provisionUser(ssoUser: SSOUser, organizationId: string): Promise<string>; // Returns userId
  syncUserAttributes(userId: string, attributes: Record<string, any>): Promise<void>;
}

export interface SSOAuthenticationResult {
  success: boolean;
  userId?: string;
  email?: string;
  attributes?: Record<string, any>;
  sessionId?: string;
  error?: string;
  requiresProvisioning?: boolean;
}

// Utility types
export interface SSOMetadata {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  attributeMapping?: Record<string, string>;
}

export class SSOError extends Error {
  code: SSOErrorCode;
  details?: any;

  constructor(message: string, code: SSOErrorCode, details?: any) {
    super(message);
    this.name = 'SSOError';
    this.code = code;
    this.details = details;
  }
}

export enum SSOErrorCode {
  CONFIGURATION_NOT_FOUND = "SSO_CONFIG_NOT_FOUND",
  INVALID_CONFIGURATION = "SSO_INVALID_CONFIG",
  AUTHENTICATION_FAILED = "SSO_AUTH_FAILED",
  INVALID_RESPONSE = "SSO_INVALID_RESPONSE",
  USER_PROVISIONING_FAILED = "SSO_PROVISIONING_FAILED",
  SESSION_EXPIRED = "SSO_SESSION_EXPIRED",
  DOMAIN_MISMATCH = "SSO_DOMAIN_MISMATCH",
  PROVIDER_ERROR = "SSO_PROVIDER_ERROR",
}