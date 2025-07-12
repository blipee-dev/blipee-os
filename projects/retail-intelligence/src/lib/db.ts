import { Pool, PoolConfig } from 'pg';
import { logger } from './logger';

// Database configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

// Database query helper with error handling
export const db = {
  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        logger.warn('Slow query detected', {
          query: text,
          duration,
          rows: result.rowCount,
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error', {
        query: text,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  async getClient() {
    return pool.connect();
  },

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await pool.connect();
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
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  },

  // Graceful shutdown
  async end() {
    await pool.end();
  },
};

// Export pool for advanced usage
export { pool };