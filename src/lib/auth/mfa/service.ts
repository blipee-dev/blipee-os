// MFA Service V2 - Enterprise-grade multi-factor authentication with proper encryption
import { createClient } from '@supabase/supabase-js';
import { TOTPService } from './totp';
import { MFASetup, MFAStatus, MFAVerification, MFAChallenge, MFADevice } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { EncryptionFactory } from '@/lib/security/encryption/factory';
import type { EncryptionService } from '@/lib/security/encryption/service';
import { smsMFAService } from './sms';
import { emailMFAService } from './email';

export class MFAService {
  private totp: TOTPService;
  private encryptionService: EncryptionService | null = null;
  
  constructor() {
    this.totp = new TOTPService();
  }

  /**
   * Get or initialize encryption service
   */
  private async getEncryption(): Promise<EncryptionService> {
    if (!this.encryptionService) {
      this.encryptionService = await EncryptionFactory.create();
    }
    return this.encryptionService;
  }

  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<MFASetup> {
    // Get user email
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    switch (method) {
      case 'totp':
        const setup = await this.totp.generateSecret(profile.email);
        const backupCodes = this.generateBackupCodes();
        
        const fullSetup: MFASetup = {
          ...setup,
          backupCodes,
        };

        // Store pending setup with encryption
        await this.storePendingMFASetup(userId, fullSetup);

        return fullSetup;

      case 'sms':
        return {
          method: 'sms',
          requiresPhoneNumber: true,
          message: 'SMS MFA requires phone number verification',
        };

      case 'email':
        return {
          method: 'email',
          requiresEmailAddress: true,
          message: 'Email MFA requires email address verification',
        };

      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }

  /**
   * Confirm MFA setup
   */
  async confirmMFASetup(userId: string, method: 'totp' | 'sms' | 'email', code: string): Promise<boolean> {
    // Get pending setup
    const pendingSetup = await this.getPendingMFASetup(userId);
    
    if (!pendingSetup || pendingSetup.method !== method) {
      throw new Error('No pending MFA setup found');
    }

    // Verify the code
    const isValid = this.totp.verifyToken(code, pendingSetup.secret!);
    
    if (!isValid) {
      return false;
    }

    // Store the confirmed setup
    await this.storeMFAConfig(userId, pendingSetup);
    
    // Clear pending setup
    await this.clearPendingMFASetup(userId);

    return true;
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
      .eq('enabled', true)
      .single();

    if (!mfaConfig) {
      return { success: false };
    }

    // Verify code
    const isValid = await this.verifyMFACode(
      verification.code, 
      mfaConfig.secret,
      challenge.user_id
    );

    if (isValid) {
      // Delete challenge
      await this.deleteChallenge(challengeId);
      
      // Update last used
      await supabaseAdmin
        .from('user_mfa_config')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', mfaConfig.id);

      // Handle device trust if requested
      if (verification.rememberDevice) {
        await this.trustDevice(challenge.user_id, verification.rememberDevice);
      }

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
      .eq('user_id', userId)
      .eq('enabled', true);

    const methods = configs?.map((c: any) => c.method as 'totp' | 'sms' | 'email') || [];
    const primaryMethod = configs?.find((c: any) => c.is_primary)?.method as 'totp' | 'sms' | 'email' | undefined;

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
    // Disable all MFA configs
    await supabaseAdmin
      .from('user_mfa_config')
      .update({ enabled: false })
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

    // Update user profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ two_factor_enabled: false })
      .eq('id', userId);

    // Clean up any pending challenges
    await supabaseAdmin
      .from('mfa_challenges')
      .delete()
      .eq('user_id', userId);
  }

  /**
   * Trust a device
   */
  private async trustDevice(userId: string, rememberDevice: boolean): Promise<void> {
    if (!rememberDevice) return;
    
    const deviceId = crypto.randomUUID();
    const deviceName = 'Web Browser'; // Could be enhanced with user agent parsing
    
    await supabaseAdmin
      .from('user_devices')
      .insert({
        id: deviceId,
        user_id: userId,
        name: deviceName,
        type: 'web',
        is_trusted: true,
        last_used_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const codeHash = this.hashBackupCode(code);
    
    // Check if code exists and hasn't been used
    const { data: backupCode } = await supabaseAdmin
      .from('user_backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code_hash', codeHash)
      .is('used_at', null)
      .single();

    if (!backupCode) {
      return false;
    }

    // Mark code as used
    await supabaseAdmin
      .from('user_backup_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', backupCode.id);

    return true;
  }

  // Private helper methods
  private async storePendingMFASetup(userId: string, setup: MFASetup): Promise<void> {
    const encryption = await this.getEncryption();
    const encryptedData = await encryption.encrypt(setup.secret!, { userId, purpose: 'mfa-setup' });
    
    await supabaseAdmin
      .from('pending_mfa_setups')
      .upsert({
        user_id: userId,
        method: setup.method,
        secret: JSON.stringify(encryptedData),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      });
  }

  private async getPendingMFASetup(userId: string): Promise<MFASetup | null> {
    const { data: _data } = await supabaseAdmin
      .from('pending_mfa_setups')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) return null;

    const encryption = await this.getEncryption();
    const encryptedData = JSON.parse(data.secret);
    const secret = await encryption.decrypt(encryptedData);

    return {
      method: data.method,
      secret,
    };
  }

  private async clearPendingMFASetup(userId: string): Promise<void> {
    await supabaseAdmin
      .from('pending_mfa_setups')
      .delete()
      .eq('user_id', userId);
  }

  private async storeMFAConfig(userId: string, setup: MFASetup): Promise<void> {
    const encryption = await this.getEncryption();
    const encryptedSecret = await encryption.encrypt(setup.secret!, { userId, purpose: 'mfa-secret' });
    
    // Store main config
    await supabaseAdmin
      .from('user_mfa_config')
      .insert({
        user_id: userId,
        method: setup.method,
        secret: JSON.stringify(encryptedSecret),
        is_primary: true,
        enabled: true,
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

    // Update user profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ two_factor_enabled: true })
      .eq('id', userId);
  }

  private async deleteChallenge(challengeId: string): Promise<void> {
    await supabaseAdmin
      .from('mfa_challenges')
      .delete()
      .eq('id', challengeId);
  }

  private async verifyMFACode(code: string, encryptedSecret: string, userId: string): Promise<boolean> {
    const encryption = await this.getEncryption();
    
    // Handle both old and new encryption formats
    let secret: string;
    try {
      const encryptedData = JSON.parse(encryptedSecret);
      secret = await encryption.decrypt(encryptedData);
    } catch (e) {
      // Might be old format, migrate it
      const migrated = await this.migrateEncryptedSecret(encryptedSecret, userId);
      const encryptedData = JSON.parse(migrated);
      secret = await encryption.decrypt(encryptedData);
      
      // Update the stored secret
      await supabaseAdmin
        .from('user_mfa_config')
        .update({ secret: migrated })
        .eq('user_id', userId);
    }
    
    return this.totp.verifyToken(code, secret);
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
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

  /**
   * Send SMS verification code
   */
  async sendSMSCode(
    userId: string,
    phoneNumber: string,
    purpose: 'mfa' | 'recovery' = 'mfa'
  ): Promise<{ success: boolean; codeId: string; message: string }> {
    return await smsMFAService.sendVerificationCode(userId, phoneNumber, purpose);
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(
    codeId: string,
    code: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; phoneNumber?: string }> {
    return await smsMFAService.verifyCode(codeId, code, userId);
  }

  /**
   * Add phone number for SMS MFA
   */
  async addPhoneNumber(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    return await smsMFAService.addUserPhoneNumber(userId, phoneNumber);
  }

  /**
   * Verify and save phone number
   */
  async verifyAndSavePhoneNumber(
    userId: string,
    verificationId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    return await smsMFAService.verifyAndSavePhoneNumber(userId, verificationId, code);
  }

  /**
   * Send email verification code
   */
  async sendEmailCode(
    userId: string,
    email: string,
    purpose: 'mfa' | 'recovery' = 'mfa'
  ): Promise<{ success: boolean; codeId: string; message: string }> {
    return await emailMFAService.sendVerificationCode(userId, email, purpose);
  }

  /**
   * Verify email code
   */
  async verifyEmailCode(
    codeId: string,
    code: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; email?: string }> {
    return await emailMFAService.verifyCode(codeId, code, userId);
  }

  /**
   * Add email for email MFA
   */
  async addEmail(
    userId: string,
    email: string
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    return await emailMFAService.addUserEmail(userId, email);
  }

  /**
   * Verify and save email
   */
  async verifyAndSaveEmail(
    userId: string,
    verificationId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    return await emailMFAService.verifyAndSaveEmail(userId, verificationId, code);
  }

  /**
   * Get user phone numbers
   */
  async getUserPhoneNumbers(userId: string): Promise<string[]> {
    return await smsMFAService.getUserPhoneNumbers(userId);
  }

  /**
   * Get user emails
   */
  async getUserEmails(userId: string): Promise<string[]> {
    return await emailMFAService.getUserEmails(userId);
  }

  // Migration helper for old encryption format
  private async migrateEncryptedSecret(encryptedSecret: string, userId: string): Promise<string> {
    // Decrypt with old method
    const key = process.env.MFA_ENCRYPTION_KEY || 'default-encryption-key-change-me';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    
    if (encryptedSecret.includes(':')) {
      // Format with IV
      const [ivHex, encrypted] = encryptedSecret.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Re-encrypt with new method
      const encryption = await this.getEncryption();
      const newEncrypted = await encryption.encrypt(decrypted, { userId, purpose: 'mfa-secret' });
      
      return JSON.stringify(newEncrypted);
    } else {
      // Old format without IV
      const decipher = crypto.createDecipher('aes-256-cbc', process.env.MFA_ENCRYPTION_KEY || 'default-key');
      let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Re-encrypt with new method
      const encryption = await this.getEncryption();
      const newEncrypted = await encryption.encrypt(decrypted, { userId, purpose: 'mfa-secret' });
      
      return JSON.stringify(newEncrypted);
    }
  }
}

// Default export for convenience
export const mfaService = new MFAService();