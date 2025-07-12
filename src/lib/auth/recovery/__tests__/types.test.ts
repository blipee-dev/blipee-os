import type { 
  RecoveryMethod,
  RecoveryCode,
  RecoverySession,
  RecoveryOptions,
  RecoveryStatus 
} from '../types';

describe('Recovery types', () => {
  it('should create valid RecoveryCode objects', () => {
    const code: RecoveryCode = {
      id: 'code-1',
      code: 'ABCD-EFGH-IJKL',
      userId: 'user-1',
      used: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
    
    expect(code.id).toBe('code-1');
    expect(code.used).toBe(false);
    expect(code.code).toMatch(/^[A-Z]{4}-[A-Z]{4}-[A-Z]{4}$/);
  });

  it('should create valid RecoverySession objects', () => {
    const session: RecoverySession = {
      id: 'session-1',
      userId: 'user-1',
      method: 'email',
      verified: false,
      attemptCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };
    
    expect(session.method).toBe('email');
    expect(session.verified).toBe(false);
    expect(session.attemptCount).toBe(0);
  });

  it('should handle RecoveryMethod types', () => {
    const methods: RecoveryMethod[] = ['email', 'sms', 'recovery_codes', 'backup_email'];
    methods.forEach(method => {
      expect(method).toBeTruthy();
    });
  });

  it('should create valid RecoveryOptions objects', () => {
    const options: RecoveryOptions = {
      methods: ['email', 'recovery_codes'],
      codeLength: 12,
      codeExpiry: 86400000,
      maxAttempts: 3,
      sessionTimeout: 3600000
    };
    
    expect(options.methods).toContain('email');
    expect(options.codeLength).toBe(12);
    expect(options.maxAttempts).toBe(3);
  });

  it('should handle RecoveryStatus enum', () => {
    const statuses: RecoveryStatus[] = ['pending', 'verified', 'completed', 'failed', 'expired'];
    statuses.forEach(status => {
      expect(status).toBeTruthy();
    });
  });

  it('should create recovery code with default format', () => {
    const generateCode = (length: number = 12): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const parts = [];
      for (let i = 0; i < length; i += 4) {
        let part = '';
        for (let j = 0; j < 4; j++) {
          part += chars[Math.floor(Math.random() * chars.length)];
        }
        parts.push(part);
      }
      return parts.join('-');
    };
    
    const code = generateCode();
    expect(code).toMatch(/^[A-Z]{4}-[A-Z]{4}-[A-Z]{4}$/);
  });
});