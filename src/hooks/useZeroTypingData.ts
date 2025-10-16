import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MetricsData {
  emissions: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
    trend: number;
    unit: string;
  };
  energy: {
    consumption: number;
    renewable: number;
    trend: number;
    unit: string;
  };
  water: {
    consumption: number;
    recycled: number;
    trend: number;
    unit: string;
  };
  waste: {
    generated: number;
    recycled: number;
    diverted: number;
    trend: number;
    unit: string;
  };
}

interface ZeroTypingData {
  organization: any;
  metrics: MetricsData;
  stats: {
    aiSuggestions: number;
    quickActions: number;
    efficiencyGain: number;
  };
  lastUpdated: string;
}

export function useZeroTypingData() {
  const [data, setData] = useState<ZeroTypingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/zero-typing/metrics');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching zero-typing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');

      // Set default/mock data as fallback
      setData({
        organization: null,
        metrics: {
          emissions: {
            scope1: 45,
            scope2: 60,
            scope3: 40,
            total: 145,
            trend: -12,
            unit: 'tCO2e'
          },
          energy: {
            consumption: 2400,
            renewable: 800,
            trend: 5,
            unit: 'MWh'
          },
          water: {
            consumption: 850,
            recycled: 200,
            trend: 0,
            unit: 'm³'
          },
          waste: {
            generated: 12,
            recycled: 8,
            diverted: 10,
            trend: -8,
            unit: 'tons'
          }
        },
        stats: {
          aiSuggestions: 8,
          quickActions: 12,
          efficiencyGain: 45
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    // Get user's organization first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) return;

    // Subscribe to metrics_data changes for this organization
    const newChannel = supabase
      .channel('zero-typing-metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics_data',
          filter: `organization_id=eq.${member.organization_id}`
        },
        (payload) => {
          // Refetch data when changes occur
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_alerts',
          filter: `organization_id=eq.${member.organization_id}`
        },
        (payload) => {
          // Update AI suggestions count
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                aiSuggestions: prev.stats.aiSuggestions + (payload.eventType === 'INSERT' ? 1 : 0)
              }
            };
          });
        }
      )
      .subscribe();

    setChannel(newChannel);
  }, [fetchData]);

  // Initial data fetch and subscription setup
  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        const supabase = createBrowserSupabaseClient();
        supabase.removeChannel(channel);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}