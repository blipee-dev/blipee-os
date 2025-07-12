'use client';

import { useState, useEffect } from 'react';
import { AnalyticsOverview } from '../analytics/AnalyticsOverview';
import { RealTimeTraffic } from '../analytics/RealTimeTraffic';
import { StoreSelector } from '../ui/StoreSelector';
import { ConversationalInterface } from '../ui/ConversationalInterface';
import { QuickInsights } from '../analytics/QuickInsights';
import { useRetailAuth, useRetailAnalyticsAccess } from '@/lib/hooks/useRetailAuth';
import { Shield, AlertCircle, User } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  location?: string;
}

export function RetailDashboard() {
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Authentication and permissions
  const { isAuthenticated, isLoading: authLoading, user, permissions } = useRetailAuth();
  const hasAnalyticsAccess = useRetailAnalyticsAccess();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/retail/v1/stores');
      const data = await response.json();
      
      if (data.success) {
        setStores(data.stores);
        if (data.stores.length > 0) {
          setSelectedStore(data.stores[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading states
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Access Denied</h3>
          <p className="text-gray-400">You need to sign in to access the retail dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info & Store Selection */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-purple-400" />
            <div>
              <span className="text-white font-medium">{user?.name}</span>
              <span className="text-gray-400 text-sm ml-2">({user?.email})</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-300">
              {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <StoreSelector
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={setSelectedStore}
        />
      </div>

      {/* Conversational Interface */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg">
        <ConversationalInterface selectedStore={selectedStore} />
      </div>

      {/* Analytics Grid */}
      {selectedStore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Traffic */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
            <RealTimeTraffic storeId={selectedStore} />
          </div>

          {/* Quick Insights */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
            <QuickInsights storeId={selectedStore} />
          </div>
        </div>
      )}

      {/* Analytics Overview - Only show if user has analytics permission */}
      {selectedStore && hasAnalyticsAccess && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
          <AnalyticsOverview storeId={selectedStore} />
        </div>
      )}

      {/* Permission Notice */}
      {selectedStore && !hasAnalyticsAccess && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="text-yellow-300 font-medium">Limited Access</h3>
              <p className="text-yellow-200/80 text-sm">
                You need analytics permissions to view detailed analytics. Contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}