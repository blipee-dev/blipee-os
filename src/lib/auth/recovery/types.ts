export enum RecoveryMethod {
  EMAIL = 'email',
  SMS = 'sms',
  SECURITY_QUESTIONS = 'security_questions',
  BACKUP_CODES = 'backup_codes',
  ADMIN_OVERRIDE = 'admin_override',
}

export enum RecoveryTokenType {
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_UNLOCK = 'account_unlock',
  MFA_RECOVERY = 'mfa_recovery',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum RecoveryStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  USED = 'used',
  REVOKED = 'revoked',
  FAILED = 'failed',
}

export interface RecoveryToken {
  id: string;
  userId: string;
  type: RecoveryTokenType;
  token: string;
  hashedToken: string;
  method: RecoveryMethod;
  expiresAt: Date;
  status: RecoveryStatus;
  maxAttempts: number;
  currentAttempts: number;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestedBy?: string; // For admin overrides
    verificationData?: Record<string, any>; // For security questions, etc.
  };
  createdAt: Date;
  usedAt?: Date;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  hashedAnswer: string;
  salt: string;
  createdAt: Date;
}

export interface RecoveryRequest {
  email: string;
  method: RecoveryMethod;
  securityAnswers?: string[];
  backupCode?: string;
  adminUserId?: string; // For admin overrides
  metadata?: Record<string, any>;
}

export interface RecoveryVerification {
  token: string;
  method: RecoveryMethod;
  verificationData?: {
    securityAnswers?: string[];
    backupCode?: string;
    smsCode?: string;
  };
  newPassword?: string;
}

export interface RecoveryConfig {
  tokenTTL: number; // Token time-to-live in seconds
  maxAttempts: number;
  requireMultipleFactors: boolean;
  allowedMethods: RecoveryMethod[];
  emailConfig: {
    from: string;
    template: string;
    subject: string;
  };
  smsConfig?: {
    provider: 'twilio' | 'aws_sns';
    from: string;
    template: string;
  };
  securityQuestions: {
    minQuestions: number;
    maxQuestions: number;
    minCorrectAnswers: number;
  };
}

export interface RecoveryStats {
  totalRequests: number;
  successfulRecoveries: number;
  failedAttempts: number;
  expiredTokens: number;
  methodBreakdown: Record<RecoveryMethod, number>;
  recentRequests: Array<{
    userId: string;
    email: string;
    method: RecoveryMethod;
    status: RecoveryStatus;
    timestamp: Date;
    ipAddress: string;
  }>;
}