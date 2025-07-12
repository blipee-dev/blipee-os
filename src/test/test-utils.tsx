import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RenderOptions } from '@testing-library/react';

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
}

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};

// All the providers for tests
function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={mockSupabaseClient as any}>
        {children}
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

// Custom render function
export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';

// Mock factories
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'viewer',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockOrganization = (overrides?: Partial<any>) => ({
  id: 'test-org-id',
  name: 'Test Organization',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockBuilding = (overrides?: Partial<any>) => ({
  id: 'test-building-id',
  name: 'Test Building',
  organization_id: 'test-org-id',
  address: '123 Test St',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Common test patterns
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock implementations for common libraries
export const mockDOMPurify = {
  sanitize: jest.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  setConfig: jest.fn(),
  isSupported: true,
};

export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: 200,
      statusText: 'OK',
    } as Response)
  );
};

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};