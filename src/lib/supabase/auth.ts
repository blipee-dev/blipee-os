// Supabase Auth Utilities for blipee OS

import { createClient } from "@supabase/supabase-js";
import { createOrgMembersCompat } from "@/lib/database/organization-members-compat";

// Create Supabase client
export const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Auth helper functions
export const auth = {
  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    return { data, error };
  },

  // Sign in with email/password
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email/password
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { session } = await auth.getSession();
  return !!session;
};

// Helper to require authentication (for API routes)
export const requireAuth = async () => {
  const { session, error } = await auth.getSession();

  if (error || !session) {
    throw new Error("Unauthorized");
  }

  return session;
};

// Helper to get user's organization
export const getUserOrganization = async (userId: string) => {
  const compat = createOrgMembersCompat(supabase);
  const result = await compat.getUserOrganizations(userId);
  
  // Get single result for backward compatibility
  if (result.data && result.data.length > 0) {
    return { data: result.data[0], error: null };
  }
  
  return { data: null, error: result.error };
};

// Helper to create demo data for new users
export const createDemoDataForUser = async (userId: string) => {
  const { data, error } = await supabase.rpc("create_demo_data", {
    user_id: userId,
  });

  return { data, error };
};
