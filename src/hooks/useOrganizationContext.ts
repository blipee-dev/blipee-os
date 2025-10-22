/**
 * Hook to fetch organization context using React Query
 * Replaces useEffect-based organization data fetching
 */

import { useQuery } from '@tanstack/react-query';

export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  // Add other organization fields as needed
}

export function useOrganizationContext(enabled: boolean = true) {
  return useQuery<OrganizationContext>({
    queryKey: ['organization', 'context'],
    queryFn: async () => {
      const response = await fetch('/api/organization/context');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load organization');
      }

      const data = await response.json();

      if (!data.organization) {
        throw new Error('No organization data returned');
      }

      return data.organization;
    },
    enabled, // Only fetch when enabled (e.g., when user exists)
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
