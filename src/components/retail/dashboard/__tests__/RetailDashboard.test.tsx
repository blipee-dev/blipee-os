import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RetailDashboard } from '../RetailDashboard';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('@/lib/hooks/useRetailAuth', () => ({
  useRetailAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Test User', email: 'test@example.com' },
    permissions: ['retail:read', 'retail:analytics'],
    hasPermission: (perm: string) => ['retail:read', 'retail:analytics'].includes(perm),
  }),
  useRetailAnalyticsAccess: () => true,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      stores: [
        { id: 'OML01', name: 'Store 1', code: 'OML01', is_active: true, location: 'Location 1' },
        { id: 'OML02', name: 'Store 2', code: 'OML02', is_active: true, location: 'Location 2' },
      ],
    }),
  } as Response)
);

describe('RetailDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<RetailDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display user information when authenticated', async () => {
    render(<RetailDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('(test@example.com)')).toBeInTheDocument();
    });
  });

  it('should show permission count', async () => {
    render(<RetailDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('2 permissions')).toBeInTheDocument();
    });
  });

  it('should fetch and display stores', async () => {
    render(<RetailDashboard />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/retail/v1/stores');
    });
  });

  it('should render all dashboard sections', async () => {
    render(<RetailDashboard />);
    
    await waitFor(() => {
      // Check for main components presence
      expect(screen.getByText(/store/i)).toBeInTheDocument();
    });
  });
});

describe('RetailDashboard - Authentication', () => {
  it('should show access denied when not authenticated', () => {
    // Mock unauthenticated state
    jest.resetModules();
    jest.doMock('@/lib/hooks/useRetailAuth', () => ({
      useRetailAuth: () => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        permissions: [],
        hasPermission: () => false,
      }),
      useRetailAnalyticsAccess: () => false,
    }));

    const { RetailDashboard } = require('../RetailDashboard');
    render(<RetailDashboard />);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/sign in to access/i)).toBeInTheDocument();
  });
});

describe('RetailDashboard - Permissions', () => {
  it('should show limited access message without analytics permission', async () => {
    // Mock no analytics access
    jest.resetModules();
    jest.doMock('@/lib/hooks/useRetailAuth', () => ({
      useRetailAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
        user: { name: 'Limited User', email: 'limited@example.com' },
        permissions: ['retail:read'],
        hasPermission: (perm: string) => perm === 'retail:read',
      }),
      useRetailAnalyticsAccess: () => false,
    }));

    const { RetailDashboard } = require('../RetailDashboard');
    render(<RetailDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Limited Access')).toBeInTheDocument();
      expect(screen.getByText(/need analytics permissions/i)).toBeInTheDocument();
    });
  });
});