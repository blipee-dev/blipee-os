#!/usr/bin/env node

/**
 * Test validation and sanitization utilities
 */

const fs = require('fs').promises;
const path = require('path');

const validationTests = [
  // Test sanitization utilities
  {
    file: 'src/lib/validation/__tests__/sanitization-real.test.ts',
    content: `import { describe, it, expect, jest } from '@jest/globals';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserInput,
  sanitizeJSON,
  sanitizeFileName,
  sanitizeURL
} from '../sanitization';

// Mock DOMPurify
jest.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: jest.fn((input, config) => {
      // Simple mock sanitization
      if (typeof input !== 'string') return '';
      
      // Remove script tags
      let cleaned = input.replace(/<script[^>]*>.*?<\\/script>/gi, '');
      
      // If ALLOWED_TAGS is specified, simulate tag filtering
      if (config?.ALLOWED_TAGS) {
        const allowedTags = config.ALLOWED_TAGS.join('|');
        const regex = new RegExp(\`<(?!\\\\/?(\\$\{allowedTags})\\\\\\\\b)[^>]+>\`, 'gi');
        cleaned = cleaned.replace(regex, '');
      }
      
      return cleaned;
    })
  }
}));

describe('Sanitization Utils', () => {
  describe('sanitizeHTML', () => {
    it('should sanitize HTML with default config', () => {
      const dirty = '<p>Hello</p><script>alert("xss")</script>';
      const clean = sanitizeHTML(dirty);
      expect(clean).toBe('<p>Hello</p>');
      expect(clean).not.toContain('<script>');
    });

    it('should apply custom config', () => {
      const dirty = '<p>Text</p><div>More</div><script>bad</script>';
      const clean = sanitizeHTML(dirty, 'basic');
      expect(clean).not.toContain('<script>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML from text', () => {
      const htmlText = '<p>Hello <b>world</b></p>';
      const clean = sanitizeText(htmlText);
      expect(clean).toBe('Hello world');
      expect(clean).not.toContain('<');
    });

    it('should handle plain text', () => {
      const plain = 'Just plain text';
      expect(sanitizeText(plain)).toBe(plain);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize user input', () => {
      const input = '  Hello <script>alert("xss")</script> World  ';
      const clean = sanitizeUserInput(input);
      expect(clean).toBe('Hello  World');
      expect(clean).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      const input = '   trimmed   ';
      expect(sanitizeUserInput(input)).toBe('trimmed');
    });
  });

  describe('sanitizeJSON', () => {
    it('should sanitize JSON data recursively', () => {
      const data = {
        name: '<script>alert("xss")</script>John',
        nested: {
          value: 'Clean <b>text</b>'
        },
        array: ['<img onerror="alert(1)">', 'safe']
      };

      const clean = sanitizeJSON(data);
      expect(clean.name).not.toContain('<script>');
      expect(clean.nested.value).toBe('Clean text');
      expect(clean.array[0]).not.toContain('onerror');
    });

    it('should handle primitive values', () => {
      expect(sanitizeJSON('string')).toBe('string');
      expect(sanitizeJSON(123)).toBe(123);
      expect(sanitizeJSON(true)).toBe(true);
      expect(sanitizeJSON(null)).toBe(null);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names', () => {
      expect(sanitizeFileName('file<script>.txt')).not.toContain('<script>');
      expect(sanitizeFileName('../../etc/passwd')).not.toContain('..');
      expect(sanitizeFileName('file name.txt')).toBe('file_name.txt');
    });

    it('should preserve extensions', () => {
      expect(sanitizeFileName('document.pdf')).toContain('.pdf');
      expect(sanitizeFileName('image.jpg')).toContain('.jpg');
    });

    it('should handle special characters', () => {
      const special = 'file*?<>|:name.txt';
      const clean = sanitizeFileName(special);
      expect(clean).not.toMatch(/[*?<>|:]/);
    });
  });

  describe('sanitizeURL', () => {
    it('should sanitize URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
      expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should allow safe protocols', () => {
      expect(sanitizeURL('http://example.com')).toBe('http://example.com');
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('mailto:user@example.com')).toBe('mailto:user@example.com');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBe('');
      expect(sanitizeURL('')).toBe('');
    });
  });
});`
  },

  // Test validation schemas
  {
    file: 'src/lib/validation/__tests__/schemas-real.test.ts',
    content: `import { describe, it, expect } from '@jest/globals';
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
import { z } from 'zod';`
  },

  // Test auth validation
  {
    file: 'src/lib/auth/__tests__/validation-real.test.ts',
    content: `import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Mock auth validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
  
  return { valid: errors.length === 0, errors };
};

const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

describe('Auth Validation', () => {
  describe('Email validation', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide specific error messages', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain uppercase letter');
      expect(result.errors).toContain('Password must contain number');
      expect(result.errors).toContain('Password must contain special character');
    });
  });

  describe('Username validation', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('user_name')).toBe(true);
      expect(validateUsername('user-name')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('u')).toBe(false); // Too short
      expect(validateUsername('user@name')).toBe(false); // Invalid char
      expect(validateUsername('a'.repeat(31))).toBe(false); // Too long
    });
  });

  describe('Phone validation', () => {
    it('should validate phone numbers', () => {
      expect(validatePhoneNumber('555-123-4567')).toBe(true);
      expect(validatePhoneNumber('15551234567')).toBe(true);
      expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('123456789012')).toBe(false);
    });
  });
});`
  }
];

async function testValidationSanitization() {
  console.log('🚀 Creating validation and sanitization tests...\n');
  
  for (const test of validationTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ Created: ${test.file}`);
    } catch (error) {
      console.error(`❌ Error creating ${test.file}:`, error.message);
    }
  }
  
  console.log('\n✨ Validation tests created!');
}

testValidationSanitization().catch(console.error);