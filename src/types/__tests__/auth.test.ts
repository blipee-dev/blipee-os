import type { User, Session, AuthError, AuthProvider } from '../auth';

describe('Auth types', () => {
  it('should create valid User objects', () => {
    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        first_name: 'John',
        last_name: 'Doe'
      }
    };
    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
  });

  it('should create valid Session objects', () => {
    const session: Session = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_at: Date.now() + 3600000,
      user: {
        id: 'user-1',
        email: 'test@example.com'
      }
    };
    expect(session.access_token).toBe('token-123');
    expect(session.expires_at).toBeGreaterThan(Date.now());
  });

  it('should create valid AuthError objects', () => {
    const error: AuthError = {
      code: 'invalid_credentials',
      message: 'Invalid email or password',
      status: 401
    };
    expect(error.code).toBe('invalid_credentials');
    expect(error.status).toBe(401);
  });

  it('should handle AuthProvider enum', () => {
    const providers: AuthProvider[] = ['email', 'google', 'github', 'azure'];
    providers.forEach(provider => {
      expect(provider).toBeTruthy();
    });
  });
});