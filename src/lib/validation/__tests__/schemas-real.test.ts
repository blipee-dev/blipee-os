import { describe, it, expect } from '@jest/globals';
import {
  uuidSchema,
  emailSchema,
  passwordSchema,
  validateAndSanitize
} from '../schemas';

describe('Validation Schemas', () => {
  describe('uuidSchema', () => {
    it('should validate valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      ];

      validUUIDs.forEach(uuid => {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456',
        'not-a-uuid',
        '123e4567e89b12d3a456426614174000',
        ''
      ];

      invalidUUIDs.forEach(uuid => {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('emailSchema', () => {
    it('should validate valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example-domain.com'
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it('should transform to lowercase', () => {
      const result = emailSchema.safeParse('USER@EXAMPLE.COM');
      expect(result.success).toBe(true);
      expect(result.data).toBe('user@example.com');
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'Complex#Password99',
        'Str0ng!P@ssw0rd'
      ];

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short1!',           // Too short
        'nouppercase123!',   // No uppercase
        'NOLOWERCASE123!',   // No lowercase
        'NoNumbers!',        // No numbers
        'NoSpecialChar123',  // No special chars
        'password',          // Too simple
        ''                   // Empty
      ];

      weakPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });

    it('should provide detailed error messages', () => {
      const result = passwordSchema.safeParse('weak');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateAndSanitize', () => {
    it('should validate and sanitize data', async () => {
      const schema = emailSchema;
      const dirtyData = '  USER@EXAMPLE.COM  ';
      
      const result = await validateAndSanitize(schema, dirtyData);
      expect(result.success).toBe(true);
      expect(result.data).toBe('user@example.com');
    });

    it('should handle validation errors', async () => {
      const schema = emailSchema;
      const invalidData = 'not-an-email';
      
      const result = await validateAndSanitize(schema, invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should work with complex schemas', async () => {
      const complexSchema = z.object({
        email: emailSchema,
        password: passwordSchema,
        uuid: uuidSchema
      });

      const data = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        uuid: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = await validateAndSanitize(complexSchema, data);
      expect(result.success).toBe(true);
    });
  });
});

// Import zod for complex schema test
import { z } from 'zod';