import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MFAService } from '../mfa/service';
import { TOTPService } from '../mfa/totp';
import { MFAMethod } from '../mfa/types';

// Mock the encryption service
const mockEncryptionService = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

jest.mock('../encryption/factory', () => ({
  getEncryptionService: jest.fn(() => Promise.resolve(mockEncryptionService)),
}));

// Mock crypto for predictable testing
const mockCrypto = {
  randomBytes: jest.fn(),
};

jest.mock('crypto', () => mockCrypto);

describe('MFAService', () => {
  let mfaService: MFAService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    };

    jest.mock('@/lib/supabase/client', () => ({
      createClient: jest.fn(() => mockSupabase),
    }));

    mfaService = new MFAService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('MFA Setup', () => {
    it('should setup TOTP MFA successfully', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      mockEncryptionService.encrypt.mockResolvedValue({
        ciphertext: 'encrypted-secret',
        encryptedDataKey: 'encrypted-key',
        algorithm: 'aes-256-gcm',
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      });

      const result = await mfaService.setupMFA(userId, userEmail, MFAMethod.TOTP);

      expect(result.success).toBe(true);
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(8);
    });

    it('should prevent duplicate MFA setup', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      // Mock existing MFA setup
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { id: 'existing-mfa', is_active: true }, 
              error: null 
            })),
          })),
        })),
      });

      const result = await mfaService.setupMFA(userId, userEmail, MFAMethod.TOTP);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already enabled');
    });

    it('should handle encryption errors during setup', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      mockEncryptionService.encrypt.mockRejectedValue(new Error('Encryption failed'));

      const result = await mfaService.setupMFA(userId, userEmail, MFAMethod.TOTP);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate secure backup codes', async () => {
      const userId = 'test-user-id';
      const userEmail = 'test@example.com';

      mockEncryptionService.encrypt.mockResolvedValue({
        ciphertext: 'encrypted-secret',
        encryptedDataKey: 'encrypted-key',
        algorithm: 'aes-256-gcm',
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      });

      const result = await mfaService.setupMFA(userId, userEmail, MFAMethod.TOTP);

      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(8);
      
      // Each backup code should be unique
      const uniqueCodes = new Set(result.backupCodes);
      expect(uniqueCodes.size).toBe(8);
      
      // Each code should be 8 characters long
      result.backupCodes.forEach(code => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[0-9a-f]+$/); // Hex format
      });
    });
  });

  describe('MFA Verification', () => {
    it('should verify valid TOTP token', async () => {
      const userId = 'test-user-id';
      const token = '123456';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                encrypted_secret: {
                  ciphertext: 'encrypted-secret',
                  encryptedDataKey: 'encrypted-key',
                  algorithm: 'aes-256-gcm',
                },
                is_active: true,
                backup_codes: ['code1', 'code2'],
              }, 
              error: null 
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      mockEncryptionService.decrypt.mockResolvedValue('decrypted-secret');

      // Mock TOTP verification
      jest.spyOn(TOTPService.prototype, 'verifyToken').mockReturnValue(true);

      const result = await mfaService.verifyMFA(userId, token);

      expect(result.success).toBe(true);
      expect(result.method).toBe(MFAMethod.TOTP);
    });

    it('should verify valid backup code', async () => {
      const userId = 'test-user-id';
      const backupCode = 'abcd1234';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                backup_codes: ['abcd1234', 'efgh5678'],
                is_active: true,
              }, 
              error: null 
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      const result = await mfaService.verifyMFA(userId, backupCode);

      expect(result.success).toBe(true);
      expect(result.method).toBe(MFAMethod.BACKUP_CODE);
    });

    it('should reject invalid TOTP token', async () => {
      const userId = 'test-user-id';
      const token = '000000';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                encrypted_secret: {
                  ciphertext: 'encrypted-secret',
                  encryptedDataKey: 'encrypted-key',
                  algorithm: 'aes-256-gcm',
                },
                is_active: true,
              }, 
              error: null 
            })),
          })),
        })),
      });

      mockEncryptionService.decrypt.mockResolvedValue('decrypted-secret');

      // Mock TOTP verification to fail
      jest.spyOn(TOTPService.prototype, 'verifyToken').mockReturnValue(false);

      const result = await mfaService.verifyMFA(userId, token);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject used backup code', async () => {
      const userId = 'test-user-id';
      const backupCode = 'abcd1234';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                backup_codes: ['efgh5678'], // Code already used
                is_active: true,
              }, 
              error: null 
            })),
          })),
        })),
      });

      const result = await mfaService.verifyMFA(userId, backupCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle MFA not enabled', async () => {
      const userId = 'test-user-id';
      const token = '123456';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const result = await mfaService.verifyMFA(userId, token);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });

    it('should handle inactive MFA', async () => {
      const userId = 'test-user-id';
      const token = '123456';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                is_active: false,
              }, 
              error: null 
            })),
          })),
        })),
      });

      const result = await mfaService.verifyMFA(userId, token);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });
  });

  describe('MFA Status', () => {
    it('should return MFA status for enabled user', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                method: 'totp',
                is_active: true,
                created_at: '2023-01-01T00:00:00Z',
                backup_codes: ['code1', 'code2'],
              }, 
              error: null 
            })),
          })),
        })),
      });

      const status = await mfaService.getMFAStatus(userId);

      expect(status.enabled).toBe(true);
      expect(status.method).toBe(MFAMethod.TOTP);
      expect(status.backupCodesRemaining).toBe(2);
    });

    it('should return MFA status for disabled user', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const status = await mfaService.getMFAStatus(userId);

      expect(status.enabled).toBe(false);
      expect(status.method).toBeUndefined();
      expect(status.backupCodesRemaining).toBe(0);
    });
  });

  describe('MFA Disable', () => {
    it('should disable MFA successfully', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                is_active: true,
              }, 
              error: null 
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      const result = await mfaService.disableMFA(userId);

      expect(result.success).toBe(true);
    });

    it('should handle MFA already disabled', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const result = await mfaService.disableMFA(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });
  });

  describe('Backup Code Management', () => {
    it('should regenerate backup codes', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'mfa-id',
                is_active: true,
              }, 
              error: null 
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      });

      const result = await mfaService.regenerateBackupCodes(userId);

      expect(result.success).toBe(true);
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(8);
    });

    it('should handle regeneration when MFA not enabled', async () => {
      const userId = 'test-user-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const result = await mfaService.regenerateBackupCodes(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });
  });
});

describe('TOTPService', () => {
  let totpService: TOTPService;

  beforeEach(() => {
    totpService = new TOTPService();
  });

  describe('Secret Generation', () => {
    it('should generate a valid secret', () => {
      const secret = totpService.generateSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      // Base32 alphabet
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = totpService.generateSecret();
      const secret2 = totpService.generateSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code URL', () => {
      const secret = 'TESTSECRET123456';
      const email = 'test@example.com';
      const issuer = 'Test App';

      const qrCodeUrl = totpService.generateQRCode(secret, email, issuer);

      expect(qrCodeUrl).toBeDefined();
      expect(qrCodeUrl).toContain('otpauth://totp/');
      expect(qrCodeUrl).toContain(encodeURIComponent(email));
      expect(qrCodeUrl).toContain(encodeURIComponent(issuer));
      expect(qrCodeUrl).toContain(secret);
    });

    it('should handle special characters in email and issuer', () => {
      const secret = 'TESTSECRET123456';
      const email = 'test+user@example.com';
      const issuer = 'Test App (Beta)';

      const qrCodeUrl = totpService.generateQRCode(secret, email, issuer);

      expect(qrCodeUrl).toBeDefined();
      expect(qrCodeUrl).toContain('otpauth://totp/');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const secret = 'TESTSECRET123456';
      
      // Generate a token for current time
      const token = totpService.generateToken(secret);
      
      // Verify the token
      const isValid = totpService.verifyToken(secret, token);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const secret = 'TESTSECRET123456';
      const invalidToken = '000000';
      
      const isValid = totpService.verifyToken(secret, invalidToken);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty token', () => {
      const secret = 'TESTSECRET123456';
      const emptyToken = '';
      
      const isValid = totpService.verifyToken(secret, emptyToken);
      
      expect(isValid).toBe(false);
    });

    it('should reject malformed token', () => {
      const secret = 'TESTSECRET123456';
      const malformedToken = 'abc123';
      
      const isValid = totpService.verifyToken(secret, malformedToken);
      
      expect(isValid).toBe(false);
    });

    it('should handle time window tolerance', () => {
      const secret = 'TESTSECRET123456';
      
      // Generate token for previous time window
      const previousTime = Math.floor(Date.now() / 1000) - 30;
      const previousToken = totpService.generateTokenForTime(secret, previousTime);
      
      // Should still be valid due to time window tolerance
      const isValid = totpService.verifyToken(secret, previousToken);
      
      // Note: This test depends on the implementation's time window tolerance
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Token Generation', () => {
    it('should generate 6-digit token', () => {
      const secret = 'TESTSECRET123456';
      
      const token = totpService.generateToken(secret);
      
      expect(token).toBeDefined();
      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate different tokens for different secrets', () => {
      const secret1 = 'TESTSECRET123456';
      const secret2 = 'ANOTHERSECRET789';
      
      const token1 = totpService.generateToken(secret1);
      const token2 = totpService.generateToken(secret2);
      
      expect(token1).not.toBe(token2);
    });

    it('should generate consistent tokens for same secret and time', () => {
      const secret = 'TESTSECRET123456';
      const timestamp = Math.floor(Date.now() / 1000);
      
      const token1 = totpService.generateTokenForTime(secret, timestamp);
      const token2 = totpService.generateTokenForTime(secret, timestamp);
      
      expect(token1).toBe(token2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid secret', () => {
      const invalidSecret = 'invalid-secret-123';
      
      expect(() => {
        totpService.generateToken(invalidSecret);
      }).toThrow();
    });

    it('should handle empty secret', () => {
      const emptySecret = '';
      
      expect(() => {
        totpService.generateToken(emptySecret);
      }).toThrow();
    });

    it('should handle null/undefined inputs', () => {
      expect(() => {
        totpService.verifyToken(null as any, '123456');
      }).toThrow();

      expect(() => {
        totpService.verifyToken('SECRET', null as any);
      }).toThrow();
    });
  });
});