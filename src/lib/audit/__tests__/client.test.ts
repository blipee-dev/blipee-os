import { AuditLogger } from '../client';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: null },
        error: null
      }))
    }
  }))
}));

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockSupabase: any;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    mockSupabase = (createClient as jest.Mock)();
    jest.clearAllMocks();
  });

  describe('logAuth', () => {
    it('should handle anonymous users with null actor.id', async () => {
      await auditLogger.logAuth('login_failed', 'failure', {
        email: 'test@example.com',
        error: 'Invalid credentials'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_events');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          event: expect.objectContaining({
            actor: expect.objectContaining({
              id: null, // Should be null instead of 'anonymous'
              type: 'anonymous',
              email: 'test@example.com'
            })
          })
        })
      ]);
    });

    it('should handle authenticated users with valid UUID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await auditLogger.logAuth('login', 'success', {
        userId,
        email: 'user@example.com'
      });

      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          event: expect.objectContaining({
            actor: expect.objectContaining({
              id: userId, // Should be the actual UUID
              type: 'user',
              email: 'user@example.com'
            })
          })
        })
      ]);
    });
  });

  describe('logSecurityEvent', () => {
    it('should handle system events with null actor.id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      await auditLogger.logSecurityEvent(
        'suspicious_activity',
        'warning',
        'Multiple failed login attempts'
      );

      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          event: expect.objectContaining({
            actor: expect.objectContaining({
              id: null, // Should be null instead of 'system'
              type: 'system'
            })
          })
        })
      ]);
    });
  });
});