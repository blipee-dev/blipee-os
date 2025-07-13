import { createClient } from '@supabase/supabase-js';

// Only throw errors in production or when actually using the client
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = (() => {
  if (!supabaseUrl || !serviceRoleKey) {
    // Return a proxy that throws an error when any method is accessed
    return new Proxy({} as any, {
      get() {
        throw new Error('Supabase admin client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      }
    });
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
})();