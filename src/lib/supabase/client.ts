import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Create a Supabase client for client-side usage
export function createClient() {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
