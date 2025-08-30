import {
  SSOConfiguration,
  SSOAuthenticationResult,
  OIDCTokenResponse,
  OIDCUserInfo,
} from "@/types/sso";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export class OIDCService {
  /**
   * Test OIDC configuration
   */
  async testConfiguration(
    config: SSOConfiguration
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate required fields
      if (!config.oidc_client_id || !config.oidc_client_secret) {
        return {
          success: false,
          error: "OIDC client ID and secret are required",
        };
      }
      
      // If discovery URL is provided, fetch and validate
      if (config.oidc_discovery_url) {
        try {
          const discovery = await this.fetchDiscoveryDocument(config.oidc_discovery_url);
          
          if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
            return {
              success: false,
              error: "Invalid discovery document",
            };
          }
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to fetch discovery document: ${.message}`,
          };
        }
      } else {
        // Validate manual configuration
        if (!config.oidc_issuer_url || !config.oidc_authorization_endpoint || !config.oidc_token_endpoint) {
          return {
            success: false,
            error: "Either discovery URL or manual endpoints are required",
          };
        }
      }
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Configuration test failed",
      };
    }
  }

  /**
   * Generate OIDC authentication request
   */
  async generateAuthenticationRequest(
    config: SSOConfiguration,
    state: string,
    nonce: string,
    redirectUri: string
  ): Promise<string> {
    try {
      // Get authorization endpoint
      let authorizationEndpoint = config.oidc_authorization_endpoint;
      
      if (!authorizationEndpoint && config.oidc_discovery_url) {
        const discovery = await this.fetchDiscoveryDocument(config.oidc_discovery_url);
        authorizationEndpoint = discovery.authorization_endpoint;
      }
      
      if (!authorizationEndpoint) {
        throw new Error("OIDC authorization endpoint not configured");
      }
      
      // Build authorization URL
      const url = new URL(authorizationEndpoint);
      
      // Add parameters
      url.searchParams.set("client_id", config.oidc_client_id!);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", (config.oidc_scopes || ["openid", "email", "profile"]).join(" "));
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      
      // Add optional parameters
      if (config.oidc_attribute_mapping?.groups) {
        // Request groups if mapped
        const currentScopes = url.searchParams.get("scope") || "";
        if (!currentScopes.includes("groups")) {
          url.searchParams.set("scope", `${currentScopes} groups`);
        }
      }
      
      return url.toString();
    } catch (error: any) {
      console.error("Failed to generate OIDC authentication request:", error);
      throw new Error(`Failed to generate OIDC request: ${.message}`);
    }
  }

  /**
   * Process OIDC authentication response
   */
  async processAuthenticationResponse(
    config: SSOConfiguration,
    data: any,
    expectedNonce: string,
    redirectUri: string
  ): Promise<SSOAuthenticationResult> {
    try {
      // Check for error response
      if (data.error) {
        return {
          success: false,
          error: `OIDC error: ${data.error} - ${data.error_description || ""}`,
        };
      }
      
      // Validate authorization code
      const code = data.code;
      if (!code) {
        return {
          success: false,
          error: "Missing authorization code",
        };
      }
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(
        config,
        code,
        redirectUri
      );
      
      if (!tokens.id_token) {
        return {
          success: false,
          error: "No ID token received",
        };
      }
      
      // Validate ID token
      const idTokenPayload = await this.validateIdToken(
        tokens.id_token,
        config,
        expectedNonce
      );
      
      if (!idTokenPayload) {
        return {
          success: false,
          error: "Invalid ID token",
        };
      }
      
      // Get user info
      let userInfo: OIDCUserInfo = idTokenPayload as any;
      
      // Optionally fetch additional user info
      if (tokens.access_token && config.oidc_userinfo_endpoint) {
        try {
          const additionalInfo = await this.fetchUserInfo(
            config.oidc_userinfo_endpoint,
            tokens.access_token
          );
          userInfo = { ...userInfo, ...additionalInfo };
        } catch (error) {
          console.warn("Failed to fetch additional user info:", error);
        }
      }
      
      // Map attributes
      const attributeMapping = config.oidc_attribute_mapping ? 
        Object.entries(config.oidc_attribute_mapping).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>) : {};
      
      const attributes = this.mapOIDCAttributes(
        userInfo,
        attributeMapping
      );
      
      // Get email
      const email = attributes.email || userInfo.email;
      if (!email) {
        return {
          success: false,
          error: "Email not found in OIDC response",
        };
      }
      
      return {
        success: true,
        email,
        attributes: {
          ...attributes,
          sub: userInfo.sub,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          id_token: tokens.id_token,
        },
      };
    } catch (error: any) {
      console.error("Failed to process OIDC response:", error);
      return {
        success: false,
        error: error.message || "Failed to process OIDC response",
      };
    }
  }

  /**
   * Fetch OIDC discovery document
   */
  private async fetchDiscoveryDocument(discoveryUrl: string): Promise<any> {
    try {
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to fetch discovery document: ${.message}`);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    config: SSOConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OIDCTokenResponse> {
    try {
      // Get token endpoint
      let tokenEndpoint = config.oidc_token_endpoint;
      
      if (!tokenEndpoint && config.oidc_discovery_url) {
        const discovery = await this.fetchDiscoveryDocument(config.oidc_discovery_url);
        tokenEndpoint = discovery.token_endpoint;
      }
      
      if (!tokenEndpoint) {
        throw new Error("OIDC token endpoint not configured");
      }
      
      // Prepare request
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: config.oidc_client_id!,
        client_secret: config.oidc_client_secret!,
      });
      
      // Make token request
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }
      
      const tokens = await response.json();
      
      return {
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        scope: tokens.scope,
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${.message}`);
    }
  }

  /**
   * Validate ID token
   */
  private async validateIdToken(
    idToken: string,
    config: SSOConfiguration,
    expectedNonce: string
  ): Promise<any> {
    try {
      // Decode token without verification first
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded) {
        throw new Error("Failed to decode ID token");
      }
      
      const payload = decoded.payload as any;
      
      // Validate issuer
      if (payload.iss !== config.oidc_issuer_url) {
        throw new Error("ID token issuer mismatch");
      }
      
      // Validate audience
      if (payload.aud !== config.oidc_client_id) {
        throw new Error("ID token audience mismatch");
      }
      
      // Validate nonce
      if (payload.nonce !== expectedNonce) {
        throw new Error("ID token nonce mismatch");
      }
      
      // Validate expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("ID token has expired");
      }
      
      // TODO: Implement proper signature verification
      // This requires fetching JWKS and verifying the signature
      // For now, we trust the token if it came from the expected issuer
      
      return payload;
    } catch (error: any) {
      console.error("ID token validation failed:", error);
      return null;
    }
  }

  /**
   * Fetch user info from userinfo endpoint
   */
  private async fetchUserInfo(
    userinfoEndpoint: string,
    accessToken: string
  ): Promise<OIDCUserInfo> {
    try {
      const response = await fetch(userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to fetch user info: ${.message}`);
    }
  }

  /**
   * Map OIDC attributes to standard attributes
   */
  private mapOIDCAttributes(
    oidcAttributes: OIDCUserInfo,
    mapping: Record<string, string>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};
    
    // Default mappings
    const defaultMappings: Record<string, string[]> = {
      email: ["email", "preferred_username"],
      name: ["name", "displayName"],
      first_name: ["given_name", "firstName"],
      last_name: ["family_name", "lastName"],
      groups: ["groups", "roles"],
      department: ["department", "org"],
      employee_id: ["employee_id", "employeeNumber"],
    };
    
    // Apply custom mappings first
    for (const [targetAttr, sourceAttr] of Object.entries(mapping)) {
      if (oidcAttributes[sourceAttr] !== undefined) {
        mapped[targetAttr] = oidcAttributes[sourceAttr];
      }
    }
    
    // Apply default mappings for missing attributes
    for (const [targetAttr, possibleSources] of Object.entries(defaultMappings)) {
      if (!mapped[targetAttr]) {
        for (const source of possibleSources) {
          if (oidcAttributes[source] !== undefined) {
            mapped[targetAttr] = oidcAttributes[source];
            break;
          }
        }
      }
    }
    
    // Include all original attributes
    mapped._raw = oidcAttributes;
    
    return mapped;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    config: SSOConfiguration,
    refreshToken: string
  ): Promise<OIDCTokenResponse> {
    try {
      // Get token endpoint
      let tokenEndpoint = config.oidc_token_endpoint;
      
      if (!tokenEndpoint && config.oidc_discovery_url) {
        const discovery = await this.fetchDiscoveryDocument(config.oidc_discovery_url);
        tokenEndpoint = discovery.token_endpoint;
      }
      
      if (!tokenEndpoint) {
        throw new Error("OIDC token endpoint not configured");
      }
      
      // Prepare request
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.oidc_client_id!,
        client_secret: config.oidc_client_secret!,
      });
      
      // Make token request
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }
      
      const tokens = await response.json();
      
      return {
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token || refreshToken,
        id_token: tokens.id_token,
        scope: tokens.scope,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${.message}`);
    }
  }
}

export const oidcService = new OIDCService();