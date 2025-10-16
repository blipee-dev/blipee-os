'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, useEffect } from 'react';
import { createCachePersister, MAX_AGE } from '@/lib/cache-persister';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus (prevents unnecessary requests when switching tabs)
            refetchOnWindowFocus: false,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
            // Don't refetch on reconnect
            refetchOnReconnect: false,
          },
        },
      })
  );

  const [persister] = useState(() => createCachePersister());

  // Log cache restoration on mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cacheRestored = typeof window !== 'undefined' && window.localStorage.getItem('blipee-dashboard-cache-v1');
      if (cacheRestored) {
        console.log('🔄 React Query cache restored from localStorage');
      }
    }
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          // Only persist successful queries
          shouldDehydrateQuery: (query) => {
            return query.state.status === 'success';
          },
        },
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </PersistQueryClientProvider>
  );
}
