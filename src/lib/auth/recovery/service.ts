import { createClient } from '@/lib/supabase/client';
import { auditLogger } from '@/lib/audit/logger';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { getEncryptionService } from '@/lib/security/encryption/factory';
import { getRateLimitService } from '@/lib/security/rate-limit/service';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import {
  RecoveryMethod,
  RecoveryToken,
  RecoveryTokenType,
  RecoveryStatus,
  RecoveryRequest,
  RecoveryVerification,
  RecoveryConfig,
  SecurityQuestion,
  RecoveryStats,
} from './types';

const DEFAULT_CONFIG: RecoveryConfig = {
  tokenTTL: 15 * 60, // 15 minutes
  maxAttempts: 3,
  requireMultipleFactors: false,
  allowedMethods: [RecoveryMethod.EMAIL, RecoveryMethod.SECURITY_QUESTIONS],
  emailConfig: {
    from: 'security@blipee.ai',
    template: 'password-reset',
    subject: 'Password Reset Request',
  },
  securityQuestions: {
    minQuestions: 3,
    maxQuestions: 5,
    minCorrectAnswers: 2,
  },
};

export class AccountRecoveryService {
  private config: RecoveryConfig;
  private supabase = createClient();
  private rateLimiter = getRateLimitService();

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initiate account recovery
   */
  async initiateRecovery(
    request: NextRequest,
    recoveryRequest: RecoveryRequest
  ): Promise<{ success: boolean; message: string; requiresVerification?: boolean }> {
    try {
      // Rate limiting
      const rateLimitResult = await this.rateLimiter.check(
        `recovery:${recoveryRequest.email}`,
        'auth:reset'
      );

      if (!rateLimitResult.allowed) {
        await auditLogger.logSecurityEvent(
          request,
          'rate_limit',
          {
            action: 'password_reset_attempt',
            email: recoveryRequest.email,
            method: recoveryRequest.method,
          },
          AuditEventSeverity.WARNING
        );

        return {
          success: false,
          message: 'Too many recovery attempts. Please try again later.',
        };
      }

      // Find user by email
      const { data: user, error } = await this.supabase
        .from('user_profiles')
        .select('id, email, metadata')
        .eq('email', recoveryRequest.email)
        .single();

      if (error || !user) {
        // Don't reveal if email exists - security best practice
        await auditLogger.logSecurityEvent(
          request,
          'suspicious_activity',
          {
            action: 'password_reset_unknown_email',
            email: recoveryRequest.email,
          },
          AuditEventSeverity.WARNING
        );

        return {
          success: true,
          message: 'If the email exists, recovery instructions have been sent.',
        };
      }

      // Check if method is allowed
      if (!this.config.allowedMethods.includes(recoveryRequest.method)) {
        return {
          success: false,
          message: 'Recovery method not allowed.',
        };
      }

      // Process based on method
      switch (recoveryRequest.method) {
        case RecoveryMethod.EMAIL:
          return await this.initiateEmailRecovery(request, user, recoveryRequest);

        case RecoveryMethod.SMS:
          return await this.initiateSMSRecovery(request, user, recoveryRequest);

        case RecoveryMethod.SECURITY_QUESTIONS:
          return await this.initiateSecurityQuestionRecovery(request, user, recoveryRequest);

        case RecoveryMethod.BACKUP_CODES:
          return await this.initiateBackupCodeRecovery(request, user, recoveryRequest);

        case RecoveryMethod.ADMIN_OVERRIDE:
          return await this.initiateAdminOverride(request, user, recoveryRequest);

        default:
          return {
            success: false,
            message: 'Invalid recovery method.',
          };
      }
    } catch (error) {
      console.error('Recovery initiation error:', error);
      return {
        success: false,
        message: 'An error occurred during recovery initiation.',
      };
    }
  }

  /**
   * Verify recovery token and complete recovery
   */
  async verifyRecovery(
    request: NextRequest,
    verification: RecoveryVerification
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      // Get recovery token
      const recoveryToken = await this.getRecoveryToken(verification.token);
      if (!recoveryToken) {
        await auditLogger.logSecurityEvent(
          request,
          'suspicious_activity',
          {
            action: 'invalid_recovery_token',
            token: verification.token.substring(0, 8) + '...',
          },
          AuditEventSeverity.WARNING
        );

        return {
          success: false,
          message: 'Invalid or expired recovery token.',
        };
      }

      // Check if token is valid
      if (recoveryToken.status !== RecoveryStatus.PENDING) {
        return {
          success: false,
          message: 'Recovery token has already been used or is invalid.',
        };
      }

      if (recoveryToken.expiresAt < new Date()) {
        await this.updateTokenStatus(recoveryToken.id, RecoveryStatus.EXPIRED);
        return {
          success: false,
          message: 'Recovery token has expired. Please request a new one.',
        };
      }

      if (recoveryToken.currentAttempts >= recoveryToken.maxAttempts) {
        await this.updateTokenStatus(recoveryToken.id, RecoveryStatus.FAILED);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded.',
        };
      }

      // Verify based on method
      const verificationResult = await this.verifyByMethod(
        recoveryToken,
        verification
      );

      if (!verificationResult.success) {
        await this.incrementAttempts(recoveryToken.id);
        return verificationResult;
      }

      // Complete recovery
      if (verification.newPassword) {
        await this.resetPassword(recoveryToken.userId, verification.newPassword);
      }

      await this.updateTokenStatus(recoveryToken.id, RecoveryStatus.USED);

      // Log successful recovery
      await auditLogger.logAuthSuccess(
        request,
        recoveryToken.userId,
        '', // Email would need to be fetched
        'password'
      );

      return {
        success: true,
        message: 'Account recovery completed successfully.',
        userId: recoveryToken.userId,
      };
    } catch (error) {
      console.error('Recovery verification error:', error);
      return {
        success: false,
        message: 'An error occurred during recovery verification.',
      };
    }
  }

  /**
   * Setup security questions for user
   */
  async setupSecurityQuestions(
    userId: string,
    questions: Array<{ question: string; answer: string }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (questions.length < this.config.securityQuestions.minQuestions) {
        return {
          success: false,
          message: `At least ${this.config.securityQuestions.minQuestions} security questions required.`,
        };
      }

      const securityQuestions: SecurityQuestion[] = [];

      for (const qa of questions) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedAnswer = await bcrypt.hash(qa.answer.toLowerCase().trim(), 12);

        securityQuestions.push({
          id: crypto.randomUUID(),
          question: qa.question,
          hashedAnswer,
          salt,
          createdAt: new Date(),
        });
      }

      // Encrypt and store security questions
      const encryptionService = await getEncryptionService();
      const encryptedQuestions = await encryptionService.encrypt(
        JSON.stringify(securityQuestions)
      );

      const { error: _error } = await this.supabase
        .from('user_profiles')
        .update({
          metadata: {
            security_questions: encryptedQuestions,
          },
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Security questions set up successfully.',
      };
    } catch (error) {
      console.error('Security questions setup error:', error);
      return {
        success: false,
        message: 'Failed to set up security questions.',
      };
    }
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStats(organizationId?: string): Promise<RecoveryStats> {
    try {
      const { data: tokens } = await this.supabase
        .from('recovery_tokens')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (!tokens) {
        return this.getEmptyStats();
      }

      const stats: RecoveryStats = {
        totalRequests: tokens.length,
        successfulRecoveries: tokens.filter(t => t.status === RecoveryStatus.USED).length,
        failedAttempts: tokens.filter(t => t.status === RecoveryStatus.FAILED).length,
        expiredTokens: tokens.filter(t => t.status === RecoveryStatus.EXPIRED).length,
        methodBreakdown: {
          [RecoveryMethod.EMAIL]: 0,
          [RecoveryMethod.SMS]: 0,
          [RecoveryMethod.SECURITY_QUESTIONS]: 0,
          [RecoveryMethod.BACKUP_CODES]: 0,
          [RecoveryMethod.ADMIN_OVERRIDE]: 0,
        },
        recentRequests: [],
      };

      // Calculate method breakdown
      tokens.forEach(token => {
        if (stats.methodBreakdown[token.method as RecoveryMethod] !== undefined) {
          stats.methodBreakdown[token.method as RecoveryMethod]++;
        }
      });

      // Get recent requests (last 10)
      const recentTokens = tokens
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      for (const token of recentTokens) {
        const { data: user } = await this.supabase
          .from('user_profiles')
          .select('email')
          .eq('id', token.user_id)
          .single();

        stats.recentRequests.push({
          userId: token.user_id,
          email: user?.email || 'Unknown',
          method: token.method as RecoveryMethod,
          status: token.status as RecoveryStatus,
          timestamp: new Date(token.created_at),
          ipAddress: token.metadata?.ipAddress || 'Unknown',
        });
      }

      return stats;
    } catch (error) {
      console.error('Recovery stats error:', error);
      return this.getEmptyStats();
    }
  }

  // Private methods

  private async initiateEmailRecovery(
    request: NextRequest,
    user: any,
    recoveryRequest: RecoveryRequest
  ) {
    const token = await this.createRecoveryToken(
      user.id,
      RecoveryTokenType.PASSWORD_RESET,
      RecoveryMethod.EMAIL,
      request
    );

    // Send email (would integrate with email service)
    await this.sendRecoveryEmail(user.email, token.token);

    await auditLogger.logAuthFailure(
      request,
      user.email,
      'Password reset requested',
      'PASSWORD_RESET_REQUESTED'
    );

    return {
      success: true,
      message: 'Recovery instructions have been sent to your email.',
    };
  }

  private async initiateSMSRecovery(
    request: NextRequest,
    user: any,
    recoveryRequest: RecoveryRequest
  ) {
    // Check if user has phone number
    const phoneNumber = user.metadata?.phone_number;
    if (!phoneNumber) {
      return {
        success: false,
        message: 'No phone number associated with this account.',
      };
    }

    const token = await this.createRecoveryToken(
      user.id,
      RecoveryTokenType.PASSWORD_RESET,
      RecoveryMethod.SMS,
      request
    );

    // Send SMS (would integrate with SMS service)
    await this.sendRecoverySMS(phoneNumber, token.token.substring(0, 6));

    return {
      success: true,
      message: 'Recovery code has been sent to your phone.',
    };
  }

  private async initiateSecurityQuestionRecovery(
    request: NextRequest,
    user: any,
    recoveryRequest: RecoveryRequest
  ) {
    // Get user's security questions
    const securityQuestions = await this.getUserSecurityQuestions(user.id);
    if (!securityQuestions || securityQuestions.length === 0) {
      return {
        success: false,
        message: 'No security questions set up for this account.',
      };
    }

    // Verify answers
    if (!recoveryRequest.securityAnswers || recoveryRequest.securityAnswers.length === 0) {
      return {
        success: false,
        message: 'Security question answers required.',
        requiresVerification: true,
      };
    }

    const correctAnswers = await this.verifySecurityAnswers(
      securityQuestions,
      recoveryRequest.securityAnswers
    );

    if (correctAnswers < this.config.securityQuestions.minCorrectAnswers) {
      await auditLogger.logAuthFailure(
        request,
        user.email,
        'Security questions verification failed',
        'SECURITY_QUESTIONS_FAILED'
      );

      return {
        success: false,
        message: 'Security question verification failed.',
      };
    }

    const token = await this.createRecoveryToken(
      user.id,
      RecoveryTokenType.PASSWORD_RESET,
      RecoveryMethod.SECURITY_QUESTIONS,
      request,
      { securityQuestionsVerified: true }
    );

    return {
      success: true,
      message: 'Security questions verified. You may now reset your password.',
    };
  }

  private async initiateBackupCodeRecovery(
    request: NextRequest,
    user: any,
    recoveryRequest: RecoveryRequest
  ) {
    if (!recoveryRequest.backupCode) {
      return {
        success: false,
        message: 'Backup code required.',
      };
    }

    // Verify backup code (would integrate with MFA service)
    const isValidBackupCode = await this.verifyBackupCode(user.id, recoveryRequest.backupCode);
    if (!isValidBackupCode) {
      return {
        success: false,
        message: 'Invalid backup code.',
      };
    }

    const token = await this.createRecoveryToken(
      user.id,
      RecoveryTokenType.MFA_RECOVERY,
      RecoveryMethod.BACKUP_CODES,
      request
    );

    return {
      success: true,
      message: 'Backup code verified. You may now reset your password.',
    };
  }

  private async initiateAdminOverride(
    request: NextRequest,
    user: any,
    recoveryRequest: RecoveryRequest
  ) {
    if (!recoveryRequest.adminUserId) {
      return {
        success: false,
        message: 'Admin authorization required.',
      };
    }

    // Verify admin permissions (would check admin user permissions)
    const hasAdminPermission = await this.verifyAdminPermission(
      recoveryRequest.adminUserId,
      'user:reset_password'
    );

    if (!hasAdminPermission) {
      return {
        success: false,
        message: 'Insufficient admin permissions.',
      };
    }

    const token = await this.createRecoveryToken(
      user.id,
      RecoveryTokenType.PASSWORD_RESET,
      RecoveryMethod.ADMIN_OVERRIDE,
      request,
      { adminUserId: recoveryRequest.adminUserId }
    );

    await auditLogger.logAuthFailure(
      request,
      user.email,
      'Admin password reset initiated',
      'ADMIN_PASSWORD_RESET'
    );

    return {
      success: true,
      message: 'Admin override initiated. Password reset authorized.',
    };
  }

  private async createRecoveryToken(
    userId: string,
    type: RecoveryTokenType,
    method: RecoveryMethod,
    request: NextRequest,
    metadata: Record<string, any> = {}
  ): Promise<RecoveryToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 12);

    const recoveryToken: RecoveryToken = {
      id: crypto.randomUUID(),
      userId,
      type,
      token,
      hashedToken,
      method,
      expiresAt: new Date(Date.now() + this.config.tokenTTL * 1000),
      status: RecoveryStatus.PENDING,
      maxAttempts: this.config.maxAttempts,
      currentAttempts: 0,
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        ...metadata,
      },
      createdAt: new Date(),
    };

    // Store in database
    await this.supabase.from('recovery_tokens').insert({
      id: recoveryToken.id,
      user_id: recoveryToken.userId,
      type: recoveryToken.type,
      hashed_token: recoveryToken.hashedToken,
      method: recoveryToken.method,
      expires_at: recoveryToken.expiresAt.toISOString(),
      status: recoveryToken.status,
      max_attempts: recoveryToken.maxAttempts,
      current_attempts: recoveryToken.currentAttempts,
      metadata: recoveryToken.metadata,
      created_at: recoveryToken.createdAt.toISOString(),
    });

    return recoveryToken;
  }

  private async getRecoveryToken(token: string): Promise<RecoveryToken | null> {
    try {
      const { data: tokens } = await this.supabase
        .from('recovery_tokens')
        .select('*')
        .eq('status', RecoveryStatus.PENDING)
        .gte('expires_at', new Date().toISOString());

      if (!tokens || tokens.length === 0) {
        return null;
      }

      // Find token by comparing hash
      for (const dbToken of tokens) {
        const isMatch = await bcrypt.compare(token, dbToken.hashed_token);
        if (isMatch) {
          return {
            id: dbToken.id,
            userId: dbToken.user_id,
            type: dbToken.type,
            token,
            hashedToken: dbToken.hashed_token,
            method: dbToken.method,
            expiresAt: new Date(dbToken.expires_at),
            status: dbToken.status,
            maxAttempts: dbToken.max_attempts,
            currentAttempts: dbToken.current_attempts,
            metadata: dbToken.metadata || {},
            createdAt: new Date(dbToken.created_at),
            usedAt: dbToken.used_at ? new Date(dbToken.used_at) : undefined,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Get recovery token error:', error);
      return null;
    }
  }

  private async verifyByMethod(
    token: RecoveryToken,
    verification: RecoveryVerification
  ): Promise<{ success: boolean; message: string }> {
    switch (token.method) {
      case RecoveryMethod.EMAIL:
        return { success: true, message: 'Email token verified.' };

      case RecoveryMethod.SMS:
        if (!verification.verificationData?.smsCode) {
          return { success: false, message: 'SMS code required.' };
        }
        // In real implementation, would verify SMS code
        return { success: true, message: 'SMS code verified.' };

      case RecoveryMethod.SECURITY_QUESTIONS:
        return { success: true, message: 'Security questions already verified.' };

      case RecoveryMethod.BACKUP_CODES:
        return { success: true, message: 'Backup code already verified.' };

      case RecoveryMethod.ADMIN_OVERRIDE:
        return { success: true, message: 'Admin override verified.' };

      default:
        return { success: false, message: 'Invalid recovery method.' };
    }
  }

  private async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await this.supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
  }

  private async updateTokenStatus(tokenId: string, status: RecoveryStatus): Promise<void> {
    const updateData: any = { status };
    if (status === RecoveryStatus.USED) {
      updateData.used_at = new Date().toISOString();
    }

    await this.supabase
      .from('recovery_tokens')
      .update(updateData)
      .eq('id', tokenId);
  }

  private async incrementAttempts(tokenId: string): Promise<void> {
    await this.supabase.rpc('increment_recovery_attempts', { token_id: tokenId });
  }

  private async getUserSecurityQuestions(userId: string): Promise<SecurityQuestion[] | null> {
    try {
      const { data: user } = await this.supabase
        .from('user_profiles')
        .select('metadata')
        .eq('id', userId)
        .single();

      if (!user?.metadata?.security_questions) {
        return null;
      }

      const encryptionService = await getEncryptionService();
      const decryptedQuestions = await encryptionService.decrypt(
        user.metadata.security_questions
      );

      return JSON.parse(decryptedQuestions);
    } catch (error) {
      console.error('Get security questions error:', error);
      return null;
    }
  }

  private async verifySecurityAnswers(
    questions: SecurityQuestion[],
    answers: string[]
  ): Promise<number> {
    let correctCount = 0;

    for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
      const isCorrect = await bcrypt.compare(
        answers[i].toLowerCase().trim(),
        questions[i].hashedAnswer
      );
      if (isCorrect) {
        correctCount++;
      }
    }

    return correctCount;
  }

  private async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    // Would integrate with MFA service to verify backup code
    return true; // Placeholder
  }

  private async verifyAdminPermission(adminUserId: string, permission: string): Promise<boolean> {
    // Would check admin permissions in database
    return true; // Placeholder
  }

  private async sendRecoveryEmail(email: string, token: string): Promise<void> {
    // Would integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending recovery email to ${email} with token ${token}`);
  }

  private async sendRecoverySMS(phoneNumber: string, code: string): Promise<void> {
    // Would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending recovery SMS to ${phoneNumber} with code ${code}`);
  }

  private getEmptyStats(): RecoveryStats {
    return {
      totalRequests: 0,
      successfulRecoveries: 0,
      failedAttempts: 0,
      expiredTokens: 0,
      methodBreakdown: {
        [RecoveryMethod.EMAIL]: 0,
        [RecoveryMethod.SMS]: 0,
        [RecoveryMethod.SECURITY_QUESTIONS]: 0,
        [RecoveryMethod.BACKUP_CODES]: 0,
        [RecoveryMethod.ADMIN_OVERRIDE]: 0,
      },
      recentRequests: [],
    };
  }
}

// Singleton instance
let recoveryService: AccountRecoveryService | null = null;

export function getRecoveryService(config?: Partial<RecoveryConfig>): AccountRecoveryService {
  if (!recoveryService) {
    recoveryService = new AccountRecoveryService(config);
  }
  return recoveryService;
}