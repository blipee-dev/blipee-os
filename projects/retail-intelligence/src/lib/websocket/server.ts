import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/lib/logger';
import { validateApiKey } from '@/lib/auth/api-key';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

interface SocketAuth {
  token?: string;
  apiKey?: string;
  storeIds?: string[];
}

interface TrafficUpdate {
  storeId: string;
  currentOccupancy: number;
  entriesLastHour: number;
  exitsLastHour: number;
  timestamp: string;
}

interface SalesUpdate {
  storeId: string;
  transaction: {
    id: string;
    amount: number;
    items: number;
    timestamp: string;
  };
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Map<string, SocketAuth> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/ws',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startDataBroadcasting();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const auth = socket.handshake.auth as SocketAuth;
        
        // Validate JWT token or API key
        if (auth.token) {
          // Validate JWT token
          const decoded = jwt.verify(
            auth.token,
            process.env.NEXTAUTH_SECRET || 'secret'
          ) as any;
          
          socket.data.userId = decoded.sub;
          socket.data.authType = 'jwt';
        } else if (auth.apiKey) {
          // Validate API key
          const isValid = await validateApiKey(auth.apiKey);
          if (!isValid) {
            return next(new Error('Invalid API key'));
          }
          socket.data.authType = 'apiKey';
        } else {
          return next(new Error('No authentication provided'));
        }

        // Store auth info
        this.connectedClients.set(socket.id, auth);
        next();
      } catch (error) {
        logger.error('WebSocket auth error', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('WebSocket client connected', {
        id: socket.id,
        authType: socket.data.authType,
      });

      // Join store-specific rooms
      socket.on('subscribe:store', async (storeId: string) => {
        try {
          // Verify user has access to this store
          const hasAccess = await this.verifyStoreAccess(
            socket.data.userId,
            storeId
          );

          if (hasAccess) {
            socket.join(`store:${storeId}`);
            socket.emit('subscribed:store', { storeId });
            
            // Send current data immediately
            await this.sendCurrentData(socket, storeId);
          } else {
            socket.emit('error', {
              message: 'Access denied to store',
              storeId,
            });
          }
        } catch (error) {
          logger.error('Subscribe error', { error, storeId });
          socket.emit('error', {
            message: 'Failed to subscribe to store',
          });
        }
      });

      // Unsubscribe from store
      socket.on('unsubscribe:store', (storeId: string) => {
        socket.leave(`store:${storeId}`);
        socket.emit('unsubscribed:store', { storeId });
      });

      // Subscribe to analytics updates
      socket.on('subscribe:analytics', (storeId: string) => {
        socket.join(`analytics:${storeId}`);
      });

      // Subscribe to alerts
      socket.on('subscribe:alerts', () => {
        socket.join(`alerts:${socket.data.userId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { id: socket.id });
        this.connectedClients.delete(socket.id);
      });
    });
  }

  private async verifyStoreAccess(
    userId: string,
    storeId: string
  ): Promise<boolean> {
    try {
      // Check user's store access in database
      const result = await db.query(
        `SELECT 1 FROM retail.user_store_access 
         WHERE user_id = $1 AND store_id = $2`,
        [userId, storeId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Store access check failed', { error, userId, storeId });
      return false;
    }
  }

  private async sendCurrentData(socket: any, storeId: string) {
    try {
      // Send current traffic data
      const trafficResult = await db.query(
        `SELECT * FROM retail.foot_traffic_raw 
         WHERE store_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [storeId]
      );

      if (trafficResult.rows.length > 0) {
        const traffic = trafficResult.rows[0];
        socket.emit('traffic:current', {
          storeId,
          currentOccupancy: traffic.count_in - traffic.count_out,
          lastUpdate: traffic.timestamp,
        });
      }

      // Send today's sales summary
      const salesResult = await db.query(
        `SELECT 
          COUNT(*) as transaction_count,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_transaction
         FROM retail.sales_transactions
         WHERE store_id = $1 
         AND DATE(timestamp) = CURRENT_DATE`,
        [storeId]
      );

      if (salesResult.rows.length > 0) {
        socket.emit('sales:summary', {
          storeId,
          ...salesResult.rows[0],
        });
      }
    } catch (error) {
      logger.error('Failed to send current data', { error, storeId });
    }
  }

  private startDataBroadcasting() {
    // Broadcast real-time traffic updates every 30 seconds
    setInterval(async () => {
      try {
        const recentTraffic = await db.query(
          `SELECT DISTINCT ON (store_id) 
            store_id, count_in, count_out, timestamp
           FROM retail.foot_traffic_raw
           WHERE timestamp > NOW() - INTERVAL '1 minute'
           ORDER BY store_id, timestamp DESC`
        );

        recentTraffic.rows.forEach((row) => {
          const update: TrafficUpdate = {
            storeId: row.store_id,
            currentOccupancy: row.count_in - row.count_out,
            entriesLastHour: row.count_in,
            exitsLastHour: row.count_out,
            timestamp: row.timestamp,
          };

          this.io.to(`store:${row.store_id}`).emit('traffic:update', update);
        });
      } catch (error) {
        logger.error('Traffic broadcast error', { error });
      }
    }, 30000); // Every 30 seconds

    // Broadcast sales updates in real-time
    // This would be triggered by a database listener or message queue
    // For now, we'll simulate with polling
    setInterval(async () => {
      try {
        const recentSales = await db.query(
          `SELECT store_id, id, amount, items_count, timestamp
           FROM retail.sales_transactions
           WHERE timestamp > NOW() - INTERVAL '1 minute'
           ORDER BY timestamp DESC
           LIMIT 10`
        );

        recentSales.rows.forEach((row) => {
          const update: SalesUpdate = {
            storeId: row.store_id,
            transaction: {
              id: row.id,
              amount: row.amount,
              items: row.items_count,
              timestamp: row.timestamp,
            },
          };

          this.io.to(`store:${row.store_id}`).emit('sales:new', update);
        });
      } catch (error) {
        logger.error('Sales broadcast error', { error });
      }
    }, 10000); // Every 10 seconds
  }

  // Public methods for sending updates from other parts of the application
  public sendTrafficUpdate(storeId: string, data: TrafficUpdate) {
    this.io.to(`store:${storeId}`).emit('traffic:update', data);
  }

  public sendSalesUpdate(storeId: string, data: SalesUpdate) {
    this.io.to(`store:${storeId}`).emit('sales:new', data);
  }

  public sendAlert(userId: string, alert: any) {
    this.io.to(`alerts:${userId}`).emit('alert:new', alert);
  }

  public sendAnalyticsUpdate(storeId: string, analytics: any) {
    this.io.to(`analytics:${storeId}`).emit('analytics:update', analytics);
  }
}

// Singleton instance
let wsServer: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer(httpServer);
    logger.info('WebSocket server initialized');
  }
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}