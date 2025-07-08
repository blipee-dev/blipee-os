import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import { getAuditService } from "@/lib/audit/service";
import { AuditEventType, AuditEventSeverity } from "@/lib/audit/types";
import { EncryptionService } from "@/lib/security/encryption/service";
import {
  SSOConfiguration,
  SSOProvider,
  SSOStatus,
  SSOSession,
  SSOAuthenticationRequest,
  SSOUser,
  ISSOService,
  SSOAuthenticationResult,
  SSOError,
  SSOErrorCode,
} from "@/types/sso";
import { SAMLService } from "./saml";
import { OIDCService } from "./oidc";
import crypto from "crypto";

export class SSOService implements ISSOService {
  private auditService = getAuditService();
  private encryptionService: EncryptionService;
  private samlService: SAMLService;
  private oidcService: OIDCService;

  constructor() {
    
    // Create a simple local encryption provider for SSO
    const localProvider = {
      async encrypt(plaintext: string): Promise<string> {
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
      },
      async decrypt(ciphertext: string): Promise<string> {
        const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      },
      async generateDataKey() {
        const key = crypto.randomBytes(32);
        return {
          plaintext: key,
          ciphertext: key.toString('hex')
        };
      },
      async rotateKey(keyId: string) {
        return keyId;
      }
    };
    
    this.encryptionService = new EncryptionService(localProvider);
    this.samlService = new SAMLService();
    this.oidcService = new OIDCService();
  }

  private async getSupabase() {
    if (typeof window === "undefined") {
      return await createServerSupabaseClient();
    } else {
      return createClient();
    }
  }

  /**
   * Create a new SSO configuration
   */
  async createConfiguration(
    config: Omit<SSOConfiguration, "id" | "created_at" | "updated_at">
  ): Promise<SSOConfiguration> {
    const supabase = await this.getSupabase();
    
    try {
      // Encrypt sensitive fields
      const encryptedConfig = await this.encryptSensitiveFields(config);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Create configuration
      const { data, error } = await supabase
        .from("sso_configurations")
        .insert({
          ...encryptedConfig,
          created_by: user.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: user.id },
        target: {
          type: "sso_configuration",
          id: data.id,
          name: config.name
        },
        context: { organizationId: config.organization_id },
        metadata: {
          action: "created",
          provider: config.provider,
          domain: config.domain,
        },
        result: 'success'
      });
      
      return this.decryptSensitiveFields(data);
    } catch (error) {
      console.error("Failed to create SSO configuration:", error);
      throw new SSOError(
        "Failed to create SSO configuration",
        SSOErrorCode.INVALID_CONFIGURATION
      );
    }
  }

  /**
   * Update an existing SSO configuration
   */
  async updateConfiguration(
    id: string,
    updates: Partial<SSOConfiguration>
  ): Promise<SSOConfiguration> {
    const supabase = await this.getSupabase();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Encrypt sensitive fields if present
      const encryptedUpdates = await this.encryptSensitiveFields(updates);
      
      // Update configuration
      const { data, error } = await supabase
        .from("sso_configurations")
        .update({
          ...encryptedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: user.id },
        target: {
          type: "sso_configuration",
          id: id,
        },
        context: {},
        metadata: {
          action: "updated",
          updates: Object.keys(updates),
        },
        result: 'success'
      });
      
      return this.decryptSensitiveFields(data);
    } catch (error) {
      console.error("Failed to update SSO configuration:", error);
      throw new SSOError(
        "Failed to update SSO configuration",
        SSOErrorCode.INVALID_CONFIGURATION
      );
    }
  }

  /**
   * Get SSO configuration by ID
   */
  async getConfiguration(id: string): Promise<SSOConfiguration | null> {
    const supabase = await this.getSupabase();
    
    try {
      const { data, error } = await supabase
        .from("sso_configurations")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      
      return data ? this.decryptSensitiveFields(data) : null;
    } catch (error) {
      console.error("Failed to get SSO configuration:", error);
      throw new SSOError(
        "Failed to get SSO configuration",
        SSOErrorCode.CONFIGURATION_NOT_FOUND
      );
    }
  }

  /**
   * Get SSO configuration by email domain
   */
  async getConfigurationByDomain(domain: string): Promise<SSOConfiguration | null> {
    const supabase = await this.getSupabase();
    
    try {
      const { data, error } = await supabase
        .from("sso_configurations")
        .select("*")
        .eq("domain", domain.toLowerCase())
        .eq("enabled", true)
        .eq("status", "active")
        .single();
        
      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      
      return data ? this.decryptSensitiveFields(data) : null;
    } catch (error) {
      console.error("Failed to get SSO configuration by domain:", error);
      return null;
    }
  }

  /**
   * List all SSO configurations for an organization
   */
  async listConfigurations(organizationId: string): Promise<SSOConfiguration[]> {
    const supabase = await this.getSupabase();
    
    try {
      const { data, error } = await supabase
        .from("sso_configurations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      return Promise.all(data.map(config => this.decryptSensitiveFields(config)));
    } catch (error) {
      console.error("Failed to list SSO configurations:", error);
      throw new SSOError(
        "Failed to list SSO configurations",
        SSOErrorCode.CONFIGURATION_NOT_FOUND
      );
    }
  }

  /**
   * Delete an SSO configuration
   */
  async deleteConfiguration(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Delete configuration
      const { error } = await supabase
        .from("sso_configurations")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: user.id },
        target: {
          type: "sso_configuration",
          id: id,
        },
        context: {},
        metadata: {
          action: "deleted",
        },
        result: 'success'
      });
    } catch (error) {
      console.error("Failed to delete SSO configuration:", error);
      throw new SSOError(
        "Failed to delete SSO configuration",
        SSOErrorCode.CONFIGURATION_NOT_FOUND
      );
    }
  }

  /**
   * Test an SSO configuration
   */
  async testConfiguration(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getSupabase();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get configuration
      const config = await this.getConfiguration(id);
      if (!config) {
        throw new SSOError(
          "Configuration not found",
          SSOErrorCode.CONFIGURATION_NOT_FOUND
        );
      }
      
      // Test based on provider
      let testResult: { success: boolean; error?: string };
      
      if (config.provider === SSOProvider.SAML) {
        testResult = await this.samlService.testConfiguration(config);
      } else if (config.provider === SSOProvider.OIDC) {
        testResult = await this.oidcService.testConfiguration(config);
      } else {
        throw new Error("Unsupported SSO provider");
      }
      
      // Update test status
      await supabase
        .from("sso_configurations")
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_status: testResult.success ? "success" : "failed",
          last_test_error: testResult.error || null,
        })
        .eq("id", id);
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'user', id: user.id },
        target: {
          type: "sso_configuration",
          id: id,
        },
        context: {},
        metadata: { action: "tested", ...testResult },
        result: testResult.success ? 'success' : 'failure'
      });
      
      return testResult;
    } catch (error: any) {
      console.error("Failed to test SSO configuration:", error);
      return {
        success: false,
        error: error.message || "Failed to test configuration",
      };
    }
  }

  /**
   * Initiate SSO authentication
   */
  async initiateAuthentication(
    configId: string,
    redirectUri: string
  ): Promise<{ url: string; requestId: string }> {
    const supabase = await this.getSupabase();
    
    try {
      // Get configuration
      const config = await this.getConfiguration(configId);
      if (!config) {
        throw new SSOError(
          "Configuration not found",
          SSOErrorCode.CONFIGURATION_NOT_FOUND
        );
      }
      
      if (!config.enabled || config.status !== SSOStatus.ACTIVE) {
        throw new SSOError(
          "SSO configuration is not active",
          SSOErrorCode.INVALID_CONFIGURATION
        );
      }
      
      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString("hex");
      const nonce = config.provider === SSOProvider.OIDC
        ? crypto.randomBytes(32).toString("hex")
        : undefined;
      
      // Create auth request
      const { data: authRequest, error } = await supabase
        .from("sso_auth_requests")
        .insert({
          sso_configuration_id: configId,
          provider: config.provider,
          state,
          nonce,
          redirect_uri: redirectUri,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Generate authentication URL based on provider
      let authUrl: string;
      
      if (config.provider === SSOProvider.SAML) {
        authUrl = await this.samlService.generateAuthenticationRequest(
          config,
          authRequest.id,
          state
        );
      } else if (config.provider === SSOProvider.OIDC) {
        authUrl = await this.oidcService.generateAuthenticationRequest(
          config,
          state,
          nonce!,
          redirectUri
        );
      } else {
        throw new Error("Unsupported SSO provider");
      }
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        result: 'success',
        actor: { type: 'system' },
        target: {
          type: "sso_configuration",
          id: configId,
        },
        context: {},
        metadata: {
          request_id: authRequest.id,
          provider: config.provider,
        },
      });
      
      return {
        url: authUrl,
        requestId: authRequest.id,
      };
    } catch (error: any) {
      console.error("Failed to initiate SSO authentication:", error);
      throw new SSOError(
        error.message || "Failed to initiate authentication",
        SSOErrorCode.AUTHENTICATION_FAILED
      );
    }
  }

  /**
   * Handle SSO authentication response
   */
  async handleAuthenticationResponse(
    provider: SSOProvider,
    data: any
  ): Promise<SSOAuthenticationResult> {
    const supabase = await this.getSupabase();
    
    try {
      // Validate state parameter
      const state = data.state || data.RelayState;
      if (!state) {
        throw new SSOError(
          "Missing state parameter",
          SSOErrorCode.INVALID_RESPONSE
        );
      }
      
      // Get auth request
      const { data: authRequest, error: requestError } = await supabase
        .from("sso_auth_requests")
        .select("*, sso_configuration:sso_configurations(*)")
        .eq("state", state)
        .single();
        
      if (requestError || !authRequest) {
        throw new SSOError(
          "Invalid or expired authentication request",
          SSOErrorCode.SESSION_EXPIRED
        );
      }
      
      // Check if request is expired
      if (new Date(authRequest.expires_at) < new Date()) {
        throw new SSOError(
          "Authentication request has expired",
          SSOErrorCode.SESSION_EXPIRED
        );
      }
      
      // Decrypt configuration
      const config = await this.decryptSensitiveFields(authRequest.sso_configuration);
      
      // Process response based on provider
      let authResult: SSOAuthenticationResult;
      
      if (provider === SSOProvider.SAML) {
        authResult = await this.samlService.processAuthenticationResponse(
          config,
          data
        );
      } else if (provider === SSOProvider.OIDC) {
        authResult = await this.oidcService.processAuthenticationResponse(
          config,
          data,
          authRequest.nonce,
          authRequest.redirect_uri
        );
      } else {
        throw new Error("Unsupported SSO provider");
      }
      
      // Delete used auth request
      await supabase
        .from("sso_auth_requests")
        .delete()
        .eq("id", authRequest.id);
      
      if (!authResult.success) {
        // Audit log failure
        await this.auditService.log({
          type: AuditEventType.AUTH_LOGIN_FAILED,
          severity: AuditEventSeverity.WARNING,
          result: 'failure',
          actor: { type: 'system' },
          target: {
            type: "sso_configuration",
            id: config.id,
          },
          context: {},
          metadata: {
            error: authResult.error,
          },
        });
        
        return authResult;
      }
      
      // Handle user provisioning if needed
      let userId = authResult.userId;
      
      if (!userId && authResult.email) {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("email", authResult.email)
          .single();
        
        if (existingUser) {
          userId = existingUser.id;
        } else if (config.auto_provision_users) {
          // Auto-provision user
          userId = await this.provisionUser(
            {
              id: crypto.randomUUID(),
              email: authResult.email,
              sso_configuration_id: config.id,
              external_id: authResult.attributes?.sub || authResult.email,
              full_name: authResult.attributes?.name,
              first_name: authResult.attributes?.given_name,
              last_name: authResult.attributes?.family_name,
              groups: authResult.attributes?.groups,
              department: authResult.attributes?.department,
              employee_id: authResult.attributes?.employee_id,
              custom_attributes: authResult.attributes,
              auto_provisioned: true,
              last_synced_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            config.organization_id
          );
          
          authResult.requiresProvisioning = false;
        } else {
          authResult.requiresProvisioning = true;
          return authResult;
        }
      }
      
      if (!userId) {
        throw new Error("Failed to determine user ID");
      }
      
      // Create SSO session
      const ssoSession = await this.createSSOSession(
        userId,
        config.id,
        {
          provider,
          sessionIndex: authResult.attributes?.sessionIndex,
          nameId: authResult.attributes?.nameId,
          accessToken: authResult.attributes?.access_token,
          refreshToken: authResult.attributes?.refresh_token,
          idToken: authResult.attributes?.id_token,
        }
      );
      
      // Update SSO user mapping
      await this.updateSSOUserMapping(
        userId,
        config.id,
        authResult.attributes || {}
      );
      
      // Audit log success
      await this.auditService.log({
        type: AuditEventType.AUTH_LOGIN_SUCCESS,
        severity: AuditEventSeverity.INFO,
        result: 'success',
        actor: { type: 'user', id: userId },
        target: {
          type: "sso_configuration",
          id: config.id,
        },
        context: {},
        metadata: {
          session_id: ssoSession.id,
          provider,
        },
      });
      
      return {
        ...authResult,
        userId,
        sessionId: ssoSession.id,
      };
    } catch (error: any) {
      console.error("Failed to handle SSO authentication response:", error);
      
      if (error instanceof SSOError) {
        throw error;
      }
      
      throw new SSOError(
        error.message || "Failed to process authentication response",
        SSOErrorCode.AUTHENTICATION_FAILED
      );
    }
  }

  /**
   * Create an SSO session
   */
  async createSSOSession(
    userId: string,
    configId: string,
    sessionData: any
  ): Promise<SSOSession> {
    const supabase = await this.getSupabase();
    
    try {
      // Encrypt sensitive session data
      const encryptedData: any = {};
      
      if (sessionData.accessToken) {
        encryptedData.oidc_access_token = await this.encryptionService.encrypt(
          sessionData.accessToken
        );
      }
      
      if (sessionData.refreshToken) {
        encryptedData.oidc_refresh_token = await this.encryptionService.encrypt(
          sessionData.refreshToken
        );
      }
      
      if (sessionData.idToken) {
        encryptedData.oidc_id_token = await this.encryptionService.encrypt(
          sessionData.idToken
        );
      }
      
      // Create session
      const { data, error } = await supabase
        .from("sso_sessions")
        .insert({
          user_id: userId,
          sso_configuration_id: configId,
          provider: sessionData.provider,
          session_index: sessionData.sessionIndex,
          name_id: sessionData.nameId,
          ...encryptedData,
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.AUTH_SESSION_CREATED,
        severity: AuditEventSeverity.INFO,
        result: 'success',
        actor: { type: 'user', id: userId },
        target: {
          type: "sso_session",
          id: data.id,
        },
        context: {},
        metadata: {},
      });
      
      return data;
    } catch (error) {
      console.error("Failed to create SSO session:", error);
      throw new SSOError(
        "Failed to create SSO session",
        SSOErrorCode.AUTHENTICATION_FAILED
      );
    }
  }

  /**
   * Get SSO session by ID
   */
  async getSSOSession(sessionId: string): Promise<SSOSession | null> {
    const supabase = await this.getSupabase();
    
    try {
      const { data, error } = await supabase
        .from("sso_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
        
      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Failed to get SSO session:", error);
      return null;
    }
  }

  /**
   * Invalidate an SSO session
   */
  async invalidateSSOSession(sessionId: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    try {
      // Get session for audit log
      const { data: session } = await supabase
        .from("sso_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single();
      
      // Delete session
      const { error } = await supabase
        .from("sso_sessions")
        .delete()
        .eq("id", sessionId);
        
      if (error) throw error;
      
      // Audit log
      if (session) {
        await this.auditService.log({
          type: AuditEventType.AUTH_SESSION_TERMINATED,
          severity: AuditEventSeverity.INFO,
          result: 'success',
          actor: { type: 'user', id: session.user_id },
          target: {
            type: "sso_session",
            id: sessionId,
          },
          context: {},
          metadata: {},
        });
      }
    } catch (error) {
      console.error("Failed to invalidate SSO session:", error);
      throw new SSOError(
        "Failed to invalidate SSO session",
        SSOErrorCode.SESSION_EXPIRED
      );
    }
  }

  /**
   * Provision a new user via SSO
   */
  async provisionUser(ssoUser: SSOUser, organizationId: string): Promise<string> {
    const supabase = await this.getSupabase();
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ssoUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: ssoUser.full_name,
          sso_provisioned: true,
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");
      
      const userId = authData.user.id;
      
      // Create SSO user mapping
      const { error: mappingError } = await supabase
        .from("sso_users")
        .insert({
          user_id: userId,
          sso_configuration_id: ssoUser.sso_configuration_id,
          external_id: ssoUser.external_id,
          email: ssoUser.email,
          full_name: ssoUser.full_name,
          first_name: ssoUser.first_name,
          last_name: ssoUser.last_name,
          groups: ssoUser.groups,
          department: ssoUser.department,
          employee_id: ssoUser.employee_id,
          custom_attributes: ssoUser.custom_attributes,
          auto_provisioned: true,
        });
        
      if (mappingError) {
        // Rollback user creation
        await supabase.auth.admin.deleteUser(userId);
        throw mappingError;
      }
      
      // Get SSO configuration for default role
      const { data: ssoConfig } = await supabase
        .from("sso_configurations")
        .select("default_role")
        .eq("id", ssoUser.sso_configuration_id)
        .single();
      
      // Add user to organization
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: ssoConfig?.default_role || "guest",
          invitation_status: "accepted",
          joined_at: new Date().toISOString(),
        });
        
      if (memberError) {
        // Rollback
        await supabase.auth.admin.deleteUser(userId);
        throw memberError;
      }
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.USER_CREATED,
        severity: AuditEventSeverity.INFO,
        result: 'success',
        actor: { type: 'system' },
        target: {
          type: "user",
          id: userId,
        },
        context: { organizationId },
        metadata: {
          sso_configuration_id: ssoUser.sso_configuration_id,
          email: ssoUser.email,
          provisioned_via: 'sso',
        },
      });
      
      return userId;
    } catch (error) {
      console.error("Failed to provision SSO user:", error);
      throw new SSOError(
        "Failed to provision user",
        SSOErrorCode.USER_PROVISIONING_FAILED
      );
    }
  }

  /**
   * Sync user attributes from SSO
   */
  async syncUserAttributes(
    userId: string,
    attributes: Record<string, any>
  ): Promise<void> {
    const supabase = await this.getSupabase();
    
    try {
      // Update user profile
      const updates: any = {};
      
      if (attributes.name || attributes.full_name) {
        updates.full_name = attributes.name || attributes.full_name;
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", userId);
      }
      
      // Update SSO user mapping
      await supabase
        .from("sso_users")
        .update({
          full_name: attributes.name || attributes.full_name,
          first_name: attributes.given_name || attributes.first_name,
          last_name: attributes.family_name || attributes.last_name,
          groups: attributes.groups,
          department: attributes.department,
          employee_id: attributes.employee_id,
          custom_attributes: attributes,
          last_synced_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      // Audit log
      await this.auditService.log({
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        result: 'success',
        actor: { type: 'system' },
        target: {
          type: "user",
          id: userId,
        },
        context: {},
        metadata: {
          action: 'sso_attributes_synced',
        },
      });
    } catch (error) {
      console.error("Failed to sync user attributes:", error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Update SSO user mapping
   */
  private async updateSSOUserMapping(
    userId: string,
    configId: string,
    attributes: Record<string, any>
  ): Promise<void> {
    const supabase = await this.getSupabase();
    
    try {
      const { error } = await supabase
        .from("sso_users")
        .upsert({
          user_id: userId,
          sso_configuration_id: configId,
          external_id: attributes.sub || attributes.nameId || attributes.email,
          email: attributes.email,
          full_name: attributes.name || attributes.full_name,
          first_name: attributes.given_name || attributes.first_name,
          last_name: attributes.family_name || attributes.last_name,
          groups: attributes.groups,
          department: attributes.department,
          employee_id: attributes.employee_id,
          custom_attributes: attributes,
          last_synced_at: new Date().toISOString(),
        });
        
      if (error) throw error;
    } catch (error) {
      console.error("Failed to update SSO user mapping:", error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Encrypt sensitive fields in configuration
   */
  private async encryptSensitiveFields(
    config: any
  ): Promise<any> {
    const encrypted = { ...config };
    
    // Encrypt OIDC client secret
    if (config.oidc_client_secret) {
      encrypted.oidc_client_secret = await this.encryptionService.encrypt(
        config.oidc_client_secret
      );
    }
    
    // Encrypt SAML certificate if needed
    if (config.saml_certificate) {
      encrypted.saml_certificate = await this.encryptionService.encrypt(
        config.saml_certificate
      );
    }
    
    return encrypted;
  }

  /**
   * Decrypt sensitive fields in configuration
   */
  private async decryptSensitiveFields(
    config: any
  ): Promise<any> {
    const decrypted = { ...config };
    
    // Decrypt OIDC client secret
    if (config.oidc_client_secret) {
      try {
        decrypted.oidc_client_secret = await this.encryptionService.decrypt(
          config.oidc_client_secret
        );
      } catch (error) {
        console.error("Failed to decrypt OIDC client secret:", error);
        decrypted.oidc_client_secret = null;
      }
    }
    
    // Decrypt SAML certificate if needed
    if (config.saml_certificate && config.saml_certificate.includes(":")) {
      try {
        decrypted.saml_certificate = await this.encryptionService.decrypt(
          config.saml_certificate
        );
      } catch (error) {
        // Certificate might not be encrypted
        decrypted.saml_certificate = config.saml_certificate;
      }
    }
    
    return decrypted;
  }

  /**
   * Generate SAML logout request
   */
  async generateSAMLLogoutRequest(
    config: SSOConfiguration,
    externalId: string
  ): Promise<{ url: string }> {
    if (!config.saml_config?.slo_url) {
      throw new SSOError(
        "SAML SLO URL not configured",
        SSOErrorCode.INVALID_CONFIGURATION
      );
    }

    const samlService = new SAMLService();
    const logoutRequestId = `_${crypto.randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();
    
    // Build SAML logout request
    const logoutRequest = `
      <samlp:LogoutRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${logoutRequestId}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${config.saml_config.slo_url}">
        <saml:Issuer>${config.saml_config.sp_entity_id || process.env.NEXT_PUBLIC_SITE_URL}</saml:Issuer>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${externalId}</saml:NameID>
      </samlp:LogoutRequest>
    `;

    // Encode and sign if needed
    const encodedRequest = Buffer.from(logoutRequest).toString('base64');
    const url = new URL(config.saml_config.slo_url);
    url.searchParams.set('SAMLRequest', encodedRequest);
    
    // Add relay state
    const relayState = crypto.randomBytes(16).toString('hex');
    url.searchParams.set('RelayState', relayState);

    return { url: url.toString() };
  }
}

// Export singleton instance
export const ssoService = new SSOService();