import { getEnvVar, requireEnvVar, isProduction, isDevelopment, isTest } from '../env';
import { jest } from '@jest/globals';

describe('env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvVar', () => {
    it('should get environment variable', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return default value if not set', () => {
      expect(getEnvVar('MISSING_VAR', 'default')).toBe('default');
    });

    it('should return undefined if not set and no default', () => {
      expect(getEnvVar('MISSING_VAR')).toBeUndefined();
    });
  });

  describe('requireEnvVar', () => {
    it('should get required environment variable', () => {
      process.env.REQUIRED_VAR = 'required-value';
      expect(requireEnvVar('REQUIRED_VAR')).toBe('required-value');
    });

    it('should throw if required variable is missing', () => {
      expect(() => requireEnvVar('MISSING_REQUIRED')).toThrow();
    });
  });

  describe('environment checks', () => {
    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
      expect(isTest()).toBe(false);
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(true);
    });
  });
});