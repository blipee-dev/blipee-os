import { describe, it, expect } from '@jest/globals';

describe('Application Constants', () => {
  const CONSTANTS = {
    // API limits
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // Timeouts
    API_TIMEOUT: 30000, // 30 seconds
    UPLOAD_TIMEOUT: 120000, // 2 minutes
    WEBSOCKET_TIMEOUT: 60000, // 1 minute
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Cache
    CACHE_TTL: 3600, // 1 hour
    CACHE_MAX_SIZE: 1000,
    
    // Validation
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    USERNAME_REGEX: /^[a-zA-Z0-9_-]{3,30}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  };
  
  describe('API limits', () => {
    it('should have valid file size limits', () => {
      expect(CONSTANTS.MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(CONSTANTS.MAX_FILE_SIZE).toBeLessThan(CONSTANTS.MAX_REQUEST_SIZE);
    });
    
    it('should have valid rate limits', () => {
      expect(CONSTANTS.RATE_LIMIT_WINDOW).toBeGreaterThan(0);
      expect(CONSTANTS.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
    });
  });
  
  describe('Timeouts', () => {
    it('should have reasonable timeout values', () => {
      expect(CONSTANTS.API_TIMEOUT).toBeGreaterThan(10000);
      expect(CONSTANTS.UPLOAD_TIMEOUT).toBeGreaterThan(CONSTANTS.API_TIMEOUT);
      expect(CONSTANTS.WEBSOCKET_TIMEOUT).toBeGreaterThan(30000);
    });
  });
  
  describe('Pagination', () => {
    it('should have valid pagination settings', () => {
      expect(CONSTANTS.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(CONSTANTS.DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(CONSTANTS.MAX_PAGE_SIZE);
      expect(CONSTANTS.MAX_PAGE_SIZE).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('Validation patterns', () => {
    it('should validate usernames correctly', () => {
      expect(CONSTANTS.USERNAME_REGEX.test('user123')).toBe(true);
      expect(CONSTANTS.USERNAME_REGEX.test('user-name')).toBe(true);
      expect(CONSTANTS.USERNAME_REGEX.test('user_name')).toBe(true);
      expect(CONSTANTS.USERNAME_REGEX.test('u')).toBe(false);
      expect(CONSTANTS.USERNAME_REGEX.test('user@name')).toBe(false);
    });
    
    it('should validate emails correctly', () => {
      expect(CONSTANTS.EMAIL_REGEX.test('user@example.com')).toBe(true);
      expect(CONSTANTS.EMAIL_REGEX.test('user.name@example.co.uk')).toBe(true);
      expect(CONSTANTS.EMAIL_REGEX.test('invalid@')).toBe(false);
      expect(CONSTANTS.EMAIL_REGEX.test('@example.com')).toBe(false);
    });
  });
});