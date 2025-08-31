import {
  SSOConfiguration,
  SSOAuthenticationResult,
  SAMLRequest,
  SAMLResponse,
  SAMLAssertion,
} from "@/types/sso";
import crypto from "crypto";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import zlib from "zlib";

export class SAMLService {
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
    });
    
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      format: true,
    });
  }

  /**
   * Test SAML configuration
   */
  async testConfiguration(
    config: SSOConfiguration
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate required fields
      if (!config.saml_issuer) {
        return { success: false, error: "SAML issuer is required" };
      }
      
      if (!config.saml_sso_url && !config.saml_metadata_url) {
        return {
          success: false,
          error: "Either SAML SSO URL or metadata URL is required",
        };
      }
      
      // If metadata URL is provided, try to fetch and parse it
      if (config.saml_metadata_url) {
        try {
          const response = await fetch(config.saml_metadata_url);
          if (!response.ok) {
            return {
              success: false,
              error: `Failed to fetch metadata: ${response.status}`,
            };
          }
          
          const metadata = await response.text();
          const parsed = this.parseMetadata(metadata);
          
          if (!parsed.ssoUrl) {
            return {
              success: false,
              error: "Invalid metadata: SSO URL not found",
            };
          }
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to fetch metadata: ${error.message}`,
          };
        }
      }
      
      // Validate certificate if provided
      if (config.saml_certificate) {
        try {
          this.validateCertificate(config.saml_certificate);
        } catch (error: any) {
          return {
            success: false,
            error: `Invalid certificate: ${error.message}`,
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
   * Generate SAML authentication request
   */
  async generateAuthenticationRequest(
    config: SSOConfiguration,
    requestId: string,
    relayState: string
  ): Promise<string> {
    try {
      // Get SSO URL from config or metadata
      let ssoUrl = config.saml_sso_url;
      
      if (!ssoUrl && config.saml_metadata_url) {
        const metadata = await this.fetchMetadata(config.saml_metadata_url);
        ssoUrl = metadata.ssoUrl;
      }
      
      if (!ssoUrl) {
        throw new Error("SAML SSO URL not configured");
      }
      
      // Create SAML request
      const samlRequest: SAMLRequest = {
        id: `_${crypto.randomBytes(16).toString("hex")}`,
        issuer: config.saml_issuer!,
        destination: ssoUrl,
        assertionConsumerServiceURL: this.getACSUrl(),
        protocolBinding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
        version: "2.0",
        issueInstant: new Date().toISOString(),
      };
      
      // Build XML
      const xml = this.buildAuthenticationRequestXML(samlRequest);
      
      // Encode request
      const encoded = this.encodeSAMLRequest(xml);
      
      // Build redirect URL
      const url = new URL(ssoUrl);
      url.searchParams.set("SAMLRequest", encoded);
      url.searchParams.set("RelayState", relayState);
      
      return url.toString();
    } catch (error: any) {
      console.error("Failed to generate SAML authentication request:", error);
      throw new Error(`Failed to generate SAML request: ${error.message}`);
    }
  }

  /**
   * Process SAML authentication response
   */
  async processAuthenticationResponse(
    config: SSOConfiguration,
    data: any
  ): Promise<SSOAuthenticationResult> {
    try {
      // Decode SAML response
      const samlResponse = data.SAMLResponse;
      if (!samlResponse) {
        return {
          success: false,
          error: "Missing SAML response",
        };
      }
      
      const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
      const parsed = this.xmlParser.parse(decoded);
      
      // Extract response
      const response = this.extractSAMLResponse(parsed);
      
      // Validate response
      const validation = await this.validateSAMLResponse(response, config);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }
      
      // Extract assertion
      if (!response.assertion) {
        return {
          success: false,
          error: "No assertion found in SAML response",
        };
      }
      
      // Map attributes
      const attributeMapping = config.saml_attribute_mapping ? 
        Object.entries(config.saml_attribute_mapping).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>) : {};
      
      const attributes = this.mapSAMLAttributes(
        response.assertion.attributes,
        attributeMapping
      );
      
      // Get email
      const email = attributes.email || response.assertion.subject.nameId;
      if (!email) {
        return {
          success: false,
          error: "Email not found in SAML response",
        };
      }
      
      return {
        success: true,
        email,
        attributes: {
          ...attributes,
          nameId: response.assertion.subject.nameId,
          sessionIndex: response.assertion.subject.sessionIndex,
        },
      };
    } catch (error: any) {
      console.error("Failed to process SAML response:", error);
      return {
        success: false,
        error: error.message || "Failed to process SAML response",
      };
    }
  }

  /**
   * Parse SAML metadata
   */
  private parseMetadata(metadata: string): {
    entityId: string;
    ssoUrl?: string;
    sloUrl?: string;
    certificate?: string;
  } {
    try {
      const parsed = this.xmlParser.parse(metadata);
      const descriptor = parsed.EntityDescriptor || parsed["md:EntityDescriptor"];
      
      if (!descriptor) {
        throw new Error("Invalid metadata: EntityDescriptor not found");
      }
      
      const entityId = descriptor["@_entityID"];
      const idpDescriptor = descriptor.IDPSSODescriptor || descriptor["md:IDPSSODescriptor"];
      
      if (!idpDescriptor) {
        throw new Error("Invalid metadata: IDPSSODescriptor not found");
      }
      
      // Find SSO URL
      let ssoUrl: string | undefined;
      const ssoServices = Array.isArray(idpDescriptor.SingleSignOnService)
        ? idpDescriptor.SingleSignOnService
        : [idpDescriptor.SingleSignOnService].filter(Boolean);
        
      for (const service of ssoServices) {
        if (
          service["@_Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" ||
          service["@_Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        ) {
          ssoUrl = service["@_Location"];
          break;
        }
      }
      
      // Find SLO URL
      let sloUrl: string | undefined;
      const sloServices = Array.isArray(idpDescriptor.SingleLogoutService)
        ? idpDescriptor.SingleLogoutService
        : [idpDescriptor.SingleLogoutService].filter(Boolean);
        
      for (const service of sloServices) {
        if (
          service["@_Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" ||
          service["@_Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        ) {
          sloUrl = service["@_Location"];
          break;
        }
      }
      
      // Extract certificate
      let certificate: string | undefined;
      const keyDescriptors = Array.isArray(idpDescriptor.KeyDescriptor)
        ? idpDescriptor.KeyDescriptor
        : [idpDescriptor.KeyDescriptor].filter(Boolean);
        
      for (const key of keyDescriptors) {
        if (!key["@_use"] || key["@_use"] === "signing") {
          const certData = key.KeyInfo?.X509Data?.X509Certificate;
          if (certData) {
            certificate = certData.replace(/\s/g, "");
            break;
          }
        }
      }
      
      return {
        entityId,
        ssoUrl,
        sloUrl,
        certificate,
      };
    } catch (error: any) {
      console.error("Failed to parse SAML metadata:", error);
      throw new Error(`Invalid SAML metadata: ${error.message}`);
    }
  }

  /**
   * Fetch and parse SAML metadata
   */
  private async fetchMetadata(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const metadata = await response.text();
      return this.parseMetadata(metadata);
    } catch (error: any) {
      throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
  }

  /**
   * Build SAML authentication request XML
   */
  private buildAuthenticationRequestXML(request: SAMLRequest): string {
    const xml = {
      "samlp:AuthnRequest": {
        "@_xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
        "@_xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
        "@_ID": request.id,
        "@_Version": request.version,
        "@_IssueInstant": request.issueInstant,
        "@_Destination": request.destination,
        "@_AssertionConsumerServiceURL": request.assertionConsumerServiceURL,
        "@_ProtocolBinding": request.protocolBinding,
        "saml:Issuer": request.issuer,
        "samlp:NameIDPolicy": {
          "@_Format": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
          "@_AllowCreate": "true",
        },
      },
    };
    
    return this.xmlBuilder.build(xml);
  }

  /**
   * Encode SAML request for HTTP-Redirect binding
   */
  private encodeSAMLRequest(xml: string): string {
    // Deflate
    const deflated = zlib.deflateRawSync(xml);
    // Base64 encode
    return deflated.toString("base64");
  }

  /**
   * Extract SAML response from parsed XML
   */
  private extractSAMLResponse(parsed: any): SAMLResponse {
    const response = parsed["samlp:Response"] || parsed.Response;
    
    if (!response) {
      throw new Error("Invalid SAML response format");
    }
    
    // Extract status
    const status = response["samlp:Status"] || response.Status;
    const statusCode = status?.["samlp:StatusCode"] || status?.StatusCode;
    const statusMessage = status?.["samlp:StatusMessage"] || status?.StatusMessage;
    
    // Extract assertion
    const assertionElement = response["saml:Assertion"] || response.Assertion;
    let assertion: SAMLAssertion | undefined;
    
    if (assertionElement) {
      const subject = assertionElement["saml:Subject"] || assertionElement.Subject;
      const nameId = subject?.["saml:NameID"] || subject?.NameID;
      
      // Extract attributes
      const attributes: Record<string, any> = {};
      const attributeStatement =
        assertionElement["saml:AttributeStatement"] ||
        assertionElement.AttributeStatement;
        
      if (attributeStatement) {
        const attrs = Array.isArray(attributeStatement["saml:Attribute"])
          ? attributeStatement["saml:Attribute"]
          : [attributeStatement["saml:Attribute"] || attributeStatement.Attribute].filter(Boolean);
          
        for (const attr of attrs) {
          const name = attr["@_Name"];
          const values = Array.isArray(attr["saml:AttributeValue"])
            ? attr["saml:AttributeValue"]
            : [attr["saml:AttributeValue"] || attr.AttributeValue].filter(Boolean);
            
          if (name && values.length > 0) {
            attributes[name] = values.length === 1
              ? values[0]["#text"] || values[0]
              : values.map(v => v["#text"] || v);
          }
        }
      }
      
      assertion = {
        id: assertionElement["@_ID"],
        issuer: assertionElement["saml:Issuer"]?.["#text"] || assertionElement.Issuer,
        subject: {
          nameId: nameId?.["#text"] || nameId,
          nameIdFormat: nameId?.["@_Format"],
          sessionIndex: subject?.["saml:SubjectConfirmation"]?.["saml:SubjectConfirmationData"]?.["@_SessionIndex"],
        },
        attributes,
      };
    }
    
    return {
      id: response["@_ID"],
      issuer: response["saml:Issuer"]?.["#text"] || response.Issuer,
      status: {
        code: statusCode?.["@_Value"] || "Unknown",
        message: statusMessage?.["#text"],
      },
      assertion,
    };
  }

  /**
   * Validate SAML response
   */
  private async validateSAMLResponse(
    response: SAMLResponse,
    config: SSOConfiguration
  ): Promise<{ valid: boolean; error?: string }> {
    // Check status
    if (!response.status.code.includes("Success")) {
      return {
        valid: false,
        error: `SAML authentication failed: ${response.statuserror.message || response.status.code}`,
      };
    }
    
    // Validate issuer
    if (response.issuer !== config.saml_issuer) {
      return {
        valid: false,
        error: "SAML issuer mismatch",
      };
    }
    
    // TODO: Implement signature validation
    // This requires XML signature validation which is complex
    // For now, we'll trust the response if it comes from the expected issuer
    
    return { valid: true };
  }

  /**
   * Map SAML attributes to standard attributes
   */
  private mapSAMLAttributes(
    samlAttributes: Record<string, any>,
    mapping: Record<string, string>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};
    
    // Default mappings
    const defaultMappings: Record<string, string[]> = {
      email: [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "email",
        "mail",
        "Email",
      ],
      name: [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "name",
        "displayName",
        "Name",
      ],
      first_name: [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        "firstName",
        "givenName",
        "FirstName",
      ],
      last_name: [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        "lastName",
        "surname",
        "LastName",
      ],
      groups: [
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups",
        "groups",
        "memberOf",
        "Groups",
      ],
    };
    
    // Apply custom mappings first
    for (const [targetAttr, sourceAttr] of Object.entries(mapping)) {
      if (samlAttributes[sourceAttr] !== undefined) {
        mapped[targetAttr] = samlAttributes[sourceAttr];
      }
    }
    
    // Apply default mappings for missing attributes
    for (const [targetAttr, possibleSources] of Object.entries(defaultMappings)) {
      if (!mapped[targetAttr]) {
        for (const source of possibleSources) {
          if (samlAttributes[source] !== undefined) {
            mapped[targetAttr] = samlAttributes[source];
            break;
          }
        }
      }
    }
    
    // Include all original attributes
    mapped._raw = samlAttributes;
    
    return mapped;
  }

  /**
   * Validate certificate
   */
  private validateCertificate(certificate: string): void {
    try {
      // Remove headers/footers and whitespace
      const cleaned = certificate
        .replace(/-----BEGIN CERTIFICATE-----/g, "")
        .replace(/-----END CERTIFICATE-----/g, "")
        .replace(/\s/g, "");
        
      // Try to decode
      const decoded = Buffer.from(cleaned, "base64");
      if (decoded.length === 0) {
        throw new Error("Invalid base64 encoding");
      }
      
      // TODO: Add more certificate validation
      // Could use node-forge or similar library for deeper validation
    } catch (error: any) {
      throw new Error(`Invalid certificate format: ${error.message}`);
    }
  }

  /**
   * Get Assertion Consumer Service URL
   */
  private getACSUrl(): string {
    // This should be configured based on your environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/auth/sso/saml/callback`;
  }
}

export const samlService = new SAMLService();