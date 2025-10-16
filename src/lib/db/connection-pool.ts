import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  statementTimeout: number;
}

export class ConnectionPool {
  private primaryClient: SupabaseClient<Database> | null = null;
  private readReplicaClients: SupabaseClient<Database>[] = [];
  private currentReadIndex = 0;
  private config: PoolConfig;

  constructor(config?: Partial<PoolConfig>) {
    this.config = {
      maxConnections: config?.maxConnections || 20,
      minConnections: config?.minConnections || 5,
      connectionTimeout: config?.connectionTimeout || 30000,
      idleTimeout: config?.idleTimeout || 10000,
      statementTimeout: config?.statementTimeout || 30000,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // Initialize primary write connection
    const primaryUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!primaryUrl || !anonKey) {
      throw new Error('Supabase URL and anon key are required');
    }

    // Create primary client for writes
    this.primaryClient = createClient<Database>(
      primaryUrl,
      serviceKey || anonKey,
      {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
        global: {
          headers: {
            'x-connection-type': 'write',
          },
        },
      }
    );

    // Initialize read replica connections
    const readReplicaUrls = process.env.SUPABASE_READ_REPLICA_URLS?.split(',') || [];
    
    if (readReplicaUrls.length > 0) {
      this.readReplicaClients = readReplicaUrls.map(url => 
        createClient<Database>(
          url.trim(),
          anonKey,
          {
            db: {
              schema: 'public',
            },
            auth: {
              autoRefreshToken: true,
              persistSession: false, // Read replicas don't need sessions
            },
            global: {
              headers: {
                'x-connection-type': 'read',
              },
            },
          }
        )
      );
    } else {
      // If no read replicas, use primary for reads
      this.readReplicaClients = [this.primaryClient!];
    }

  }

  // Get a connection for write operations
  getWriteClient(): SupabaseClient<Database> {
    if (!this.primaryClient) {
      throw new Error('Connection pool not initialized');
    }
    return this.primaryClient;
  }

  // Get a connection for read operations (round-robin)
  getReadClient(): SupabaseClient<Database> {
    if (this.readReplicaClients.length === 0) {
      return this.getWriteClient();
    }

    const client = this.readReplicaClients[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readReplicaClients.length;
    return client;
  }

  // Execute a read query with automatic failover
  async executeRead<T>(
    query: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    // Try all read replicas
    for (let i = 0; i < this.readReplicaClients.length; i++) {
      try {
        const client = this.getReadClient();
        return await query(client);
      } catch (error) {
        lastError = error as Error;
        console.error(`Read replica ${i} failed:`, error);
      }
    }

    // Fallback to primary if all replicas fail
    try {
      return await query(this.getWriteClient());
    } catch (error) {
      throw lastError || error;
    }
  }

  // Execute a write query
  async executeWrite<T>(
    query: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    return query(this.getWriteClient());
  }

  // Get connection pool statistics
  getStats(): {
    totalConnections: number;
    readReplicas: number;
    isHealthy: boolean;
  } {
    return {
      totalConnections: 1 + this.readReplicaClients.length,
      readReplicas: this.readReplicaClients.length,
      isHealthy: !!this.primaryClient,
    };
  }
}

// Singleton instance
let connectionPool: ConnectionPool | null = null;

export const getConnectionPool = async (): Promise<ConnectionPool> => {
  if (!connectionPool) {
    connectionPool = new ConnectionPool();
    await connectionPool.initialize();
  }
  return connectionPool;
};

// Helper functions for common operations
export async function withReadConnection<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const pool = await getConnectionPool();
  return pool.executeRead(operation);
}

export async function withWriteConnection<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const pool = await getConnectionPool();
  return pool.executeWrite(operation);
}