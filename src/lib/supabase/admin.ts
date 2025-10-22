import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return _supabaseAdmin;
}

// Export as a proxy that lazy-loads the client
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseAdmin();
    return client[prop];
  }
});

// Also export the function directly for use in route handlers
export { getSupabaseAdmin };