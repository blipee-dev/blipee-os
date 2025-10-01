import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { createClient } from '@/lib/supabase/client';

interface Site {
  id: string;
  name: string;
  location?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  total_area_sqm?: number;
  total_employees?: number;
  type?: string;
}

export function useSites() {
  const { organizationId } = useOrganization();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setSites([]);
      setLoading(false);
      return;
    }

    fetchSites();
  }, [organizationId]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('sites')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setSites(data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites');
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    sites,
    loading,
    error,
    refetch: fetchSites
  };
}