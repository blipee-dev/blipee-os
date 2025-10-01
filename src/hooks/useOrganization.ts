import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface OrganizationData {
  id: string;
  name: string;
  industry_primary?: string;
  company_size?: string;
  compliance_frameworks?: string[];
}

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    fetchOrganization();
  }, [user]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization data from API
      const response = await fetch('/api/organization');

      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      } else if (response.status === 404) {
        setError('No organization found. Please contact your administrator.');
      } else {
        setError('Failed to load organization data');
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('An error occurred while loading organization data');
    } finally {
      setLoading(false);
    }
  };

  return {
    organization,
    organizationId: organization?.id || null,
    loading,
    error,
    refetch: fetchOrganization
  };
}