/**
 * Data Context Indicator
 * Shows what real data is loaded in the conversation
 */

import React, { useEffect, useState } from 'react';
import { Database, Building, Users, Activity } from 'lucide-react';

interface DataContextIndicatorProps {
  organizationId?: string;
}

export function DataContextIndicator({ organizationId }: DataContextIndicatorProps) {
  const [dataContext, setDataContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) return;

    const loadContext = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/organization/context');
        if (response.ok) {
          const data = await response.json();
          setDataContext(data);
        }
      } catch (error) {
        console.error('Failed to load organization context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [organizationId]);

  if (!dataContext && !loading) return null;

  return (
    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <Database className="w-3 h-3" />
        <span className="font-medium">Live Data</span>
      </div>

      {loading ? (
        <div className="mt-2 text-xs text-gray-400">Loading context...</div>
      ) : dataContext && (
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Building className="w-3 h-3" />
            <span>{dataContext.sites?.length || 0} sites</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-3 h-3" />
            <span>{dataContext.devices?.length || 0} devices</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-3 h-3" />
            <span>{dataContext.users?.length || 0} users</span>
          </div>
        </div>
      )}
    </div>
  );
}