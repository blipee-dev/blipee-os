// MFA Service - Main service for managing multi-factor authentication
import { createClient } from '@supabase/supabase-js';
import { TOTPService } from './totp';
import { MFASetup, MFAStatus, MFAVerification, MFAChallenge, MFADevice } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { EncryptionFactory } from '@/lib/security/encryption/factory';
import type { EncryptionService } from '@/lib/security/encryption/service';

export class MFAService {
  private totp: TOTPService;
  
  constructor() {
    this.totp = new TOTPService();
  }

  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string, method: 'totp'): Promise<MFASetup> {
    // Get user email
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User not found');
    }

    // Generate setup based on method
    let setup: MFASetup;
    
    switch (method) {
      case 'totp':
        setup = await this.totp.generateSecret(profile.email);
        
        // Store encrypted secret temporarily
        await this.storePendingMFASetup(userId, setup);
        break;
        
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }

    // Generate backup codes
    const backupCodes = this.totp.generateBackupCodes(10);
    setup.backupCodes = this.totp.formatBackupCodes(backupCodes);

    return setup;
  }

  /**
   * Confirm MFA setup with verification code
   */
  async confirmMFASetup(userId: string, verification: MFAVerification): Promise<boolean> {
    // Get pending setup
    const setup = await this.getPendingMFASetup(userId);
    if (!setup) {
      throw new Error('No pending MFA setup found');
    }

    // Verify the code
    const isValid = await this.verifyMFACode(verification.code, setup.secret!);
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Store MFA configuration
    await this.storeMFAConfig(userId, setup);
    
    // Clear pending setup
    await this.clearPendingMFASetup(userId);

    // Update user profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ 
        two_factor_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return true;
  }

  /**
   * Verify MFA code
   */
  async verifyMFACode(code: string, secret: string): Promise<boolean> {
    // Check if it's a TOTP code
    if (code.length === 6 && /^\d+$/.test(code)) {
      return this.totp.verifyToken(code, secret);
    }
    
    // Check if it's a backup code
    // TODO: Implement backup code verification
    
    return false;
  }

  /**
   * Create MFA challenge for login
   */
  async createChallenge(userId: string): Promise<MFAChallenge> {
    const status = await this.getMFAStatus(userId);
    
    if (!status.enabled) {
      throw new Error('MFA not enabled for user');
    }

    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store challenge in database
    await supabaseAdmin
      .from('mfa_challenges')
      .insert({
        id: challengeId,
        user_id: userId,
        methods: status.methods,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    return {
      challengeId,
      methods: status.methods,
      expiresAt,
    };
  }

  /**
   * Verify MFA challenge
   */
  async verifyChallenge(
    challengeId: string, 
    verification: MFAVerification
  ): Promise<{ success: boolean; userId?: string }> {
    // Get challenge
    const { data: challenge } = await supabaseAdmin
      .from('mfa_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { success: false };
    }

    // Check expiration
    if (new Date(challenge.expires_at) < new Date()) {
      await this.deleteChallenge(challengeId);
      return { success: false };
    }

    // Get user's MFA config
    const { data: mfaConfig } = await supabaseAdmin
      .from('user_mfa_config')
      .select('*')
      .eq('user_id', challenge.user_id)
      .eq('method', verification.method)
      .single();

    if (!mfaConfig) {
      return { success: false };
    }

    // Verify code
    const isValid = await this.verifyMFACode(
      verification.code, 
      mfaConfig.secret
    );

    if (isValid) {
      // Delete challenge
      await this.deleteChallenge(challengeId);
      
      // Update last used
      await supabaseAdmin
        .from('user_mfa_config')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', mfaConfig.id);

      return { success: true, userId: challenge.user_id };
    }

    // Increment attempts
    await supabaseAdmin
      .from('mfa_challenges')
      .update({ 
        attempts: (challenge.attempts || 0) + 1 
      })
      .eq('id', challengeId);

    return { success: false };
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();

    if (!profile?.two_factor_enabled) {
      return {
        enabled: false,
        methods: [],
        devices: [],
        backupCodesRemaining: 0,
      };
    }

    // Get MFA methods
    const { data: configs } = await supabaseAdmin
      .from('user_mfa_config')
      .select('method, is_primary')
      .eq('user_id', userId);

    const methods = configs?.map((c: any) => c.method as 'totp') || [];
    const primaryMethod = configs?.find((c: any) => c.is_primary)?.method as 'totp' | undefined;

    // Get backup codes count
    const { count: backupCodesRemaining } = await supabaseAdmin
      .from('user_backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('used_at', null);

    // Get trusted devices
    const { data: devices } = await supabaseAdmin
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    const mfaDevices: MFADevice[] = devices?.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      lastUsed: new Date(d.last_used_at),
      trusted: d.is_trusted,
    })) || [];

    return {
      enabled: true,
      methods,
      primaryMethod,
      devices: mfaDevices,
      backupCodesRemaining: backupCodesRemaining || 0,
    };
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string): Promise<void> {
    // Delete all MFA configs
    await supabaseAdmin
      .from('user_mfa_config')
      .delete()
      .eq('user_id', userId);

    // Delete backup codes
    await supabaseAdmin
      .from('user_backup_codes')
      .delete()
      .eq('user_id', userId);

    // Delete trusted devices
    await supabaseAdmin
      .from('user_devices')
      .delete()
      .eq('user_id', userId);

    // Update profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ 
        two_factor_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }

  // Private helper methods
  private async storePendingMFASetup(userId: string, setup: MFASetup): Promise<void> {
    await supabaseAdmin
      .from('pending_mfa_setups')
      .upsert({
        user_id: userId,
        method: setup.method,
        secret: this.encryptSecret(setup.secret!),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      });
  }

  private async getPendingMFASetup(userId: string): Promise<MFASetup | null> {
    const { data } = await supabaseAdmin
      .from('pending_mfa_setups')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) return null;

    return {
      method: data.method,
      secret: this.decryptSecret(data.secret),
    };
  }

  private async clearPendingMFASetup(userId: string): Promise<void> {
    await supabaseAdmin
      .from('pending_mfa_setups')
      .delete()
      .eq('user_id', userId);
  }

  private async storeMFAConfig(userId: string, setup: MFASetup): Promise<void> {
    // Store main config
    await supabaseAdmin
      .from('user_mfa_config')
      .insert({
        user_id: userId,
        method: setup.method,
        secret: this.encryptSecret(setup.secret!),
        is_primary: true,
        created_at: new Date().toISOString(),
      });

    // Store backup codes
    if (setup.backupCodes) {
      const backupCodes = setup.backupCodes.map((code: string) => ({
        user_id: userId,
        code_hash: this.hashBackupCode(code),
        created_at: new Date().toISOString(),
      }));

      await supabaseAdmin
        .from('user_backup_codes')
        .insert(backupCodes);
    }
  }

  private async deleteChallenge(challengeId: string): Promise<void> {
    await supabaseAdmin
      .from('mfa_challenges')
      .delete()
      .eq('id', challengeId);
  }

  // Encryption helpers (simplified - use proper KMS in production)
  private encryptSecret(secret: string): string {
    // In production, use AWS KMS or similar
    const cipher = crypto.createCipher('aes-256-cbc', process.env.MFA_ENCRYPTION_KEY || 'default-key');
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptSecret(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.MFA_ENCRYPTION_KEY || 'default-key');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Clean up expired challenges
   */
  async cleanupChallenges() {
    const { error } = await supabaseAdmin
      .from('mfa_challenges')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to cleanup challenges:', error);
    }
  }
}