import { createClient } from '@/lib/supabase/client';
import { getAuditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { getRateLimitService } from '@/lib/security/rate-limit/service';
import { getEncryptionService } from '@/lib/security/encryption/factory';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  WebAuthnCredential,
  WebAuthnChallenge,
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions,
  WebAuthnRegistrationResponse,
  WebAuthnAuthenticationResponse,
  WebAuthnVerificationResult,
  WebAuthnStats,
  WebAuthnConfig,
  WEBAUTHN_ALGORITHMS,
  KNOWN_AAGUIDS,
} from './types';

const DEFAULT_CONFIG: WebAuthnConfig = {
  rpName: 'blipee OS',
  rpId: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost',
  origin: process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || 'http://localhost:3000',
  timeout: 60000, // 1 minute
  challengeTTL: 5 * 60, // 5 minutes
  maxCredentialsPerUser: 10,
  requireUserVerification: true,
  allowedAAGUIDs: [], // Empty means all allowed
  blockedAAGUIDs: [], // Explicitly blocked AAGUIDs
};

export class WebAuthnService {
  private config: WebAuthnConfig;
  private supabase = createClient();
  private rateLimiter = getRateLimitService();
  private auditService = getAuditService();

  constructor(config: Partial<WebAuthnConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate registration options for WebAuthn
   */
  async generateRegistrationOptions(
    request: NextRequest,
    userId: string,
    userEmail: string,
    userDisplayName: string,
    options: {
      authenticatorSelection?: {
        authenticatorAttachment?: 'platform' | 'cross-platform';
        requireResidentKey?: boolean;
        residentKey?: 'discouraged' | 'preferred' | 'required';
        userVerification?: 'required' | 'preferred' | 'discouraged';
      };
      excludeCredentials?: boolean;
    } = {}
  ): Promise<WebAuthnRegistrationOptions> {
    // Rate limiting
    const rateLimitResult = await this.rateLimiter.check(
      `webauthn_registration:${userId}`,
      'webauthn_registration'
    );

    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded for WebAuthn registration');
    }

    // Generate challenge
    const challenge = this.generateChallenge();

    // Store challenge in database
    await this.storeChallenge(userId, challenge, 'registration');

    // Get existing credentials for exclusion
    let excludeCredentials: Array<{
      id: string;
      type: 'public-key';
      transports?: AuthenticatorTransport[];
    }> = [];

    if (options.excludeCredentials !== false) {
      const existingCredentials = await this.getUserCredentials(userId);
      excludeCredentials = existingCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports,
      }));
    }

    const registrationOptions: WebAuthnRegistrationOptions = {
      challenge,
      rp: {
        name: this.config.rpName,
        id: this.config.rpId,
      },
      user: {
        id: userId,
        name: userEmail,
        displayName: userDisplayName,
      },
      pubKeyCredParams: WEBAUTHN_ALGORITHMS.map(alg => ({
        alg,
        type: 'public-key' as const,
      })),
      timeout: this.config.timeout,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: options.authenticatorSelection?.authenticatorAttachment,
        requireResidentKey: options.authenticatorSelection?.requireResidentKey || false,
        residentKey: options.authenticatorSelection?.residentKey || 'preferred',
        userVerification: options.authenticatorSelection?.userVerification || 
                         (this.config.requireUserVerification ? 'required' : 'preferred'),
      },
      excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined,
    };

    // Audit log
    await this.auditService.log({
      type: AuditEventType.MFA_WEBAUTHN_REGISTRATION_STARTED,
      severity: AuditEventSeverity.INFO,
      actor: {
        type: 'user',
        id: userId,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      context: {},
      metadata: {
        authenticatorAttachment: options.authenticatorSelection?.authenticatorAttachment,
        excludeCredentialsCount: excludeCredentials.length,
      },
      result: 'success',
    });

    return registrationOptions;
  }

  /**
   * Verify WebAuthn registration response
   */
  async verifyRegistration(
    request: NextRequest,
    userId: string,
    credentialName: string,
    registrationResponse: WebAuthnRegistrationResponse
  ): Promise<WebAuthnVerificationResult> {
    try {
      // Get stored challenge
      const challenge = await this.getChallenge(userId, 'registration');
      if (!challenge) {
        throw new Error('No valid challenge found');
      }

      // Verify challenge hasn't expired
      if (new Date() > challenge.expiresAt) {
        await this.deleteChallenge(challenge.id);
        throw new Error('Challenge has expired');
      }

      // Basic verification - decode client data
      const clientDataJSON = JSON.parse(
        Buffer.from(registrationResponse.response.clientDataJSON, 'base64').toString()
      );

      // Verify challenge matches
      if (clientDataJSON.challenge !== challenge.challenge) {
        throw new Error('Challenge mismatch');
      }

      // Verify origin
      if (clientDataJSON.origin !== this.config.origin) {
        throw new Error('Origin mismatch');
      }

      // Verify type
      if (clientDataJSON.type !== 'webauthn.create') {
        throw new Error('Invalid ceremony type');
      }

      // Decode attestation object (simplified verification)
      const attestationObject = Buffer.from(
        registrationResponse.response.attestationObject,
        'base64'
      );

      // For production, you'd use a proper WebAuthn library like @simplewebauthn/server
      // This is a simplified implementation
      const credentialId = registrationResponse.id;
      const publicKey = this.extractPublicKey(attestationObject);
      const aaguid = this.extractAAGUID(attestationObject);

      // Check if credential already exists
      const existingCredential = await this.getCredentialById(credentialId);
      if (existingCredential) {
        throw new Error('Credential already registered');
      }

      // Check user credential limit
      const userCredentials = await this.getUserCredentials(userId);
      if (userCredentials.length >= this.config.maxCredentialsPerUser) {
        throw new Error('Maximum number of credentials reached');
      }

      // Check AAGUID against allowlist/blocklist
      if (this.config.blockedAAGUIDs?.includes(aaguid)) {
        throw new Error('Authenticator not allowed');
      }

      if (this.config.allowedAAGUIDs && this.config.allowedAAGUIDs.length > 0 && !this.config.allowedAAGUIDs.includes(aaguid)) {
        throw new Error('Authenticator not in allowlist');
      }

      // Store credential
      const credential: Omit<WebAuthnCredential, 'id'> = {
        userId,
        credentialId,
        publicKey,
        counter: 0,
        aaguid,
        name: credentialName,
        deviceType: this.determineDeviceType(aaguid),
        backupEligible: false, // Would be extracted from flags
        backupState: false,
        transports: registrationResponse.response.transports || [],
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true,
      };

      await this.storeCredential(credential);

      // Clean up challenge
      await this.deleteChallenge(challenge.id);

      // Audit log
      await this.auditService.log({
        type: AuditEventType.MFA_WEBAUTHN_REGISTERED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: userId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        context: {},
        metadata: {
          credentialId,
          credentialName,
          aaguid,
          deviceType: credential.deviceType,
        },
        result: 'success',
      });

      return {
        verified: true,
        credentialId,
      };
    } catch (error) {
      // Audit log failure
      await this.auditService.log({
        type: AuditEventType.MFA_WEBAUTHN_REGISTRATION_FAILED,
        severity: AuditEventSeverity.WARNING,
        actor: {
          type: 'user',
          id: userId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        context: {},
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate authentication options for WebAuthn
   */
  async generateAuthenticationOptions(
    request: NextRequest,
    userId?: string,
    options: {
      allowCredentials?: string[];
      userVerification?: 'required' | 'preferred' | 'discouraged';
    } = {}
  ): Promise<WebAuthnAuthenticationOptions> {
    // Rate limiting
    const rateLimitKey = userId ? `webauthn_auth:${userId}` : `webauthn_auth:${request.ip}`;
    const rateLimitResult = await this.rateLimiter.check(rateLimitKey, 'webauthn_auth');

    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded for WebAuthn authentication');
    }

    // Generate challenge
    const challenge = this.generateChallenge();

    // Store challenge
    await this.storeChallenge(userId || 'anonymous', challenge, 'authentication');

    // Get allowed credentials
    let allowCredentials: Array<{
      id: string;
      type: 'public-key';
      transports?: AuthenticatorTransport[];
    }> = [];

    if (userId) {
      const userCredentials = await this.getUserCredentials(userId);
      allowCredentials = userCredentials
        .filter(cred => cred.isActive)
        .filter(cred => !options.allowCredentials || options.allowCredentials.includes(cred.id))
        .map(cred => ({
          id: cred.credentialId,
          type: 'public-key' as const,
          transports: cred.transports,
        }));
    }

    return {
      challenge,
      timeout: this.config.timeout,
      rpId: this.config.rpId,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: options.userVerification || 
                       (this.config.requireUserVerification ? 'required' : 'preferred'),
    };
  }

  /**
   * Verify WebAuthn authentication response
   */
  async verifyAuthentication(
    request: NextRequest,
    authenticationResponse: WebAuthnAuthenticationResponse,
    userId?: string
  ): Promise<WebAuthnVerificationResult> {
    try {
      // Get stored challenge
      const challenge = await this.getChallenge(userId || 'anonymous', 'authentication');
      if (!challenge) {
        throw new Error('No valid challenge found');
      }

      // Verify challenge hasn't expired
      if (new Date() > challenge.expiresAt) {
        await this.deleteChallenge(challenge.id);
        throw new Error('Challenge has expired');
      }

      // Get credential
      const credential = await this.getCredentialById(authenticationResponse.id);
      if (!credential) {
        throw new Error('Credential not found');
      }

      if (!credential.isActive) {
        throw new Error('Credential is disabled');
      }

      // Verify user matches (if provided)
      if (userId && credential.userId !== userId) {
        throw new Error('Credential does not belong to user');
      }

      // Decode client data
      const clientDataJSON = JSON.parse(
        Buffer.from(authenticationResponse.response.clientDataJSON, 'base64').toString()
      );

      // Verify challenge matches
      if (clientDataJSON.challenge !== challenge.challenge) {
        throw new Error('Challenge mismatch');
      }

      // Verify origin
      if (clientDataJSON.origin !== this.config.origin) {
        throw new Error('Origin mismatch');
      }

      // Verify type
      if (clientDataJSON.type !== 'webauthn.get') {
        throw new Error('Invalid ceremony type');
      }

      // Decode authenticator data
      const authenticatorData = Buffer.from(
        authenticationResponse.response.authenticatorData,
        'base64'
      );

      // Extract counter from authenticator data
      const counter = authenticatorData.readUInt32BE(33);

      // Verify counter (replay protection)
      if (counter <= credential.counter) {
        throw new Error('Counter value indicates replay attack');
      }

      // Verify signature (simplified - in production use proper WebAuthn library)
      const signature = Buffer.from(authenticationResponse.response.signature, 'base64');
      const clientDataHash = crypto
        .createHash('sha256')
        .update(Buffer.from(authenticationResponse.response.clientDataJSON, 'base64'))
        .digest();

      const signedData = Buffer.concat([authenticatorData, clientDataHash]);
      const isValidSignature = this.verifySignature(
        credential.publicKey,
        signedData,
        signature
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Update credential counter and last used
      await this.updateCredentialCounter(credential.id, counter);

      // Clean up challenge
      await this.deleteChallenge(challenge.id);

      // Audit log
      await this.auditService.log({
        type: AuditEventType.MFA_WEBAUTHN_VERIFIED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: credential.userId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        context: {},
        metadata: {
          credentialId: credential.id,
          credentialName: credential.name,
          newCounter: counter,
        },
        result: 'success',
      });

      return {
        verified: true,
        credentialId: credential.id,
        newCounter: counter,
      };
    } catch (error) {
      // Audit log failure
      await this.auditService.log({
        type: AuditEventType.MFA_WEBAUTHN_VERIFICATION_FAILED,
        severity: AuditEventSeverity.WARNING,
        actor: {
          type: 'user',
          id: userId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        context: {},
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's WebAuthn credentials
   */
  async getUserCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const { data, error } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user credentials: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a WebAuthn credential
   */
  async deleteCredential(
    request: NextRequest,
    credentialId: string,
    userId: string
  ): Promise<void> {
    const { error: _error } = await this.supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete credential: ${error.message}`);
    }

    // Audit log
    await this.auditService.log({
      type: AuditEventType.MFA_WEBAUTHN_CREDENTIAL_DELETED,
      severity: AuditEventSeverity.INFO,
      actor: {
        type: 'user',
        id: userId,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      context: {},
      metadata: {
        credentialId,
      },
      result: 'success',
    });
  }

  /**
   * Get WebAuthn statistics
   */
  async getStats(): Promise<WebAuthnStats> {
    const { data, error } = await this.supabase
      .from('webauthn_credentials')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch WebAuthn stats: ${error.message}`);
    }

    const credentials = data || [];
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const deviceTypeCounts = credentials.reduce((acc, cred) => {
      const deviceType = this.getDeviceTypeDisplay(cred.aaguid);
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCredentials: credentials.length,
      activeCredentials: credentials.filter(c => c.is_active).length,
      platformCredentials: credentials.filter(c => c.device_type === 'platform').length,
      crossPlatformCredentials: credentials.filter(c => c.device_type === 'cross-platform').length,
      recentAuthenticationsCount: credentials.filter(c => new Date(c.last_used) > recentThreshold).length,
      topDeviceTypes: Object.entries(deviceTypeCounts)
        .map(([type, count]) => ({ type, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }

  // Private helper methods

  private generateChallenge(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private async storeChallenge(
    userId: string,
    challenge: string,
    type: 'registration' | 'authentication'
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.config.challengeTTL * 1000);

    const { error: _error } = await this.supabase
      .from('webauthn_challenges')
      .insert({
        challenge,
        user_id: userId,
        expires_at: expiresAt,
        type,
      });

    if (error) {
      throw new Error(`Failed to store challenge: ${error.message}`);
    }
  }

  private async getChallenge(
    userId: string,
    type: 'registration' | 'authentication'
  ): Promise<WebAuthnChallenge | null> {
    const { data, error } = await this.supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      challenge: data.challenge,
      userId: data.user_id,
      expiresAt: new Date(data.expires_at),
      type: data.type,
      metadata: data.metadata,
    };
  }

  private async deleteChallenge(challengeId: string): Promise<void> {
    await this.supabase
      .from('webauthn_challenges')
      .delete()
      .eq('id', challengeId);
  }

  private async storeCredential(credential: Omit<WebAuthnCredential, 'id'>): Promise<void> {
    const { error: _error } = await this.supabase
      .from('webauthn_credentials')
      .insert({
        user_id: credential.userId,
        credential_id: credential.credentialId,
        public_key: credential.publicKey,
        counter: credential.counter,
        aaguid: credential.aaguid,
        name: credential.name,
        device_type: credential.deviceType,
        backup_eligible: credential.backupEligible,
        backup_state: credential.backupState,
        transports: credential.transports,
        created_at: credential.createdAt,
        last_used: credential.lastUsed,
        is_active: credential.isActive,
      });

    if (error) {
      throw new Error(`Failed to store credential: ${error.message}`);
    }
  }

  private async getCredentialById(credentialId: string): Promise<WebAuthnCredential | null> {
    const { data, error } = await this.supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      credentialId: data.credential_id,
      publicKey: data.public_key,
      counter: data.counter,
      aaguid: data.aaguid,
      name: data.name,
      deviceType: data.device_type,
      backupEligible: data.backup_eligible,
      backupState: data.backup_state,
      transports: data.transports,
      createdAt: new Date(data.created_at),
      lastUsed: new Date(data.last_used),
      isActive: data.is_active,
    };
  }

  private async updateCredentialCounter(credentialId: string, counter: number): Promise<void> {
    const { error: _error } = await this.supabase
      .from('webauthn_credentials')
      .update({
        counter,
        last_used: new Date(),
      })
      .eq('id', credentialId);

    if (error) {
      throw new Error(`Failed to update credential counter: ${error.message}`);
    }
  }

  private extractPublicKey(attestationObject: Buffer): string {
    // Simplified extraction - in production use proper CBOR decoding
    // This is a placeholder that would need proper implementation
    return crypto.randomBytes(32).toString('base64');
  }

  private extractAAGUID(attestationObject: Buffer): string {
    // Simplified extraction - in production use proper CBOR decoding
    // This is a placeholder that would need proper implementation
    return crypto.randomBytes(16).toString('hex');
  }

  private determineDeviceType(aaguid: string): 'platform' | 'cross-platform' {
    // Check known platform authenticators
    const platformAAGUIDs: string[] = [
      KNOWN_AAGUIDS['windows-hello'],
      KNOWN_AAGUIDS['touch-id'],
      KNOWN_AAGUIDS['face-id'],
    ];

    return platformAAGUIDs.includes(aaguid) ? 'platform' : 'cross-platform';
  }

  private getDeviceTypeDisplay(aaguid: string): string {
    for (const [name, id] of Object.entries(KNOWN_AAGUIDS)) {
      if (id === aaguid) {
        return name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    return 'Unknown Device';
  }

  private verifySignature(publicKey: string, data: Buffer, signature: Buffer): boolean {
    // Simplified signature verification - in production use proper cryptographic verification
    // This is a placeholder that would need proper implementation with the actual public key
    return true;
  }
}

export const webAuthnService = new WebAuthnService();