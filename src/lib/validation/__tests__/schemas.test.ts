import { describe, it, expect } from '@jest/globals';
import {
  uuidSchema,
  emailSchema,
  passwordSchema,
  signUpSchema,
  signInSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  chatMessageSchema,
  organizationCreateSchema,
  organizationUpdateSchema,
  organizationMemberInviteSchema,
  buildingCreateSchema,
  buildingUpdateSchema,
  fileUploadMetadataSchema,
  onboardingStepSchema,
  sessionResponseSchema,
  validateAndSanitize
} from '../schemas';

describe('Validation Schemas', () => {
  describe('Common Schemas', () => {
    describe('uuidSchema', () => {
      it('should accept valid UUIDs', () => {
        const validUUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
        ];
        
        validUUIDs.forEach(uuid => {
          const result = uuidSchema.safeParse(uuid);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid UUIDs', () => {
        const invalidUUIDs = [
          'invalid-uuid',
          '550e8400-e29b-41d4-a716',
          '550e8400-e29b-41d4-a716-446655440000-extra',
          '',
          null,
          undefined,
          123
        ];
        
        invalidUUIDs.forEach(uuid => {
          const result = uuidSchema.safeParse(uuid);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors[0].message).toContain('Invalid UUID');
          }
        });
      });
    });

    describe('emailSchema', () => {
      it('should accept valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user+tag@domain.co.uk',
          'firstname.lastname@company.org',
          'admin@localhost.localdomain'
        ];
        
        validEmails.forEach(email => {
          const result = emailSchema.safeParse(email);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user@.com',
          'user@domain',
          '',
          null,
          undefined
        ];
        
        invalidEmails.forEach(email => {
          const result = emailSchema.safeParse(email);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('passwordSchema', () => {
      it('should accept valid passwords', () => {
        const validPasswords = [
          'Password123',
          'SecureP@ssw0rd',
          'MyStr0ngPassword',
          'Test1234ABC'
        ];
        
        validPasswords.forEach(password => {
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(true);
        });
      });

      it('should reject passwords without uppercase', () => {
        const result = passwordSchema.safeParse('password123');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('uppercase letter');
        }
      });

      it('should reject passwords without lowercase', () => {
        const result = passwordSchema.safeParse('PASSWORD123');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('lowercase letter');
        }
      });

      it('should reject passwords without numbers', () => {
        const result = passwordSchema.safeParse('PasswordOnly');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('one number');
        }
      });

      it('should reject short passwords', () => {
        const result = passwordSchema.safeParse('Pass1');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('at least 8 characters');
        }
      });

      it('should reject very long passwords', () => {
        const longPassword = 'P' + 'a'.repeat(99) + '1';
        const result = passwordSchema.safeParse(longPassword);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('too long');
        }
      });
    });
  });

  describe('Auth Schemas', () => {
    describe('signUpSchema', () => {
      it('should accept valid sign up data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'SecurePass123',
          fullName: 'John Doe',
          companyName: 'Acme Corp',
          role: 'viewer' as const
        };
        
        const result = signUpSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept sign up without optional fields', () => {
        const minimalData = {
          email: 'test@example.com',
          password: 'SecurePass123',
          fullName: 'John Doe'
        };
        
        const result = signUpSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('viewer'); // Default value
        }
      });

      it('should reject invalid full names', () => {
        const invalidNames = [
          'J', // Too short
          'John123', // Contains numbers
          'John@Doe', // Contains invalid characters
          'A'.repeat(101) // Too long
        ];
        
        invalidNames.forEach(fullName => {
          const result = signUpSchema.safeParse({
            email: 'test@example.com',
            password: 'SecurePass123',
            fullName
          });
          expect(result.success).toBe(false);
        });
      });

      it('should validate role enum', () => {
        const validRoles = ['viewer', 'analyst', 'facility_manager', 'sustainability_lead', 'account_owner'];
        
        validRoles.forEach(role => {
          const result = signUpSchema.safeParse({
            email: 'test@example.com',
            password: 'SecurePass123',
            fullName: 'John Doe',
            role
          });
          expect(result.success).toBe(true);
        });
        
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password: 'SecurePass123',
          fullName: 'John Doe',
          role: 'invalid_role'
        });
        expect(result.success).toBe(false);
      });
    });

    describe('signInSchema', () => {
      it('should accept valid sign in data', () => {
        const result = signInSchema.safeParse({
          email: 'test@example.com',
          password: 'password'
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty password', () => {
        const result = signInSchema.safeParse({
          email: 'test@example.com',
          password: ''
        });
        expect(result.success).toBe(false);
      });
    });

    describe('resetPasswordSchema', () => {
      it('should accept valid email', () => {
        const result = resetPasswordSchema.safeParse({
          email: 'test@example.com'
        });
        expect(result.success).toBe(true);
      });
    });

    describe('updatePasswordSchema', () => {
      it('should accept valid update data', () => {
        const result = updatePasswordSchema.safeParse({
          token: 'reset-token-123',
          password: 'NewSecurePass123'
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Chat/AI Schemas', () => {
    describe('chatMessageSchema', () => {
      it('should accept minimal message', () => {
        const result = chatMessageSchema.safeParse({
          message: 'Hello, AI!'
        });
        expect(result.success).toBe(true);
      });

      it('should accept message with all fields', () => {
        const result = chatMessageSchema.safeParse({
          message: 'Analyze this data',
          conversationId: '550e8400-e29b-41d4-a716-446655440000',
          buildingId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          organizationId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
          attachments: [{
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'report.pdf',
            type: 'application/pdf',
            size: 5000000,
            publicUrl: 'https://example.com/file.pdf',
            extractedData: { pages: 10 }
          }]
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty message', () => {
        const result = chatMessageSchema.safeParse({
          message: ''
        });
        expect(result.success).toBe(false);
      });

      it('should reject very long message', () => {
        const result = chatMessageSchema.safeParse({
          message: 'a'.repeat(10001)
        });
        expect(result.success).toBe(false);
      });

      it('should reject attachments over 10MB', () => {
        const result = chatMessageSchema.safeParse({
          message: 'Check this file',
          attachments: [{
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'large.pdf',
            type: 'application/pdf',
            size: 11 * 1024 * 1024 // 11MB
          }]
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateAndSanitize', () => {
    it('should return success with valid data', () => {
      const result = validateAndSanitize(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should return error with invalid data', () => {
      const result = validateAndSanitize(emailSchema, 'invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
