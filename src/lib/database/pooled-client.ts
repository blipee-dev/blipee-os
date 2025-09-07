import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getDatabaseConfig, query, transaction } from './connection-pool';

export interface PooledSupabaseClient extends SupabaseClient<Database> {
  // Direct SQL execution using connection pool
  sql: {
    query: typeof query;
    transaction: typeof transaction;
  };
}

// Create a pooled Supabase client
export function createPooledSupabaseClient(): PooledSupabaseClient {
  const config = getDatabaseConfig();
  
  // Create standard Supabase client
  const supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          // Add connection pooling hint
          'x-connection-pooling': config.pgBouncer.enabled ? 'pgbouncer' : 'direct',
        },
      },
    }
  ) as PooledSupabaseClient;
  
  // Add direct SQL capabilities using connection pool
  supabaseClient.sql = {
    query,
    transaction,
  };
  
  return supabaseClient;
}

// Create a pooled admin client
export function createPooledAdminClient(): PooledSupabaseClient {
  const config = getDatabaseConfig();
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
  }
  
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-connection-pooling': config.pgBouncer.enabled ? 'pgbouncer' : 'direct',
        },
      },
    }
  ) as PooledSupabaseClient;
  
  // Add direct SQL capabilities
  adminClient.sql = {
    query,
    transaction,
  };
  
  return adminClient;
}

// Singleton instances
let pooledClient: PooledSupabaseClient | null = null;
let pooledAdminClient: PooledSupabaseClient | null = null;

// Get pooled client singleton
export function getPooledClient(): PooledSupabaseClient {
  if (!pooledClient) {
    pooledClient = createPooledSupabaseClient();
  }
  return pooledClient;
}

// Get pooled admin client singleton
export function getPooledAdminClient(): PooledSupabaseClient {
  if (!pooledAdminClient) {
    pooledAdminClient = createPooledAdminClient();
  }
  return pooledAdminClient;
}

// Query builder helper for complex queries
export class PooledQueryBuilder<T> {
  private client: PooledSupabaseClient;
  private query: string = '';
  private params: any[] = [];
  private paramCounter = 1;

  constructor(client: PooledSupabaseClient) {
    this.client = client;
  }

  select(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns.join(', ') : columns;
    this.query = `SELECT ${cols}`;
    return this;
  }

  from(table: string): this {
    this.query += ` FROM ${table}`;
    return this;
  }

  where(condition: string, value?: any): this {
    if (this.query.includes('WHERE')) {
      this.query += ' AND';
    } else {
      this.query += ' WHERE';
    }
    
    if (value !== undefined) {
      this.query += ` ${condition} = $${this.paramCounter++}`;
      this.params.push(value);
    } else {
      this.query += ` ${condition}`;
    }
    
    return this;
  }

  join(type: 'INNER' | 'LEFT' | 'RIGHT', table: string, on: string): this {
    this.query += ` ${type} JOIN ${table} ON ${on}`;
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.query += ` LIMIT $${this.paramCounter++}`;
    this.params.push(count);
    return this;
  }

  offset(count: number): this {
    this.query += ` OFFSET $${this.paramCounter++}`;
    this.params.push(count);
    return this;
  }

  async execute(): Promise<T[]> {
    return this.client.sql.query<T>(this.query, this.params);
  }

  toString(): string {
    return this.query;
  }
}

// Helper to create query builder
export function createQueryBuilder<T = any>(
  client?: PooledSupabaseClient
): PooledQueryBuilder<T> {
  return new PooledQueryBuilder<T>(client || getPooledClient());
}