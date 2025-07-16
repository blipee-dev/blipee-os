import { createClient } from '@supabase/supabase-js';

// Only throw errors in production or when actually using the client
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY'];

// Create a lazy-loaded Supabase admin client
let _supabaseAdmin: any = null;

export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    // Initialize on first access
    if (!_supabaseAdmin) {
      if (!supabaseUrl || !serviceRoleKey) {
        // During build, return a mock that doesn't throw
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
          console.warn('Supabase admin client not configured. Using mock client.');
          return () => Promise.resolve({ data: null, error: null });
        }
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
    }

    return _supabaseAdmin[prop];
  }
});