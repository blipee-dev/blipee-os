"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session, UserProfile, Organization } from "@/types/auth";
import { auditLogger } from "@/lib/audit/client";

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
    // Only load session on client side
    if (typeof window !== 'undefined') {
      loadSession();
    }
  }, []);

  async function loadSession() {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setSession(data.data);
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      // Check if MFA is required
      if (data.data.requiresMFA) {
        console.log("MFA required, challengeId:", data.data.challengeId);
        // Return the MFA requirement info so the sign-in page can handle it
        return { requiresMFA: true, challengeId: data.data.challengeId };
      }

      setSession(data.data.session);
      console.log("Sign in successful, session:", data.data.session);
      console.log("Onboarding completed:", data.data.session?.user?.onboarding_completed);

      // Log successful login
      await auditLogger.logAuth('login', 'success', {
        email,
        userId: data.data.session?.user?.id,
        metadata: {
          onboarding_completed: data.data.session?.user?.onboarding_completed,
        }
      });

      // Don't redirect here - let the signin page handle redirects based on URL params
      console.log("Sign in successful, session established");
    } catch (err: any) {
      setError(err.message);

      // Log failed login attempt
      await auditLogger.logAuth('login_failed', 'failure', {
        email,
        error: err.message,
      });

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
        body: JSON.stringify({ email, password, ...metadata }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      setSession(data.data.session);
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
      // Log the logout event before signing out
      if (session?.user) {
        await auditLogger.logAuth('logout', 'success', {
          email: session.user.email,
          userId: session.user.id,
        });
      }

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
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
