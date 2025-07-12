import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SessionManager } from '../manager';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    scan: jest.fn(),
    pipeline: jest.fn(() => ({
      del: jest.fn(),
      exec: jest.fn()
    }))
  }));
});

describe('Session Manager', () => {
  let sessionManager: SessionManager;
  let mockRedis: any;

  beforeEach(() => {
    sessionManager = new SessionManager();
    mockRedis = (sessionManager as any).redis;
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const session = await sessionManager.createSession('user123', {
        role: 'admin',
        permissions: ['read', 'write']
      });

      expect(session.id).toMatch(/^sess_/);
      expect(session.userId).toBe('user123');
      expect(session.data.role).toBe('admin');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(String),
        'EX',
        3600
      );
    });

    it('should handle custom TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await sessionManager.createSession('user123', {}, 7200);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        7200
      );
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const sessionData = {
        id: 'sess_123',
        userId: 'user123',
        data: { role: 'admin' },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const session = await sessionManager.getSession('sess_123');

      expect(session).toEqual(sessionData);
      expect(mockRedis.get).toHaveBeenCalledWith('session:sess_123');
    });

    it('should return null for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      const session = await sessionManager.getSession('invalid');

      expect(session).toBeNull();
    });

    it('should handle malformed session data', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const session = await sessionManager.getSession('sess_123');

      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const existingSession = {
        id: 'sess_123',
        userId: 'user123',
        data: { role: 'user' },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.ttl.mockResolvedValue(1800);

      const updated = await sessionManager.updateSession('sess_123', {
        role: 'admin',
        newField: 'value'
      });

      expect(updated).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:sess_123',
        expect.stringContaining('"role":"admin"'),
        'EX',
        1800
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await sessionManager.deleteSession('sess_123');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('session:sess_123');
    });

    it('should return false for non-existent session', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await sessionManager.deleteSession('invalid');

      expect(result).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should get all sessions for a user', async () => {
      const sessions = [
        { id: 'sess_1', userId: 'user123', data: {} },
        { id: 'sess_2', userId: 'user123', data: {} }
      ];

      mockRedis.scan.mockResolvedValue(['0', ['session:sess_1', 'session:sess_2']]);
      mockRedis.get.mockImplementation((key) => {
        const id = key.split(':')[1];
        const session = sessions.find(s => s.id === id);
        return Promise.resolve(session ? JSON.stringify(session) : null);
      });

      const userSessions = await sessionManager.getUserSessions('user123');

      expect(userSessions).toHaveLength(2);
      expect(userSessions[0].userId).toBe('user123');
    });
  });

  describe('extendSession', () => {
    it('should extend session TTL', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const result = await sessionManager.extendSession('sess_123', 7200);

      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('session:sess_123', 7200);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired sessions', async () => {
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      mockRedis.scan.mockResolvedValue(['0', ['session:sess_1', 'session:sess_2']]);
      mockRedis.get.mockImplementation(() => 
        Promise.resolve(JSON.stringify({
          expiresAt: new Date(Date.now() - 1000).toISOString()
        }))
      );
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const cleaned = await sessionManager.cleanup();

      expect(cleaned).toBe(2);
      expect(mockPipeline.del).toHaveBeenCalledTimes(2);
    });
  });
});