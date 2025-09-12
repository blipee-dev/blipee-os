import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Singleton client instance to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Create a Supabase client for client-side usage
export function createClient() {
  // Only create a new instance if we don't have one or if we're on the server
  if (typeof window === 'undefined') {
    // Server-side: always create a new instance
    return createBrowserClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  // Client-side: use singleton pattern
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
