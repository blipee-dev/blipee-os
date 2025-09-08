import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Pool } from 'pg';

export interface DatabaseConfig {
  // PgBouncer configuration
  pgBouncer: {
    enabled: boolean;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    poolSize: number;
    statementTimeout: number;
    idleTimeout: number;
    connectionTimeout: number;
  };
  
  // Direct database configuration (fallback)
  direct: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  
  // Connection pool settings
  pool: {
    min: number;
    max: number;
    acquireTimeout: number;
    createTimeout: number;
    destroyTimeout: number;
    idleTimeout: number;
    reapInterval: number;
    createRetryInterval: number;
  };
}

// Get database configuration from environment variables
export function getDatabaseConfig(): DatabaseConfig {
  // During build, return a dummy config
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      pgBouncer: {
        enabled: false,
        host: 'localhost',
        port: 6432,
        database: 'postgres',
        user: 'postgres',
        password: 'postgres',
        poolSize: 20,
        statementTimeout: 30000,
        idleTimeout: 600000,
        connectionTimeout: 10000,
      },
      direct: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'postgres',
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeout: 30000,
        createTimeout: 30000,
        destroyTimeout: 5000,
        idleTimeout: 30000,
        reapInterval: 1000,
        createRetryInterval: 100,
      },
    };
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  
  // Extract project ref from Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/([\w-]+)\.supabase\.co/)?.[1];
  if (!projectRef) throw new Error('Invalid Supabase URL format');
  
  return {
    pgBouncer: {
      enabled: process.env.PGBOUNCER_HOST ? true : false,
      host: process.env.PGBOUNCER_HOST || 'localhost',
      port: parseInt(process.env.PGBOUNCER_PORT || '6432', 10),
      database: `postgres.${projectRef}`,
      user: process.env.SUPABASE_DB_USER || `postgres.${projectRef}`,
      password: process.env.SUPABASE_DB_PASSWORD || '',
      poolSize: parseInt(process.env.PGBOUNCER_POOL_SIZE || '25', 10),
      statementTimeout: parseInt(process.env.PGBOUNCER_STATEMENT_TIMEOUT || '30000', 10),
      idleTimeout: parseInt(process.env.PGBOUNCER_IDLE_TIMEOUT || '10000', 10),
      connectionTimeout: parseInt(process.env.PGBOUNCER_CONNECTION_TIMEOUT || '10000', 10),
    },
    direct: {
      host: process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`,
      port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: process.env.SUPABASE_DB_PASSWORD || '',
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000', 10),
      createTimeout: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),
      destroyTimeout: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT || '5000', 10),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
      reapInterval: parseInt(process.env.DB_POOL_REAP_INTERVAL || '1000', 10),
      createRetryInterval: parseInt(process.env.DB_POOL_RETRY_INTERVAL || '100', 10),
    },
  };
}

// Connection pool singleton
let connectionPool: Pool | null = null;

// Create a connection pool using pg library
export function createConnectionPool(): Pool {
  if (connectionPool) return connectionPool;
  
  const config = getDatabaseConfig();
  const poolConfig = config.pgBouncer.enabled ? config.pgBouncer : config.direct;
  
  connectionPool = new Pool({
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    password: poolConfig.password,
    min: config.pool.min,
    max: config.pool.max,
    idleTimeoutMillis: config.pool.idleTimeout,
    connectionTimeoutMillis: config.pgBouncer.connectionTimeout,
    statement_timeout: config.pgBouncer.statementTimeout,
    
    // Advanced pool settings
    application_name: 'blipee-os',
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
  
  // Pool event handlers
  connectionPool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });
  
  connectionPool.on('connect', (client) => {
    console.log('New client connected to pool');
    // Set session configuration
    client.query('SET statement_timeout = $1', [config.pgBouncer.statementTimeout]);
  });
  
  connectionPool.on('acquire', (client) => {
    console.debug('Client acquired from pool');
  });
  
  connectionPool.on('remove', (client) => {
    console.debug('Client removed from pool');
  });
  
  return connectionPool;
}

// Get a client from the pool
export async function getPoolClient() {
  const pool = createConnectionPool();
  const client = await pool.connect();
  
  // Add query timing
  const originalQuery = client.query.bind(client);
  client.query = async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await originalQuery(...args);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`Slow query detected (${duration}ms):`, args[0]);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Query failed after ${duration}ms:`, args[0], error);
      throw error;
    }
  };
  
  return client;
}

// Execute a query with automatic client management
export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const client = await getPoolClient();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>,
): Promise<T> {
  const client = await getPoolClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check for connection pool
export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  totalClients: number;
  idleClients: number;
  waitingClients: number;
  maxClients: number;
}> {
  const pool = createConnectionPool();
  
  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return {
      healthy: true,
      totalClients: pool.totalCount,
      idleClients: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxClients: pool.options.max || 10,
    };
  } catch (error) {
    return {
      healthy: false,
      totalClients: pool.totalCount,
      idleClients: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxClients: pool.options.max || 10,
    };
  }
}

// Graceful shutdown
export async function closeConnectionPool(): Promise<void> {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('Database connection pool closed');
  }
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing connection pool...');
    await closeConnectionPool();
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing connection pool...');
    await closeConnectionPool();
  });
}