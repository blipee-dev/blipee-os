import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

export interface WebSocketEvents {
  'traffic:update': (data: TrafficUpdate) => void;
  'traffic:current': (data: CurrentTraffic) => void;
  'sales:new': (data: SalesUpdate) => void;
  'sales:summary': (data: SalesSummary) => void;
  'analytics:update': (data: AnalyticsUpdate) => void;
  'alert:new': (data: Alert) => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface TrafficUpdate {
  storeId: string;
  currentOccupancy: number;
  entriesLastHour: number;
  exitsLastHour: number;
  timestamp: string;
}

export interface CurrentTraffic {
  storeId: string;
  currentOccupancy: number;
  lastUpdate: string;
}

export interface SalesUpdate {
  storeId: string;
  transaction: {
    id: string;
    amount: number;
    items: number;
    timestamp: string;
  };
}

export interface SalesSummary {
  storeId: string;
  transaction_count: number;
  total_revenue: number;
  avg_transaction: number;
}

export interface AnalyticsUpdate {
  storeId: string;
  type: 'conversion' | 'traffic' | 'sales';
  data: any;
}

export interface Alert {
  id: string;
  type: 'traffic_anomaly' | 'sales_milestone' | 'target_achieved' | 'system';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export class RetailWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(
    private url: string = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    private auth?: { token?: string; apiKey?: string }
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.url, {
        path: '/ws',
        auth: this.auth,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        logger.info('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        logger.error('WebSocket connection error', { error: error.message });
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn('WebSocket disconnected', { reason });
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    const events: (keyof WebSocketEvents)[] = [
      'traffic:update',
      'traffic:current',
      'sales:new',
      'sales:summary',
      'analytics:update',
      'alert:new',
      'error',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.emit(event, data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event handling
  on<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  // Subscription methods
  subscribeToStore(storeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('subscribe:store', storeId);
      
      const timeout = setTimeout(() => {
        reject(new Error('Subscription timeout'));
      }, 5000);

      this.socket.once('subscribed:store', ({ storeId: id }) => {
        clearTimeout(timeout);
        if (id === storeId) {
          resolve();
        } else {
          reject(new Error('Subscribed to wrong store'));
        }
      });

      this.socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  unsubscribeFromStore(storeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:store', storeId);
    }
  }

  subscribeToAnalytics(storeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:analytics', storeId);
    }
  }

  subscribeToAlerts() {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:alerts');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionId(): string | null {
    return this.socket?.id || null;
  }
}

// React Hook for WebSocket
import { useEffect, useRef, useState } from 'react';

export function useRetailWebSocket(
  auth?: { token?: string; apiKey?: string }
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RetailWebSocketClient | null>(null);

  useEffect(() => {
    const client = new RetailWebSocketClient(
      process.env.NEXT_PUBLIC_WS_URL,
      auth
    );
    clientRef.current = client;

    client.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });

    // Handle connection status changes
    const checkConnection = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      client.disconnect();
    };
  }, [auth]);

  return {
    client: clientRef.current,
    isConnected,
    error,
  };
}