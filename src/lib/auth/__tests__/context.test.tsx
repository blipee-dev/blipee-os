import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context';
import { useRouter } from 'next/navigation';

// Test component that uses the auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
      <div data-testid="session">{auth.session ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="error">{auth.error || 'no error'}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ data: null }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Initialization', () => {
    it('should provide auth context', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should load session on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'session-123', user: { email: 'test@example.com' } } }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session');
      });
    });
  });

  describe('Authentication', () => {
    it('should handle successful session load', async () => {
      const mockSession = { id: 'session-123', user: { email: 'test@example.com' } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSession }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle session load failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('session')).toHaveTextContent('not authenticated');
      });
    });
  });
});
