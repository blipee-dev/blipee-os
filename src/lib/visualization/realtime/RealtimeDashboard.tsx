'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget, WidgetConfig } from '../widgets/widget-library';
import { DynamicChart } from '../charts/DynamicChart';
import { Activity, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';

export interface RealtimeConfig {
  socketUrl?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  channels?: string[];
  updateInterval?: number;
}

export interface RealtimeData {
  widgetId: string;
  data: any;
  timestamp: number;
}

export interface RealtimeDashboardProps {
  widgets: WidgetConfig[];
  config?: RealtimeConfig;
  onDataUpdate?: (data: RealtimeData) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
  widgets: initialWidgets,
  config = {},
  onDataUpdate,
  onConnectionChange
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [realtimeData, setRealtimeData] = useState<Map<string, any>>(new Map());
  const [dataHistory, setDataHistory] = useState<Map<string, any[]>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const updateQueueRef = useRef<RealtimeData[]>([]);

  const {
    socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    channels = ['dashboard', 'metrics', 'alerts'],
    updateInterval = 1000
  } = config;

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) return;


    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: reconnectDelay,
      reconnectionAttempts: maxReconnectAttempts
    });

    // Connection events
    socketRef.current.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      onConnectionChange?.(true);

      // Subscribe to channels
      channels.forEach(channel => {
        socketRef.current?.emit('subscribe', channel);
      });
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      onConnectionChange?.(false);
    });

    socketRef.current.on('reconnect_attempt', (attempt) => {
      setReconnecting(true);
      reconnectAttemptsRef.current = attempt;
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setReconnecting(false);
    });

    // Data events
    socketRef.current.on('dashboard:update', handleDashboardUpdate);
    socketRef.current.on('metrics:update', handleMetricsUpdate);
    socketRef.current.on('alert:new', handleNewAlert);
    socketRef.current.on('telemetry:stream', handleTelemetryStream);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [socketUrl, reconnectDelay, maxReconnectAttempts, channels, onConnectionChange]);

  // Handle dashboard updates
  const handleDashboardUpdate = useCallback((data: any) => {

    if (data.widgetId && data.payload) {
      const update: RealtimeData = {
        widgetId: data.widgetId,
        data: data.payload,
        timestamp: Date.now()
      };

      // Queue update for batch processing
      updateQueueRef.current.push(update);

      // Update realtime data store
      setRealtimeData(prev => {
        const newData = new Map(prev);
        newData.set(data.widgetId, data.payload);
        return newData;
      });

      // Add to history
      setDataHistory(prev => {
        const newHistory = new Map(prev);
        const widgetHistory = newHistory.get(data.widgetId) || [];
        widgetHistory.push({
          ...data.payload,
          timestamp: Date.now()
        });

        // Keep only last 100 data points
        if (widgetHistory.length > 100) {
          widgetHistory.shift();
        }

        newHistory.set(data.widgetId, widgetHistory);
        return newHistory;
      });

      onDataUpdate?.(update);
    }

    setLastUpdate(Date.now());
  }, [onDataUpdate]);

  // Handle metrics updates
  const handleMetricsUpdate = useCallback((metrics: any) => {

    // Update metric widgets
    setWidgets(prev => prev.map(widget => {
      if (widget.type === 'metric-card' && metrics[widget.id]) {
        return {
          ...widget,
          data: {
            ...widget.data,
            ...metrics[widget.id]
          }
        };
      }
      return widget;
    }));
  }, []);

  // Handle new alerts
  const handleNewAlert = useCallback((alert: any) => {

    // Find alert widgets and update them
    setWidgets(prev => prev.map(widget => {
      if (widget.type === 'alert-card') {
        return {
          ...widget,
          data: {
            ...widget.data,
            alerts: [alert, ...(widget.data.alerts || [])].slice(0, 10)
          }
        };
      }
      return widget;
    }));
  }, []);

  // Handle telemetry stream
  const handleTelemetryStream = useCallback((telemetry: any) => {
    // Update chart widgets with streaming data
    setWidgets(prev => prev.map(widget => {
      if (widget.type.includes('chart') && telemetry.chartId === widget.id) {
        const currentData = widget.data || [];
        const newData = [...currentData, telemetry.point];

        // Keep only last 50 points for performance
        if (newData.length > 50) {
          newData.shift();
        }

        return {
          ...widget,
          data: newData
        };
      }
      return widget;
    }));
  }, []);

  // Process update queue periodically
  useEffect(() => {
    const processQueue = () => {
      if (updateQueueRef.current.length > 0) {
        const updates = updateQueueRef.current.splice(0, updateQueueRef.current.length);

        // Batch update widgets
        setWidgets(prev => {
          const updatedWidgets = [...prev];

          updates.forEach(update => {
            const widgetIndex = updatedWidgets.findIndex(w => w.id === update.widgetId);
            if (widgetIndex !== -1) {
              updatedWidgets[widgetIndex] = {
                ...updatedWidgets[widgetIndex],
                data: update.data
              };
            }
          });

          return updatedWidgets;
        });
      }
    };

    const interval = setInterval(processQueue, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  // Send data to server
  const sendData = useCallback((channel: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(channel, data);
    } else {
      console.warn('Cannot send data: WebSocket not connected');
    }
  }, []);

  // Request data refresh
  const requestRefresh = useCallback((widgetId?: string) => {
    sendData('dashboard:refresh', { widgetId, timestamp: Date.now() });
  }, [sendData]);

  // Render connection status
  const renderConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {!connected && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]"
          >
            {reconnecting ? (
              <>
                <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                <span className="text-yellow-500 text-sm">
                  Reconnecting... ({reconnectAttemptsRef.current}/{maxReconnectAttempts})
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-500 text-sm">Disconnected</span>
              </>
            )}
          </motion.div>
        )}

        {connected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Wifi className="w-5 h-5 text-green-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render activity indicator
  const renderActivityIndicator = () => {
    const isActive = Date.now() - lastUpdate < 2000;

    return (
      <AnimatePresence>
        {isActive && (
          <motion.div
            key={lastUpdate}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-white/60 text-sm">Receiving data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="relative min-h-screen">
      {renderConnectionStatus()}
      {renderActivityIndicator()}

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {widgets.map((widget) => {
            const history = dataHistory.get(widget.id);
            const hasRealtimeData = realtimeData.has(widget.id);

            return (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative ${hasRealtimeData ? 'ring-2 ring-blue-500/30' : ''}`}
              >
                {/* Realtime indicator */}
                {hasRealtimeData && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400 text-xs">Live</span>
                    </div>
                  </div>
                )}

                {/* Widget content */}
                <Widget {...widget} />

                {/* Sparkline for historical data */}
                {history && history.length > 1 && widget.type.includes('metric') && (
                  <div className="absolute bottom-2 left-2 right-2 h-8 opacity-30">
                    <DynamicChart
                      type="line"
                      data={history.slice(-20)}
                      height={30}
                      options={{
                        dataKeys: ['value'],
                        showAxis: false,
                        showGrid: false
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stream log for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 rounded-lg backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]">
            <h3 className="text-white/80 text-sm font-semibold mb-2">Data Stream Log</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Array.from(realtimeData.entries()).slice(0, 5).map(([widgetId, data]) => (
                <div key={widgetId} className="text-white/50 text-xs font-mono">
                  {new Date().toLocaleTimeString()}: Widget {widgetId} updated
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for using realtime data in other components
export const useRealtimeData = (widgetId: string, socketUrl?: string) => {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = socketUrl || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';

    socketRef.current = io(url, {
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    socketRef.current.on(`widget:${widgetId}`, (newData: any) => {
      setData(newData);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [widgetId, socketUrl]);

  return { data, connected };
};

export default RealtimeDashboard;