import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Environment Utilities', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  // Environment helpers
  const getEnv = (key, defaultValue = '') => {
    return process.env[key] || defaultValue;
  };
  
  const getEnvRequired = (key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  };
  
  const getEnvInt = (key, defaultValue = 0) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  };
  
  const getEnvBool = (key, defaultValue = false) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  };
  
  const isProduction = () => process.env['NODE_ENV'] === 'production';
  const isDevelopment = () => process.env['NODE_ENV'] === 'development';
  const isTest = () => process.env['NODE_ENV'] === 'test';
  
  describe('getEnv', () => {
    it('should get environment variable', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnv('TEST_VAR')).toBe('test-value');
    });
    
    it('should return default value if not set', () => {
      expect(getEnv('MISSING_VAR', 'default')).toBe('default');
    });
  });
  
  describe('getEnvRequired', () => {
    it('should get required environment variable', () => {
      process.env.REQUIRED_VAR = 'required-value';
      expect(getEnvRequired('REQUIRED_VAR')).toBe('required-value');
    });
    
    it('should throw if required variable is missing', () => {
      expect(() => getEnvRequired('MISSING_REQUIRED')).toThrow();
    });
  });
  
  describe('getEnvInt', () => {
    it('should parse integer from env', () => {
      process.env.PORT = '3000';
      expect(getEnvInt('PORT')).toBe(3000);
    });
    
    it('should return default for missing int', () => {
      expect(getEnvInt('MISSING_PORT', 8080)).toBe(8080);
    });
  });
  
  describe('getEnvBool', () => {
    it('should parse boolean from env', () => {
      process.env.FEATURE_ENABLED = 'true';
      process.env.FEATURE_DISABLED = 'false';
      
      expect(getEnvBool('FEATURE_ENABLED')).toBe(true);
      expect(getEnvBool('FEATURE_DISABLED')).toBe(false);
    });
    
    it('should return default for missing bool', () => {
      expect(getEnvBool('MISSING_FEATURE', true)).toBe(true);
    });
  });
  
  describe('Environment checks', () => {
    it('should detect test environment', () => {
      expect(isTest()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
    });
  });
});