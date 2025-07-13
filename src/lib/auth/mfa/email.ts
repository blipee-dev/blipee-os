import crypto from 'crypto';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { encryptionService } from '@/lib/security/encryption/factory';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'aws-ses' | 'mock';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
}

export interface EmailVerificationCode {
  id: string;
  userId: string;
  email: string;
  code: string;
  hashedCode: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export class EmailMFAService {
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    this.config = config || {
      provider: 'mock',
      fromEmail: 'noreply@blipee.app',
      fromName: 'blipee OS',
    };
  }

  async sendVerificationCode(
    userId: string,
    email: string,
    purpose: 'mfa' | 'recovery' = 'mfa'
  ): Promise<{ success: boolean; codeId: string; message: string }> {
    try {
      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      const codeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification code
      const { error: dbError } = await supabaseAdmin
        .from('email_verification_codes')
        .insert({
          id: codeId,
          user_id: userId,
          email: email.toLowerCase(),
          hashed_code: hashedCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified: false,
          purpose,
        });

      if (dbError) {
        throw new Error(`Failed to store verification code: ${dbError.message}`);
      }

      // Send email
      const sent = await this.sendEmail(email, code, purpose);
      
      if (!sent.success) {
        throw new Error(`Failed to send email: ${sent.message}`);
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
          action: 'email_code_sent',
          email: this.maskEmail(email),
          purpose,
          provider: this.config.provider,
        },
        result: 'success',
      });

      return {
        success: true,
        codeId,
        message: `Verification code sent to ${this.maskEmail(email)}`,
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
          action: 'email_code_send_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          email: this.maskEmail(email),
          purpose,
        },
        result: 'failure',
      });

      return {
        success: false,
        codeId: '',
        message: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async verifyCode(
    codeId: string,
    code: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; email?: string }> {
    try {
      // Get verification record
      const { data: verification, error: fetchError } = await supabaseAdmin
        .from('email_verification_codes')
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
          .from('email_verification_codes')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', codeId);

        throw new Error('Invalid verification code');
      }

      // Mark as verified
      await supabaseAdmin
        .from('email_verification_codes')
        .update({ verified: true })
        .eq('id', codeId);

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
          action: 'email_code_verified',
          email: this.maskEmail(verification.email),
          purpose: verification.purpose,
          attempts: verification.attempts + 1,
        },
        result: 'success',
      });

      return {
        success: true,
        message: 'Email verification successful',
        email: verification.email,
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
            action: 'email_code_verify_failed',
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
        .from('email_verification_codes')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup expired email codes:', error);
      return 0;
    }
  }

  private async sendEmail(
    email: string,
    code: string,
    purpose: 'mfa' | 'recovery'
  ): Promise<{ success: boolean; message: string }> {
    const subject = purpose === 'mfa'
      ? 'Your blipee OS Verification Code'
      : 'Your blipee OS Account Recovery Code';

    const htmlContent = this.generateEmailHTML(code, purpose);
    const textContent = this.generateEmailText(code, purpose);

    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendResendEmail(email, subject, htmlContent, textContent);
        case 'sendgrid':
          return await this.sendSendGridEmail(email, subject, htmlContent, textContent);
        case 'aws-ses':
          return await this.sendAWSSES(email, subject, htmlContent, textContent);
        case 'mock':
        default:
          return await this.sendMockEmail(email, subject, textContent, code);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email sending failed',
      };
    }
  }

  private async sendResendEmail(
    email: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Dynamic import for edge runtime compatibility
      const { Resend } = await import('resend');
      const resend = new Resend(this.config.apiKey);

      await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: email,
        subject,
        html,
        text,
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Resend email error:', error);
      
      // Fallback to mock for development
      if (process.env['NODE_ENV'] === 'development') {
        return this.sendMockEmail(email, subject, text, '123456');
      }
      
      return {
        success: false,
        message: 'Failed to send email via Resend',
      };
    }
  }

  private async sendSendGridEmail(
    email: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Dynamic import for edge runtime compatibility
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.config.apiKey!);

      await sgMail.default.send({
        to: email,
        from: {
          email: this.config.fromEmail!,
          name: this.config.fromName,
        },
        subject,
        html,
        text,
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('SendGrid email error:', error);
      
      // Fallback to mock for development
      if (process.env['NODE_ENV'] === 'development') {
        return this.sendMockEmail(email, subject, text, '123456');
      }
      
      return {
        success: false,
        message: 'Failed to send email via SendGrid',
      };
    }
  }

  private async sendAWSSES(
    email: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Dynamic import for edge runtime compatibility
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      
      const client = new SESClient({
        region: this.config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: this.config.awsAccessKey!,
          secretAccessKey: this.config.awsSecretKey!,
        },
      });

      const command = new SendEmailCommand({
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await client.send(command);

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('AWS SES error:', error);
      
      // Fallback to mock for development
      if (process.env['NODE_ENV'] === 'development') {
        return this.sendMockEmail(email, subject, text, '123456');
      }
      
      return {
        success: false,
        message: 'Failed to send email via AWS SES',
      };
    }
  }

  private async sendMockEmail(
    email: string,
    subject: string,
    text: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    // Log for development
    console.log('📧 Mock Email:', {
      to: email,
      subject,
      text,
      code,
      timestamp: new Date().toISOString(),
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `Mock email sent to ${email} (code: ${code})`,
    };
  }

  private generateEmailHTML(code: string, purpose: 'mfa' | 'recovery'): string {
    const title = purpose === 'mfa' ? 'Verification Code' : 'Account Recovery Code';
    const description = purpose === 'mfa'
      ? 'Use this code to complete your multi-factor authentication.'
      : 'Use this code to recover access to your account.';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 10px;
        }
        .code {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
        }
        .warning {
            background: #fef3cd;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">blipee OS</div>
            <h1>${title}</h1>
            <p>${description}</p>
        </div>

        <div class="code">${code}</div>

        <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
                <li>This code expires in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>blipee OS will never ask for this code via phone or email</li>
                <li>If you didn't request this code, please ignore this email</li>
            </ul>
        </div>

        <div class="footer">
            <p>This email was sent from blipee OS security system.</p>
            <p>If you have questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateEmailText(code: string, purpose: 'mfa' | 'recovery'): string {
    const title = purpose === 'mfa' ? 'Verification Code' : 'Account Recovery Code';
    const description = purpose === 'mfa'
      ? 'Use this code to complete your multi-factor authentication.'
      : 'Use this code to recover access to your account.';

    return `
blipee OS - ${title}

${description}

Your code: ${code}

SECURITY NOTICE:
- This code expires in 10 minutes
- Never share this code with anyone
- blipee OS will never ask for this code via phone or email
- If you didn't request this code, please ignore this email

This email was sent from blipee OS security system.
If you have questions, please contact our support team.
`;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username.slice(0, 2)}***@${domain}`;
  }

  async getUserEmails(userId: string): Promise<string[]> {
    try {
      const { data: emails, error } = await supabaseAdmin
        .from('user_emails')
        .select('email')
        .eq('user_id', userId)
        .eq('verified', true);

      if (error) {
        throw error;
      }

      return (emails || []).map((e: any) => e.email);
    } catch (error) {
      console.error('Failed to get user emails:', error);
      return [];
    }
  }

  async addUserEmail(
    userId: string,
    email: string
  ): Promise<{ success: boolean; message: string; verificationId?: string }> {
    try {
      const normalizedEmail = email.toLowerCase();
      
      // Check if email already exists
      const existingEmails = await this.getUserEmails(userId);
      if (existingEmails.includes(normalizedEmail)) {
        return {
          success: false,
          message: 'Email already registered',
        };
      }

      // Send verification code
      const verification = await this.sendVerificationCode(userId, normalizedEmail, 'mfa');
      
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
        message: error instanceof Error ? error.message : 'Failed to add email',
      };
    }
  }

  async verifyAndSaveEmail(
    userId: string,
    verificationId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.verifyCode(verificationId, code, userId);
      
      if (!verification.success || !verification.email) {
        return {
          success: false,
          message: verification.message,
        };
      }

      // Save verified email
      const { error: _error } = await supabaseAdmin
        .from('user_emails')
        .insert({
          user_id: userId,
          email: verification.email,
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
          action: 'email_added',
          email: this.maskEmail(verification.email),
        },
        result: 'success',
      });

      return {
        success: true,
        message: 'Email verified and saved',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify email',
      };
    }
  }
}

// Default instance
export const emailMFAService = new EmailMFAService({
  provider: process.env.EMAIL_PROVIDER as 'resend' | 'sendgrid' | 'aws-ses' | 'mock' || 'mock',
  apiKey: process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'noreply@blipee.app',
  fromName: process.env.FROM_NAME || 'blipee OS',
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
});