import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Session Service', () => {
  // Session management mock
  class SessionService {
    sessions = new Map();
    
    createSession(userId, data = {}) {
      const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      const session = {
        id: sessionId,
        userId,
        data,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        lastActivity: new Date()
      };
      
      this.sessions.set(sessionId, session);
      return session;
    }
    
    getSession(sessionId) {
      const session = this.sessions.get(sessionId);
      if (!session) return null;
      
      if (new Date() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return null;
      }
      
      session.lastActivity = new Date();
      return session;
    }
    
    deleteSession(sessionId) {
      return this.sessions.delete(sessionId);
    }
    
    getUserSessions(userId) {
      return Array.from(this.sessions.values())
        .filter(s => s.userId === userId && new Date() <= s.expiresAt);
    }
    
    deleteUserSessions(userId) {
      const userSessions = this.getUserSessions(userId);
      userSessions.forEach(session => {
        this.sessions.delete(session.id);
      });
      return userSessions.length;
    }
    
    extendSession(sessionId, minutes = 60) {
      const session = this.getSession(sessionId);
      if (!session) return false;
      
      session.expiresAt = new Date(Date.now() + minutes * 60000);
      return true;
    }
  }
  
  let service;
  
  beforeEach(() => {
    service = new SessionService();
  });
  
  describe('Session creation', () => {
    it('should create a new session', () => {
      const session = service.createSession('user123', { role: 'admin' });
      
      expect(session.id).toMatch(/^sess_/);
      expect(session.userId).toBe('user123');
      expect(session.data.role).toBe('admin');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });
    
    it('should create unique session IDs', () => {
      const session1 = service.createSession('user123');
      const session2 = service.createSession('user123');
      
      expect(session1.id).not.toBe(session2.id);
    });
  });
  
  describe('Session retrieval', () => {
    it('should get an active session', () => {
      const created = service.createSession('user123');
      const retrieved = service.getSession(created.id);
      
      expect(retrieved).toEqual(expect.objectContaining({
        id: created.id,
        userId: 'user123'
      }));
    });
    
    it('should return null for non-existent session', () => {
      expect(service.getSession('invalid')).toBeNull();
    });
    
    it('should update last activity on retrieval', () => {
      const session = service.createSession('user123');
      const originalActivity = session.lastActivity;
      
      // Wait a bit
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      
      const retrieved = service.getSession(session.id);
      expect(retrieved.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
      
      jest.useRealTimers();
    });
  });
  
  describe('Session expiration', () => {
    it('should delete expired sessions', () => {
      jest.useFakeTimers();
      const session = service.createSession('user123');
      
      // Advance time past expiration
      jest.advanceTimersByTime(3600001); // 1 hour + 1ms
      
      expect(service.getSession(session.id)).toBeNull();
      expect(service.sessions.has(session.id)).toBe(false);
      
      jest.useRealTimers();
    });
  });
  
  describe('User sessions', () => {
    it('should get all sessions for a user', () => {
      service.createSession('user123');
      service.createSession('user123');
      service.createSession('user456');
      
      const userSessions = service.getUserSessions('user123');
      expect(userSessions).toHaveLength(2);
      expect(userSessions.every(s => s.userId === 'user123')).toBe(true);
    });
    
    it('should delete all sessions for a user', () => {
      service.createSession('user123');
      service.createSession('user123');
      service.createSession('user456');
      
      const deleted = service.deleteUserSessions('user123');
      expect(deleted).toBe(2);
      expect(service.getUserSessions('user123')).toHaveLength(0);
      expect(service.getUserSessions('user456')).toHaveLength(1);
    });
  });
  
  describe('Session extension', () => {
    it('should extend session expiration', () => {
      const session = service.createSession('user123');
      const originalExpiry = session.expiresAt.getTime();
      
      const extended = service.extendSession(session.id, 30);
      expect(extended).toBe(true);
      
      const updated = service.getSession(session.id);
      expect(updated.expiresAt.getTime()).toBeGreaterThan(originalExpiry);
    });
    
    it('should return false for non-existent session', () => {
      expect(service.extendSession('invalid')).toBe(false);
    });
  });
});