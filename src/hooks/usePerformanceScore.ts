/**
 * Hook to fetch and cache Blipee Performance Index scores
 */

import { useQuery } from '@tanstack/react-query';
import type { BlipeePerformanceIndex } from '@/lib/ai/performance-scoring/blipee-performance-index';

export function useSitePerformanceScore(siteId: string | undefined) {
  return useQuery<BlipeePerformanceIndex>({
    queryKey: ['performance-score', 'site', siteId],
    queryFn: async () => {
      if (!siteId) throw new Error('Site ID is required');

      const response = await fetch(`/api/scoring/site/${siteId}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance score');
      }
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

export function usePortfolioPerformanceScore(organizationId: string | undefined) {
  return useQuery<BlipeePerformanceIndex>({
    queryKey: ['performance-score', 'portfolio', organizationId, 'v3'], // Added v3 to bust cache
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      const response = await fetch(`/api/scoring/portfolio/${organizationId}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Portfolio score fetch failed:', response.status, errorText);
        throw new Error('Failed to fetch portfolio performance score');
      }
      return response.json();
    },
    enabled: !!organizationId,
    staleTime: 0, // Don't cache - always fetch fresh
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch site rankings by performance score
 */
export interface SiteRanking {
  id: string;
  name: string;
  score: number;
  grade: string;
  hasScore: boolean;
}

export function useSiteRankings(organizationId: string | undefined) {
  return useQuery<SiteRanking[]>({
    queryKey: ['site-rankings', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Get all sites for the organization
      const sitesResponse = await fetch(`/api/organizations/${organizationId}/buildings`, {
        credentials: 'include',
      });
      if (!sitesResponse.ok) {
        throw new Error('Failed to fetch sites');
      }

      const sitesData = await sitesResponse.json();
      const sites = sitesData.data || [];

      // Fetch performance score for each site
      const siteScoresPromises = sites.map(async (site: any) => {
        try {
          const scoreResponse = await fetch(`/api/scoring/site/${site.id}`, {
            credentials: 'include',
          });
          if (scoreResponse.ok) {
            const scoreData = await scoreResponse.json();
            return {
              id: site.id,
              name: site.name,
              score: scoreData.overallScore || 0,
              grade: scoreData.grade || 'N/A',
              hasScore: !!scoreData.overallScore
            };
          }
        } catch (err) {
          console.error(`Failed to fetch score for site ${site.id}:`, err);
        }
        return {
          id: site.id,
          name: site.name,
          score: 0,
          grade: 'N/A',
          hasScore: false
        };
      });

      const siteScores = await Promise.all(siteScoresPromises);

      // Filter out sites without scores and sort by score (higher is better)
      return siteScores
        .filter(site => site.hasScore)
        .sort((a, b) => b.score - a.score);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to recalculate performance score
 */
export function useRecalculateScore() {
  return {
    recalculateSiteScore: async (siteId: string) => {
      const response = await fetch(`/api/scoring/site/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to recalculate site score');
      }
      return response.json();
    },
    recalculatePortfolioScore: async (organizationId: string) => {
      const response = await fetch(`/api/scoring/portfolio/${organizationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to recalculate portfolio score');
      }
      return response.json();
    },
  };
}
