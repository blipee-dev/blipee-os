import { renderHook, act } from '@testing-library/react';
import { 
  useRetailAuth, 
  useRetailReadAccess, 
  useRetailAnalyticsAccess, 
  useRetailAdminAccess,
  useRetailPermissions 
} from '../useRetailAuth';

describe('useRetailAuth', () => {
  it('should start with loading state', () => {
    const { result } = renderHook(() => useRetailAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should authenticate user after mount', async () => {
    const { result } = renderHook(() => useRetailAuth());

    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
    expect(result.current.user.email).toBe('demo@blipee.ai');
  });

  it('should provide user permissions', async () => {
    const { result } = renderHook(() => useRetailAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.permissions).toContain('retail:read');
    expect(result.current.permissions).toContain('retail:write');
    expect(result.current.permissions).toContain('retail:analytics');
    expect(result.current.permissions).toContain('retail:store_management');
  });

  it('should provide hasPermission function', async () => {
    const { result } = renderHook(() => useRetailAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.hasPermission('retail:read')).toBe(true);
    expect(result.current.hasPermission('retail:admin')).toBe(false);
  });

  it('should provide organization info', async () => {
    const { result } = renderHook(() => useRetailAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.organization).toBeDefined();
    expect(result.current.organization.name).toBe('Demo Organization');
    expect(result.current.organization.type).toBe('retail');
  });

  it('should provide context object', async () => {
    const { result } = renderHook(() => useRetailAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.context).toBeDefined();
    expect(result.current.context?.user).toBe(result.current.user);
    expect(result.current.context?.organization).toBe(result.current.organization);
    expect(result.current.context?.permissions).toEqual(result.current.permissions);
    expect(result.current.context?.features).toContain('real-time-traffic');
  });
});

describe('Permission Hooks', () => {
  describe('useRetailReadAccess', () => {
    it('should return true for demo user', async () => {
      const { result } = renderHook(() => useRetailReadAccess());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useRetailAnalyticsAccess', () => {
    it('should return true for demo user', async () => {
      const { result } = renderHook(() => useRetailAnalyticsAccess());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useRetailAdminAccess', () => {
    it('should return false for demo user', async () => {
      const { result } = renderHook(() => useRetailAdminAccess());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(false);
    });
  });

  describe('useRetailPermissions', () => {
    it('should return true when all permissions granted', async () => {
      const { result } = renderHook(() => 
        useRetailPermissions(['retail:read', 'retail:analytics'])
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(true);
    });

    it('should return false when any permission missing', async () => {
      const { result } = renderHook(() => 
        useRetailPermissions(['retail:read', 'retail:admin'])
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBe(false);
    });
  });
});