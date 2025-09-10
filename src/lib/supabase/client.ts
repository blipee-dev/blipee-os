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
            const validCookies: { name: string; value: string }[] = [];
            
            cookies.forEach(cookie => {
              try {
                const [name, ...valueParts] = cookie.trim().split('=');
                const value = valueParts.join('='); // Handle values with = signs
                
                if (!name || !value) return;
                
                // Skip malformed cookies that start with base64- prefix
                if (value.startsWith('base64-')) {
                  // Try to clear this malformed cookie
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                  console.warn(`Cleared malformed cookie: ${name}`);
                  return;
                }
                
                // Only include valid cookies
                validCookies.push({ name, value });
              } catch (e) {
                console.warn('Error parsing cookie:', e);
              }
            });
            
            return validCookies;
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
