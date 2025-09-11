import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { customCookieAdapter } from "./custom-cookie-adapter";

// Create a Supabase client for client-side usage
export function createClient() {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: customCookieAdapter,
      // Use raw encoding to avoid the base64 parsing issue
      cookieEncoding: 'raw'
    }
  );
}
