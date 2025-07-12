import { jest } from '@jest/globals';
import { 
  ApiKeyService,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  rotateApiKey 
} from '../api-key-service';

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('test-api-key-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-key')
  }))
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({
        data: { id: 'key-1', name: 'Test Key', active: true },
        error: null
      }))
    }))
  }))
}));

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(() => {
    service = new ApiKeyService();
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      const result = await createApiKey({
        name: 'Test API Key',
        userId: 'user-1',
        scopes: ['read', 'write']
      });

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test API Key');
    });

    it('should generate unique keys', async () => {
      const key1 = await createApiKey({ name: 'Key 1', userId: 'user-1' });
      const key2 = await createApiKey({ name: 'Key 2', userId: 'user-1' });

      expect(key1.id).not.toBe(key2.id);
    });

    it('should hash the API key before storage', async () => {
      const crypto = require('crypto');
      await createApiKey({ name: 'Test', userId: 'user-1' });

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => ({
            data: { 
              id: 'key-1', 
              active: true,
              expires_at: new Date(Date.now() + 86400000).toISOString() 
            },
            error: null
          }))
        }))
      });

      const result = await validateApiKey('test-api-key');
      expect(result.valid).toBe(true);
      expect(result.keyId).toBe('key-1');
    });

    it('should reject expired keys', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => ({
            data: { 
              id: 'key-1', 
              active: true,
              expires_at: new Date(Date.now() - 1000).toISOString() 
            },
            error: null
          }))
        }))
      });

      const result = await validateApiKey('test-api-key');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should reject inactive keys', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(() => ({
            data: { id: 'key-1', active: false },
            error: null
          }))
        }))
      });

      const result = await validateApiKey('test-api-key');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('inactive');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      await expect(revokeApiKey('key-1')).resolves.not.toThrow();
    });

    it('should set active to false', async () => {
      const mockUpdate = jest.fn().mockReturnValue({ error: null });
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          update: mockUpdate,
          eq: jest.fn().mockReturnThis()
        }))
      });

      await revokeApiKey('key-1');
      expect(mockUpdate).toHaveBeenCalledWith({ active: false });
    });
  });

  describe('listApiKeys', () => {
    it('should list API keys for user', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn(() => ({
            data: [
              { id: 'key-1', name: 'Key 1' },
              { id: 'key-2', name: 'Key 2' }
            ],
            error: null
          }))
        }))
      });

      const keys = await listApiKeys('user-1');
      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe('Key 1');
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate an API key', async () => {
      const result = await rotateApiKey('key-1');
      expect(result).toHaveProperty('newKey');
      expect(result).toHaveProperty('id');
    });

    it('should revoke old key and create new one', async () => {
      const spy = jest.spyOn(service, 'revokeApiKey');
      await rotateApiKey('key-1');
      expect(spy).toHaveBeenCalledWith('key-1');
    });
  });
});