// TOTP (Time-based One-Time Password) Implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { MFASetup, MFAConfig } from './types';

const DEFAULT_CONFIG: Partial<MFAConfig> = {
  totpIssuer: 'Blipee OS',
  totpPeriod: 30,
  totpDigits: 6,
};

export class TOTPService {
  private config: Partial<MFAConfig>;

  constructor(config?: Partial<MFAConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a new TOTP secret for user
   */
  async generateSecret(userEmail: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      name: `${this.config.totpIssuer} (${userEmail})`,
      issuer: this.config.totpIssuer,
      length: 32,
    });

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userEmail,
      issuer: this.config.totpIssuer,
      encoding: 'base32',
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return {
      method: 'totp',
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify a TOTP code
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps for clock drift
        step: this.config.totpPeriod,
        digits: this.config.totpDigits,
      });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate a token (for testing)
   */
  generateToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      step: this.config.totpPeriod,
      digits: this.config.totpDigits,
    });
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = speakeasy.generateSecret({ length: 8 }).base32
        .replace(/=/g, '')
        .substring(0, 8)
        .toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Format backup codes for display
   */
  formatBackupCodes(codes: string[]): string[] {
    return codes.map(code => {
      // Format as XXXX-XXXX
      return code.match(/.{1,4}/g)?.join('-') || code;
    });
  }
}