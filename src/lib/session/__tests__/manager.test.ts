import { 
  SessionManager,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  isSessionValid 
} from '../manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = createSession({
        userId: 'user-1',
        email: 'test@example.com'
      });

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('token');
      expect(session.userId).toBe('user-1');
      expect(session.email).toBe('test@example.com');
    });

    it('should set expiration time', () => {
      const session = createSession({
        userId: 'user-1',
        email: 'test@example.com'
      });

      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate unique session IDs', () => {
      const session1 = createSession({ userId: 'user-1' });
      const session2 = createSession({ userId: 'user-1' });

      expect(session1.id).not.toBe(session2.id);
      expect(session1.token).not.toBe(session2.token);
    });
  });

  describe('getSession', () => {
    it('should retrieve session by token', async () => {
      const created = createSession({ userId: 'user-1' });
      const session = await getSession(created.token);

      expect(session).toBeDefined();
      expect(session?.userId).toBe('user-1');
    });

    it('should return null for invalid token', async () => {
      const session = await getSession('invalid-token');
      expect(session).toBeNull();
    });

    it('should return null for expired session', async () => {
      const created = createSession({ 
        userId: 'user-1',
        expiresIn: -1000 // Already expired
      });

      const session = await getSession(created.token);
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const session = createSession({ userId: 'user-1' });
      
      await updateSession(session.token, {
        lastActivity: Date.now(),
        metadata: { theme: 'dark' }
      });

      const updated = await getSession(session.token);
      expect(updated?.metadata).toEqual({ theme: 'dark' });
    });

    it('should extend session expiration', async () => {
      const session = createSession({ userId: 'user-1' });
      const originalExpiry = session.expiresAt;

      await updateSession(session.token, { extendExpiration: true });

      const updated = await getSession(session.token);
      expect(updated?.expiresAt).toBeGreaterThan(originalExpiry);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      const session = createSession({ userId: 'user-1' });
      
      await deleteSession(session.token);
      const deleted = await getSession(session.token);
      
      expect(deleted).toBeNull();
    });

    it('should handle deleting non-existent session', async () => {
      await expect(deleteSession('invalid-token')).resolves.not.toThrow();
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const session = {
        id: '1',
        token: 'token',
        userId: 'user-1',
        expiresAt: Date.now() + 3600000
      };

      expect(isSessionValid(session)).toBe(true);
    });

    it('should return false for expired session', () => {
      const session = {
        id: '1',
        token: 'token',
        userId: 'user-1',
        expiresAt: Date.now() - 1000
      };

      expect(isSessionValid(session)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(isSessionValid(null)).toBe(false);
    });
  });
});