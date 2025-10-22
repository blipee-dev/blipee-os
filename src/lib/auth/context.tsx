"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session, UserProfile, Organization } from "@/types/auth";

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void | { requiresMFA: boolean; challengeId: string }>;
  signUp: (email: string, password: string, metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load session on client side using session-based auth
    // This works because the session cookie is small and doesn't get chunked
    if (typeof window !== 'undefined') {
      loadSession();
    }
  }, []);

  async function loadSession() {
    try {
      // Call the new /api/auth/user endpoint that works with session cookies
      const response = await fetch("/api/auth/user", {
        credentials: 'include' // Ensure cookies are sent with request
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Load organization data
          let currentOrganization = null;
          let organizations = [];

          try {
            const orgResponse = await fetch("/api/organization/context", {
              credentials: 'include'
            });

            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              if (orgData.organization) {
                currentOrganization = orgData.organization;
              }
            }
          } catch (orgErr) {
            console.error("Failed to load organization:", orgErr);
          }

          // Map the response to our session format
          setSession({
            user: data.data.user,
            current_organization: currentOrganization,
            organizations: organizations,
            permissions: [],
          });
        }
      }
      // 401 is expected when not authenticated - no need to log
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Ensure cookies are sent and received
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data._error || data.error || "Sign in failed");
      }

      // Session cookie is set by the server, reload session data
      await loadSession();

      // Note: Authentication logging is handled server-side in /api/auth/signin
      // Don't redirect here - let the signin page handle redirects based on URL params
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, metadata: any) {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Ensure cookies are sent and received
        body: JSON.stringify({ email, password, ...metadata }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data._error || data.error || "Sign up failed");
      }

      // Session cookie is set by the server, reload session data
      await loadSession();

      // Don't redirect here - let the component handle redirects
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);

    try {
      // Note: Logout logging is handled server-side in /api/auth/signout
      // No need to log here to avoid CSRF issues and redundant logs

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent with request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sign out failed");
      }

      // Clear session and local storage
      setSession(null);

      // Clear any local storage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }

      // Redirect to signin page
      router.push("/signin");
    } catch (err: any) {
      setError(err.message);
      console.error('Sign out error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function switchOrganization(organizationId: string) {
    if (!session) return;

    const org = session.organizations.find((o) => o.id === organizationId);
    if (!org) {
      setError("Organization not found");
      return;
    }

    // Update current organization in session
    setSession({
      ...session,
      current_organization: org,
    });

    // Refresh page to reload with new org context
    router.refresh();
  }

  async function refreshSession() {
    await loadSession();
  }

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    organization: session?.current_organization || null,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    switchOrganization,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR or when not wrapped in AuthProvider, return a default value
    if (typeof window === 'undefined') {
      return {
        session: null,
        user: null,
        organization: null,
        loading: true,
        error: null,
        signIn: async () => undefined,
        signUp: async () => {},
        signOut: async () => {},
        switchOrganization: async () => {},
        refreshSession: async () => {},
      } as AuthContextType;
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth(redirectTo = "/signin") {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push(redirectTo);
    }
  }, [session, loading, router, redirectTo]);

  return { session, loading };
}

export function usePermission(resource: string, action: string): boolean {
  const { session } = useAuth();

  if (!session) return false;

  return (
    session.permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action,
    ) ||
    session.permissions.some(
      (permission) => permission.resource === "*" && permission.action === "*",
    )
  );
}
