import crypto from 'crypto';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { encryptionService } from '@/lib/security/encryption/factory';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'mock';
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
}

export interface SMSVerificationCode {
  id: string;
  userId: string;
  phoneNumber: string;
  code: string;
  hashedCode: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export class SMSMFAService {
  private config: SMSConfig;

  constructor(config?: SMSConfig) {
    this.config = config || {
      provider: 'mock',
    };
  }

  async sendVerificationCode(
    userId: string,
    phoneNumber: string,
    purpose: 'mfa' | 'recovery' = 'mfa'
  ): Promise<{ success: boolean; codeId: string; message: string }> {
    try {
      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      const codeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Encrypt phone number for storage
      const encryptedPhone = await encryptionService.encrypt(phoneNumber);

      // Store verification code
      const { error: dbError } = await supabaseAdmin
        .from('sms_verification_codes')
        .insert({
          id: codeId,
          user_id: userId,
          phone_number: encryptedPhone.ciphertext,
          phone_number_key: encryptedPhone.encryptedDataKey,
          hashed_code: hashedCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified: false,
          purpose,
        });

      if (dbError) {
        throw new Error(`Failed to store verification code: ${dbError.message}`);
      }

      // Send SMS
      const sent = await this.sendSMS(phoneNumber, code, purpose);
      
      if (!sent.success) {
        throw new Error(`Failed to send SMS: ${sent.message}`);
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: userId,
        },
        context: {},
        metadata: {
          action: 'sms_code_sent',
          phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
          purpose,
          provider: this.config.provider,
        },
        result: 'success',
      });

      return {
        success: true,
        codeId,
        message: `Verification code sent to ${phoneNumber.slice(-4).padStart(phoneNumber.length, '*')}`,
      };
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.WARNING,
        actor: {
          type: 'user',
          id: userId,
        },
        context: {},
        metadata: {
          action: 'sms_code_send_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
          purpose,
        },
        result: 'failure',
      });

      return {
        success: false,
        codeId: '',
        message: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  async verifyCode(
    codeId: string,
    code: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; phoneNumber?: string }> {
    try {
      // Get verification record
      const { data: verification, error: fetchError } = await supabaseAdmin
        .from('sms_verification_codes')
        .select('*')
        .eq('id', codeId)
        .single();

      if (fetchError || !verification) {
        throw new Error('Invalid verification code ID');
      }

      // Check if already verified
      if (verification.verified) {
        throw new Error('Verification code already used');
      }

      // Check expiration
      if (new Date() > new Date(verification.expires_at)) {
        throw new Error('Verification code expired');
      }

      // Check attempt limit
      if (verification.attempts >= 3) {
        throw new Error('Too many verification attempts');
      }

      // Verify user if provided
      if (userId && verification.user_id !== userId) {
        throw new Error('Invalid verification code');
      }

      // Hash provided code
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Check code
      if (hashedCode !== verification.hashed_code) {
        // Increment attempts
        await supabaseAdmin
          .from('sms_verification_codes')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', codeId);

        throw new Error('Invalid verification code');
      }

      // Mark as verified
      await supabaseAdmin
        .from('sms_verification_codes')
        .update({ verified: true })
        .eq('id', codeId);

      // Decrypt phone number
      const decryptedPhone = await encryptionService.decrypt({
        ciphertext: verification.phone_number,
        encryptedDataKey: verification.phone_number_key,
        algorithm: 'AES-256-GCM',
      });

      // Audit log
      await auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: verification.user_id,
        },
        context: {},
        metadata: {
          action: 'sms_code_verified',
          phoneNumber: decryptedPhone.slice(-4).padStart(decryptedPhone.length, '*'),
          purpose: verification.purpose,
          attempts: verification.attempts + 1,
        },
        result: 'success',
      });

      return {
        success: true,
        message: 'SMS verification successful',
        phoneNumber: decryptedPhone,
      };
    } catch (error) {
      // Audit log for failed verification
      if (userId) {
        await auditService.log({
          type: AuditEventType.SYSTEM_ERROR,
          severity: AuditEventSeverity.WARNING,
          actor: {
            type: 'user',
            id: userId,
          },
          context: {},
          metadata: {
            action: 'sms_code_verify_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            codeId,
          },
          result: 'failure',
        });
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('sms_verification_codes')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup expired SMS codes:', error);
      return 0;
    }
  }

  private async sendSMS(
    phoneNumber: string,
    code: string,
    purpose: 'mfa' | 'recovery'
  ): Promise<{ success: boolean; message: string }> {
    const message = purpose === 'mfa'
      ? `Your blipee OS verification code is: ${code}. This code expires in 10 minutes.`
      : `Your blipee OS account recovery code is: ${code}. This code expires in 10 minutes.`;

    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phoneNumber, message);
        case 'aws-sns':
          return await this.sendAWSSNS(phoneNumber, message);
        case 'mock':
        default:
          return await this.sendMockSMS(phoneNumber, message, code);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'SMS sending failed',
      };
    }
  }

  private async sendTwilioSMS(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Dynamic import for edge runtime compatibility
      const twilio = await import('twilio');
      const client = twilio.default(this.config.accountSid, this.config.authToken);

      await client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: phoneNumber,
      });

      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      
      // Fallback to mock for development
      if (process.env['NODE_ENV'] === 'development') {
        return this.sendMockSMS(phoneNumber, message, '123456');
      }
      
      return {
        success: false,
        message: 'Failed to send SMS via Twilio',
      };
    }
  }

  private async sendAWSSNS(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Dynamic import for edge runtime compatibility
      const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
      
      const client = new SNSClient({
        region: this.config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: this.config.awsAccessKey!,
          secretAccessKey: this.config.awsSecretKey!,
        },
      });

      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
      });

      await client.send(command);

      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('AWS SNS error:', error);
      
      // Fallback to mock for development
      if (process.env['NODE_ENV'] === 'development') {
        return this.sendMockSMS(phoneNumber, message, '123456');
      }
      
      return {
        success: false,
        message: 'Failed to send SMS via AWS SNS',
      };
    }
  }

  private async sendMockSMS(
    phoneNumber: string,
    message: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    // Log for development
    console.log('📱 Mock SMS:', {
      to: phoneNumber,
      message,
      code,
      timestamp: new Date().toISOString(),
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `Mock SMS sent to ${phoneNumber} (code: ${code})`,
    };
  }

  async getUserPhoneNumbers(userId: string): Promise<string[]> {
    try {
      const { data: phones, error } = await supabaseAdmin
        .from('user_phone_numbers')
        .select('phone_number, phone_number_key')
        .eq('user_id', userId)
        .eq('verified', true);

      if (error) {
        throw error;
      }

      // Decrypt phone numbers
      const decryptedPhones = await Promise.all(
        (phones || []).map(async (phone: any) => {
          try {
            return await encryptionService.decrypt({
              ciphertext: phone.phone_number,
              encryptedDataKey: phone.phone_number_key,
              algorithm: 'AES-256-GCM',
            });
          } catch {
            return null;
          }
        })
      );

      return decryptedPhones.filter((phone): phone is string => phone !== null);
    } catch (error) {
      console.error('Failed to get user phone numbers:', error);
      return [];
    }
  }

  async addUserPhoneNumber(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    try {
      // Check if phone number already exists
      const existingPhones = await this.getUserPhoneNumbers(userId);
      if (existingPhones.includes(phoneNumber)) {
        return {
          success: false,
          message: 'Phone number already registered',
        };
      }

      // Send verification code
      const verification = await this.sendVerificationCode(userId, phoneNumber, 'mfa');
      
      if (!verification.success) {
        return {
          success: false,
          message: verification.message,
        };
      }

      return {
        success: true,
        message: 'Verification code sent',
        verificationId: verification.codeId,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add phone number',
      };
    }
  }

  async verifyAndSavePhoneNumber(
    userId: string,
    verificationId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.verifyCode(verificationId, code, userId);
      
      if (!verification.success || !verification.phoneNumber) {
        return {
          success: false,
          message: verification.message,
        };
      }

      // Encrypt phone number for storage
      const encryptedPhone = await encryptionService.encrypt(verification.phoneNumber);

      // Save verified phone number
      const { error } = await supabaseAdmin
        .from('user_phone_numbers')
        .insert({
          user_id: userId,
          phone_number: encryptedPhone.ciphertext,
          phone_number_key: encryptedPhone.encryptedDataKey,
          verified: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      await auditService.log({
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: userId,
        },
        context: {},
        metadata: {
          action: 'phone_number_added',
          phoneNumber: verification.phoneNumber.slice(-4).padStart(verification.phoneNumber.length, '*'),
        },
        result: 'success',
      });

      return {
        success: true,
        message: 'Phone number verified and saved',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify phone number',
      };
    }
  }
}

// Default instance
export const smsMFAService = new SMSMFAService({
  provider: process.env.SMS_PROVIDER as 'twilio' | 'aws-sns' | 'mock' || 'mock',
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER,
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
});