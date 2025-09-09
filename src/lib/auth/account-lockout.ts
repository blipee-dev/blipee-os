/**
 * Account lockout mechanism to prevent brute force attacks
 */

import { createClient } from '@/lib/supabase/server';

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  resetWindow: number; // in minutes - window to reset attempt count
  progressiveLockout: boolean; // Increase lockout duration with each lockout
  lockoutMultiplier: number; // Multiplier for progressive lockout
  maxLockoutDuration: number; // Maximum lockout duration in minutes
}

export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  maxAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  resetWindow: 15, // Reset attempts after 15 minutes of no activity
  progressiveLockout: true,
  lockoutMultiplier: 2,
  maxLockoutDuration: 1440, // 24 hours max
};

export interface AccountLockoutStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndTime?: Date;
  lockoutDurationMinutes?: number;
  message: string;
}

/**
 * Account lockout service
 */
export class AccountLockoutService {
  private policy: LockoutPolicy;

  constructor(policy: LockoutPolicy = DEFAULT_LOCKOUT_POLICY) {
    this.policy = policy;
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(
    email: string,
    ipAddress?: string
  ): Promise<AccountLockoutStatus> {
    const supabase = await createClient();
    const now = new Date();
    
    // Check existing attempts
    const { data: existingAttempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .gte('created_at', new Date(now.getTime() - this.policy.resetWindow * 60000).toISOString())
      .order('created_at', { ascending: false });

    const recentAttempts = existingAttempts || [];
    const failedAttempts = recentAttempts.filter(a => !a.successful);
    
    // Check if account is currently locked
    const { data: lockoutRecord } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('email', email)
      .gte('lockout_until', now.toISOString())
      .single();

    if (lockoutRecord) {
      const lockoutEndTime = new Date(lockoutRecord.lockout_until);
      const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000);
      
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutEndTime,
        lockoutDurationMinutes: remainingMinutes,
        message: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
      };
    }

    // Record the new failed attempt
    await supabase.from('login_attempts').insert({
      email,
      ip_address: ipAddress,
      successful: false,
      created_at: now.toISOString(),
    });

    const newFailedCount = failedAttempts.length + 1;
    
    // Check if we need to lock the account
    if (newFailedCount >= this.policy.maxAttempts) {
      // Calculate lockout duration
      let lockoutMinutes = this.policy.lockoutDuration;
      
      if (this.policy.progressiveLockout) {
        // Get previous lockout count
        const { data: previousLockouts } = await supabase
          .from('account_lockouts')
          .select('*')
          .eq('email', email)
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60000).toISOString());
        
        const lockoutCount = (previousLockouts?.length || 0) + 1;
        lockoutMinutes = Math.min(
          this.policy.lockoutDuration * Math.pow(this.policy.lockoutMultiplier, lockoutCount - 1),
          this.policy.maxLockoutDuration
        );
      }
      
      const lockoutUntil = new Date(now.getTime() + lockoutMinutes * 60000);
      
      // Create lockout record
      await supabase.from('account_lockouts').insert({
        email,
        ip_address: ipAddress,
        lockout_until: lockoutUntil.toISOString(),
        attempt_count: newFailedCount,
        created_at: now.toISOString(),
      });
      
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutEndTime: lockoutUntil,
        lockoutDurationMinutes: lockoutMinutes,
        message: `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`,
      };
    }
    
    const attemptsRemaining = this.policy.maxAttempts - newFailedCount;
    
    return {
      isLocked: false,
      attemptsRemaining,
      message: `Invalid credentials. ${attemptsRemaining} attempts remaining.`,
    };
  }

  /**
   * Record a successful login
   */
  async recordSuccessfulLogin(
    email: string,
    ipAddress?: string
  ): Promise<void> {
    const supabase = await createClient();
    const now = new Date();
    
    // Record successful attempt
    await supabase.from('login_attempts').insert({
      email,
      ip_address: ipAddress,
      successful: true,
      created_at: now.toISOString(),
    });
    
    // Clear any active lockouts
    await supabase
      .from('account_lockouts')
      .update({ cleared_at: now.toISOString() })
      .eq('email', email)
      .is('cleared_at', null);
  }

  /**
   * Check if an account is locked
   */
  async checkLockoutStatus(email: string): Promise<AccountLockoutStatus> {
    const supabase = await createClient();
    const now = new Date();
    
    // Check for active lockout
    const { data: lockoutRecord } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('email', email)
      .gte('lockout_until', now.toISOString())
      .is('cleared_at', null)
      .single();

    if (lockoutRecord) {
      const lockoutEndTime = new Date(lockoutRecord.lockout_until);
      const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000);
      
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutEndTime,
        lockoutDurationMinutes: remainingMinutes,
        message: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
      };
    }
    
    // Check recent attempts
    const { data: recentAttempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .gte('created_at', new Date(now.getTime() - this.policy.resetWindow * 60000).toISOString())
      .eq('successful', false);
    
    const failedCount = recentAttempts?.length || 0;
    const attemptsRemaining = Math.max(0, this.policy.maxAttempts - failedCount);
    
    return {
      isLocked: false,
      attemptsRemaining,
      message: attemptsRemaining < this.policy.maxAttempts 
        ? `${attemptsRemaining} login attempts remaining.`
        : 'Account is not locked.',
    };
  }

  /**
   * Manually unlock an account (admin function)
   */
  async unlockAccount(email: string, adminId: string): Promise<void> {
    const supabase = await createClient();
    const now = new Date();
    
    // Clear lockouts
    await supabase
      .from('account_lockouts')
      .update({ 
        cleared_at: now.toISOString(),
        cleared_by: adminId,
      })
      .eq('email', email)
      .is('cleared_at', null);
    
    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: 'unlock_account',
      target_email: email,
      created_at: now.toISOString(),
    });
  }

  /**
   * Get lockout history for an account
   */
  async getLockoutHistory(email: string, days: number = 30) {
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const { data: lockouts } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('email', email)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    return lockouts || [];
  }
}

// Singleton instance
export const accountLockoutService = new AccountLockoutService();