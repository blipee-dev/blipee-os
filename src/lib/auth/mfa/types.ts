// Multi-Factor Authentication Types

export type MFAMethod = 'totp' | 'sms' | 'email' | 'backup_codes';

export interface MFASetup {
  method: MFAMethod;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

export interface MFAVerification {
  method: MFAMethod;
  code: string;
  rememberDevice?: boolean;
}

export interface MFADevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastUsed: Date;
  trusted: boolean;
}

export interface MFAStatus {
  enabled: boolean;
  methods: MFAMethod[];
  primaryMethod?: MFAMethod;
  devices: MFADevice[];
  backupCodesRemaining: number;
}

export interface MFAChallenge {
  challengeId: string;
  methods: MFAMethod[];
  expiresAt: Date;
}

export interface MFAConfig {
  // TOTP settings
  totpIssuer: string;
  totpPeriod: number;
  totpDigits: number;
  
  // SMS settings
  smsProvider: 'twilio' | 'aws_sns' | 'messagebird';
  smsTemplate: string;
  
  // Email settings
  emailTemplate: string;
  emailSubject: string;
  
  // Security settings
  maxAttempts: number;
  lockoutDuration: number; // minutes
  rememberDeviceDuration: number; // days
  backupCodesCount: number;
}