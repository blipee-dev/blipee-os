import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getDatabaseConfig } from "@/lib/database/connection-pool";
import { getPooledClient, getPooledAdminClient } from "@/lib/database/pooled-client";

// Get the appropriate database URL based on connection pooling configuration
function getDatabaseUrl(): string {
  const config = getDatabaseConfig();
  
  if (config.pgBouncer.enabled && process.env.PGBOUNCER_DATABASE_URL) {
    // Use PgBouncer URL if available
    return process.env.PGBOUNCER_DATABASE_URL;
  }
  
  // Construct URL based on config
  if (config.pgBouncer.enabled) {
    const { host, port, database, user, password } = config.pgBouncer;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?pgbouncer=true&connection_limit=${config.pool.max}`;
  }
  
  // Fall back to standard Supabase URL
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

// Create a pooled Supabase client for server-side usage
export async function createPooledServerClient() {
  const cookieStore = await cookies();
  const dbUrl = getDatabaseUrl();
  const config = getDatabaseConfig();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookie errors in server components
          }
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pooling': config.pgBouncer.enabled ? 'pgbouncer' : 'direct',
          'x-pool-size': String(config.pool.max),
        },
      },
      // Connection pooling optimizations
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}

// Create pooled admin client for server-side operations that bypass RLS
export function createPooledAdminServerClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const dbUrl = getDatabaseUrl();
  const config = getDatabaseConfig();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {},
        remove() {},
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pooling': config.pgBouncer.enabled ? 'pgbouncer' : 'direct',
          'x-pool-size': String(config.pool.max),
          'x-client-type': 'admin',
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// Export pooled client instances for direct SQL access
export { getPooledClient, getPooledAdminClient };

// Helper to check if connection pooling is enabled
export function isConnectionPoolingEnabled(): boolean {
  return getDatabaseConfig().pgBouncer.enabled;
}

// Helper to get connection pool statistics
export async function getConnectionPoolStats() {
  const config = getDatabaseConfig();
  
  if (!config.pgBouncer.enabled) {
    return {
      enabled: false,
      message: 'Connection pooling is not enabled',
    };
  }
  
  // If we have direct SQL access, query pgbouncer stats
  try {
    const pooledClient = getPooledAdminClient();
    const stats = await pooledClient.sql.query(`
      SELECT 
        database,
        total_xact_count,
        total_query_count,
        total_received,
        total_sent,
        avg_xact_time,
        avg_query_time
      FROM pgbouncer.stats
      WHERE database = $1
    `, [config.pgBouncer.database]);
    
    return {
      enabled: true,
      stats: stats[0] || null,
      config: {
        poolSize: config.pool.max,
        host: config.pgBouncer.host,
        port: config.pgBouncer.port,
      },
    };
  } catch (error) {
    // PgBouncer stats might not be accessible
    return {
      enabled: true,
      error: 'Unable to fetch PgBouncer statistics',
      config: {
        poolSize: config.pool.max,
        host: config.pgBouncer.host,
        port: config.pgBouncer.port,
      },
    };
  }
}