import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Re-export for compatibility
export { createBrowserClient };

// Create a Supabase client for client-side usage
export function createClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Supabase configuration missing:', { url: !!url, key: !!key });
    // Return a mock client to prevent crashes
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signIn: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any;
  }
  
  return createBrowserClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            return cookies.map(cookie => {
              const [name, value] = cookie.trim().split('=');
              return { name, value };
            });
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (typeof document !== 'undefined') {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${value}`;
              if (options?.maxAge) {
                cookieString += `; Max-Age=${options.maxAge}`;
              }
              if (options?.path) {
                cookieString += `; Path=${options.path}`;
              }
              if (options?.domain) {
                cookieString += `; Domain=${options.domain}`;
              }
              if (options?.secure) {
                cookieString += `; Secure`;
              }
              if (options?.sameSite) {
                cookieString += `; SameSite=${options.sameSite}`;
              }
              document.cookie = cookieString;
            });
          }
        },
      },
    }
  );
}
