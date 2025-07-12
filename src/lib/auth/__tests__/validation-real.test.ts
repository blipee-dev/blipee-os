import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Mock auth validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  const cleaned = phone.replace(/\D/g, '');
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
});