import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Singleton client instance to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Create a Supabase client for client-side usage
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
