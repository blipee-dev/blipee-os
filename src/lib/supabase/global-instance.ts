import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Store the instance on the global window object to ensure true singleton
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient<Database>;
  }
}

export function getGlobalSupabaseClient(): SupabaseClient<Database> {
  // Only create in browser environment
  if (typeof window === 'undefined') {
    // For SSR, always create a new instance
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Check if we already have a client on window
  if (!window.__supabaseClient) {
    window.__supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return window.__supabaseClient;
}