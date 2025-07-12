import { useEffect, useState, useCallback } from 'react';
import { useRetailWebSocket } from '@/lib/websocket/client';
import type {
  TrafficUpdate,
  SalesUpdate,
  Alert,
  CurrentTraffic,
  SalesSummary,
} from '@/lib/websocket/client';

interface UseRealTimeDataOptions {
  storeId?: string;
  subscribeToAlerts?: boolean;
  auth?: { token?: string; apiKey?: string };
}

interface RealTimeData {
  traffic: TrafficUpdate | null;
  currentTraffic: CurrentTraffic | null;
  latestSale: SalesUpdate | null;
  salesSummary: SalesSummary | null;
  alerts: Alert[];
  isConnected: boolean;
  error: string | null;
}

export function useRealTimeData({
  storeId,
  subscribeToAlerts = true,
  auth,
}: UseRealTimeDataOptions): RealTimeData {
  const { client, isConnected, error } = useRetailWebSocket(auth);
  const [traffic, setTraffic] = useState<TrafficUpdate | null>(null);
  const [currentTraffic, setCurrentTraffic] = useState<CurrentTraffic | null>(null);
  const [latestSale, setLatestSale] = useState<SalesUpdate | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Subscribe to store updates
  useEffect(() => {
    if (!client || !isConnected || !storeId) return;

    client.subscribeToStore(storeId)
      .then(() => {
        console.log(`Subscribed to store: ${storeId}`);
      })
      .catch((err) => {
        console.error('Failed to subscribe to store:', err);
      });

    return () => {
      client.unsubscribeFromStore(storeId);
    };
  }, [client, isConnected, storeId]);

  // Subscribe to alerts
  useEffect(() => {
    if (!client || !isConnected || !subscribeToAlerts) return;

    client.subscribeToAlerts();
  }, [client, isConnected, subscribeToAlerts]);

  // Set up event handlers
  useEffect(() => {
    if (!client) return;

    const handleTrafficUpdate = (data: TrafficUpdate) => {
      if (data.storeId === storeId) {
        setTraffic(data);
      }
    };

    const handleCurrentTraffic = (data: CurrentTraffic) => {
      if (data.storeId === storeId) {
        setCurrentTraffic(data);
      }
    };

    const handleNewSale = (data: SalesUpdate) => {
      if (data.storeId === storeId) {
        setLatestSale(data);
      }
    };

    const handleSalesSummary = (data: SalesSummary) => {
      if (data.storeId === storeId) {
        setSalesSummary(data);
      }
    };

    const handleAlert = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    };

    // Register event handlers
    client.on('traffic:update', handleTrafficUpdate);
    client.on('traffic:current', handleCurrentTraffic);
    client.on('sales:new', handleNewSale);
    client.on('sales:summary', handleSalesSummary);
    client.on('alert:new', handleAlert);

    // Cleanup
    return () => {
      client.off('traffic:update', handleTrafficUpdate);
      client.off('traffic:current', handleCurrentTraffic);
      client.off('sales:new', handleNewSale);
      client.off('sales:summary', handleSalesSummary);
      client.off('alert:new', handleAlert);
    };
  }, [client, storeId]);

  return {
    traffic,
    currentTraffic,
    latestSale,
    salesSummary,
    alerts,
    isConnected,
    error,
  };
}

// Hook for real-time traffic only
export function useRealTimeTraffic(storeId?: string) {
  const { traffic, currentTraffic, isConnected, error } = useRealTimeData({
    storeId,
    subscribeToAlerts: false,
  });

  return {
    traffic,
    currentTraffic,
    isConnected,
    error,
  };
}

// Hook for real-time sales only
export function useRealTimeSales(storeId?: string) {
  const { latestSale, salesSummary, isConnected, error } = useRealTimeData({
    storeId,
    subscribeToAlerts: false,
  });

  return {
    latestSale,
    salesSummary,
    isConnected,
    error,
  };
}

// Hook for alerts only
export function useRealTimeAlerts() {
  const { alerts, isConnected, error } = useRealTimeData({
    subscribeToAlerts: true,
  });

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  return {
    alerts,
    dismissAlert,
    isConnected,
    error,
  };
}