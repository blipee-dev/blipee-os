import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { createPooledServerClient, createPooledAdminServerClient } from '@/lib/supabase/server-pooled';

// Migration guide to update existing code to use pooled connections

export const MIGRATION_GUIDE = `
# Migrating to Pooled Database Connections

## Why Connection Pooling?

Connection pooling with PgBouncer provides:
- Better resource utilization
- Reduced connection overhead
- Improved performance under load
- Protection against connection exhaustion

## Migration Steps

### 1. Update imports in your API routes

Before:
\`\`\`typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
\`\`\`

After:
\`\`\`typescript
import { createPooledServerClient } from '@/lib/supabase/server-pooled';
\`\`\`

### 2. Update client creation

Before:
\`\`\`typescript
const supabase = await createServerSupabaseClient();
\`\`\`

After:
\`\`\`typescript
const supabase = await createPooledServerClient();
\`\`\`

### 3. For direct SQL queries

The pooled client includes direct SQL access:

\`\`\`typescript
const supabase = await createPooledServerClient();

// Simple query
const results = await supabase.sql.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Transaction
const result = await supabase.sql.transaction(async (client) => {
  await client.query('INSERT INTO logs (action) VALUES ($1)', ['user_login']);
  await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
  return { success: true };
});
\`\`\`

### 4. Environment Variables

Add these to your .env.local:

\`\`\`env
# PgBouncer Configuration
PGBOUNCER_HOST=your-pgbouncer-host
PGBOUNCER_PORT=6432
SUPABASE_DB_PASSWORD=your-db-password

# Optional pool configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
\`\`\`

## Best Practices

1. **Use transactions for related operations**
2. **Keep connections short-lived**
3. **Monitor slow queries**
4. **Set appropriate timeouts**
`;

// Helper function to check if a file needs migration
export async function checkFilesForMigration(): Promise<string[]> {
  const filesToMigrate: string[] = [];
  
  // This would be implemented to scan the codebase
  // For now, return a placeholder
  
  return filesToMigrate;
}

// Wrapper functions that automatically choose pooled vs non-pooled based on config
export async function getSupabaseClient(preferPooled = true) {
  if (preferPooled && process.env.PGBOUNCER_HOST) {
    return createPooledServerClient();
  }
  return createServerSupabaseClient();
}

export function getAdminClient(preferPooled = true) {
  if (preferPooled && process.env.PGBOUNCER_HOST) {
    return createPooledAdminServerClient();
  }
  return createAdminClient();
}