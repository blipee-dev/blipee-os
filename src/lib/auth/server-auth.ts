import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/sessions';
import { createAdminClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Get the authenticated user from session cookie (for Server Components)
 *
 * This function reads the session cookie, validates it, and returns the user.
 * Use this in Server Components instead of supabase.auth.getUser() which relies on JWT cookies.
 *
 * @returns User object if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * import { getServerUser } from '@/lib/auth/server-auth';
 *
 * export default async function MyPage() {
 *   const user = await getServerUser();
 *   if (!user) {
 *     redirect('/signin');
 *   }
 *   // Use user...
 * }
 * ```
 */
export async function getServerUser(): Promise<User | null> {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('blipee-session')?.value;

    if (!sessionToken) {
      return null;
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return null;
    }

    // Get user from Supabase
    const supabase = createAdminClient();
    const { data: userData, error } = await supabase.auth.admin.getUserById(session.user_id);

    if (error || !userData?.user) {
      return null;
    }

    return userData.user;
  } catch (error) {
    console.error('[Server Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Get the authenticated user from session cookie (for API Routes)
 *
 * This function reads the session cookie from the request, validates it, and returns the user.
 * Use this in API route handlers instead of supabase.auth.getUser() which relies on JWT cookies.
 *
 * @param request - NextRequest object
 * @returns User object if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * import { getAPIUser } from '@/lib/auth/server-auth';
 *
 * export async function GET(request: NextRequest) {
 *   const user = await getAPIUser(request);
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Use user...
 * }
 * ```
 */
export async function getAPIUser(request: NextRequest): Promise<User | null> {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('blipee-session')?.value;

    if (!sessionToken) {
      return null;
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session) {
      return null;
    }

    // Get user from Supabase
    const supabase = createAdminClient();
    const { data: userData, error } = await supabase.auth.admin.getUserById(session.user_id);

    if (error || !userData?.user) {
      return null;
    }

    return userData.user;
  } catch (error) {
    console.error('[API Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Require authentication in Server Components
 *
 * This function throws a redirect if the user is not authenticated.
 * Use this at the top of protected Server Components.
 *
 * @param redirectTo - Optional custom redirect path (defaults to current path)
 * @returns User object
 * @throws Redirect to /signin if not authenticated
 *
 * @example
 * ```typescript
 * import { requireServerAuth } from '@/lib/auth/server-auth';
 *
 * export default async function ProtectedPage() {
 *   const user = await requireServerAuth();
 *   // User is guaranteed to be authenticated here
 * }
 * ```
 */
export async function requireServerAuth(redirectTo?: string): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    const { redirect } = await import('next/navigation');
    const redirectPath = redirectTo || '/signin';
    redirect(redirectPath);
  }

  return user;
}
