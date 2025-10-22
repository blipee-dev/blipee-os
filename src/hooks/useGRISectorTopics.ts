/**
 * Hook to fetch GRI sector-specific material topics using React Query
 * Replaces useEffect-based GRI topics fetching
 */

import { useQuery } from '@tanstack/react-query';

export interface GRISectorTopics {
  sector: string;
  topics: any[];
  recommended_dashboards?: any[];
}

export function useGRISectorTopics(enabled: boolean = true) {
  return useQuery<GRISectorTopics>({
    queryKey: ['gri', 'sector-topics'],
    queryFn: async () => {
      const response = await fetch('/api/sustainability/gri-sector-topics');

      if (!response.ok) {
        throw new Error('Failed to fetch GRI sector topics');
      }

      return response.json();
    },
    enabled, // Only fetch when enabled (e.g., when organizationData exists)
    staleTime: 1000 * 60 * 30, // 30 minutes - sector topics don't change often
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
