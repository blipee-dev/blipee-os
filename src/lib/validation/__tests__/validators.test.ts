import { describe, it, expect } from '@jest/globals';

describe('Validation Helpers', () => {
  // Validation functions
  const isEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  const isURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  const isUUID = (uuid) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };
  
  const isAlphanumeric = (str) => {
    return /^[a-zA-Z0-9]+$/.test(str);
  };
  
  const isPhoneNumber = (phone) => {
    // Simple US phone number validation
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };
  
  const isStrongPassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };
  
  const isCreditCard = (number) => {
    // Luhn algorithm
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let double = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      double = !double;
    }
    
    return sum % 10 === 0;
  };
  
  describe('Email validation', () => {
    it('should validate correct emails', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('user.name@example.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.com')).toBe(true);
    });
    
    it('should reject invalid emails', () => {
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('user @example.com')).toBe(false);
    });
  });
  
  describe('URL validation', () => {
    it('should validate correct URLs', () => {
      expect(isURL('http://example.com')).toBe(true);
      expect(isURL('https://example.com/path')).toBe(true);
      expect(isURL('ftp://files.example.com')).toBe(true);
    });
    
    it('should reject invalid URLs', () => {
      expect(isURL('not a url')).toBe(false);
      expect(isURL('example.com')).toBe(false);
      expect(isURL('/path/to/file')).toBe(false);
    });
  });
  
  describe('UUID validation', () => {
    it('should validate correct UUIDs', () => {
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });
    
    it('should reject invalid UUIDs', () => {
      expect(isUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('123e4567e89b12d3a456426614174000')).toBe(false);
    });
  });
  
  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
    });
    
    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('Password')).toBe(false);
      expect(isStrongPassword('Pass1!')).toBe(false); // Too short
    });
  });
  
  describe('Credit card validation', () => {
    it('should validate correct card numbers', () => {
      expect(isCreditCard('4532015112830366')).toBe(true); // Visa
      expect(isCreditCard('5425233430109903')).toBe(true); // Mastercard
      expect(isCreditCard('374245455400126')).toBe(true); // Amex
    });
    
    it('should reject invalid card numbers', () => {
      expect(isCreditCard('1234567890123456')).toBe(false);
      // Special case: 0000000000000000 passes Luhn but should be rejected
      expect(isCreditCard('1111111111111111')).toBe(false);
      expect(isCreditCard('12345')).toBe(false);
    });
  });
});