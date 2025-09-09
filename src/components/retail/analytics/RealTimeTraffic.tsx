'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface TrafficData {
  loja: string;
  current_occupancy: number;
  last_update: string;
  last_hour: {
    entries: number;
    exits: number;
  };
  trend: string;
  regions?: {
    [key: string]: number;
  };
}

interface RealTimeTrafficProps {
  storeId: string;
}

export function RealTimeTraffic({ storeId }: RealTimeTrafficProps) {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchTrafficData();
      // Update every 30 seconds
      const interval = setInterval(fetchTrafficData, 30000);
      return () => clearInterval(interval);
    }
  }, [storeId, fetchTrafficData]);

  const fetchTrafficData = async () => {
    try {
      const response = await fetch(`/api/retail/v1/traffic/realtime?loja=${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        setTraffic(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-400" />
          Real-time Traffic
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-white/[0.05] rounded"></div>
          <div className="h-12 bg-white/[0.05] rounded"></div>
        </div>
      </div>
    );
  }

  if (!traffic) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-400" />
          Real-time Traffic
        </h3>
        <div className="text-center py-8 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No traffic data available</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-400" />
          Real-time Traffic
        </h3>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{formatTime(traffic.last_update)}</span>
        </div>
      </div>

      {/* Current Occupancy */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {traffic.current_occupancy}
            </div>
            <div className="text-sm text-gray-300">People in store</div>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon(traffic.trend)}
            <span className="text-sm capitalize text-gray-300">
              {traffic.trend}
            </span>
          </div>
        </div>
      </div>

      {/* Last Hour Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.05] rounded-lg p-3">
          <div className="text-lg font-semibold text-green-400">
            {traffic.last_hour.entries}
          </div>
          <div className="text-xs text-gray-400">Entries (last hour)</div>
        </div>
        <div className="bg-white/[0.05] rounded-lg p-3">
          <div className="text-lg font-semibold text-red-400">
            {traffic.last_hour.exits}
          </div>
          <div className="text-xs text-gray-400">Exits (last hour)</div>
        </div>
      </div>

      {/* Regional Occupancy */}
      {traffic.regions && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-300">Regional Activity</div>
          <div className="space-y-1">
            {Object.entries(traffic.regions).map(([region, count]) => (
              <div key={region} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{region}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-white/[0.1] rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-1.5 rounded-full"
                      style={{ width: `${(count / 50) * 100}%` }}
                    />
                  </div>
                  <span className="text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}