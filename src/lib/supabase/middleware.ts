import { NextResponse, type NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth/sessions';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Validates session using session-based authentication
 *
 * This function validates the session cookie and returns user data if valid.
 * Session cookies are small (~44 bytes) and never get chunked, solving the
 * chunked cookie problem we had with JWT-based authentication.
 */
export async function updateSession(request: NextRequest) {
  // Create a response object
  const response = NextResponse.next({
    request,
  });

  // Get session token from cookie
  const sessionToken = request.cookies.get('blipee-session')?.value;

  if (!sessionToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 [Middleware] No session cookie found');
    }
    return { response, user: null };
  }

  try {
    // Validate session
    const session = await validateSession(sessionToken);

    if (!session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 [Middleware] Session invalid or expired');
      }
      return { response, user: null };
    }

    // Get user data from Supabase
    const supabase = createAdminClient();
    const { data: userData, error } = await supabase.auth.admin.getUserById(session.user_id);

    if (error || !userData?.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 [Middleware] User not found:', error?.message);
      }
      return { response, user: null };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('👤 [Middleware] Session valid:', userData.user.email);
    }

    // Return user data (matching the old interface for compatibility)
    return {
      response,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        aud: userData.user.aud,
        role: userData.user.role,
        email_confirmed_at: userData.user.email_confirmed_at,
        phone: userData.user.phone,
        confirmed_at: userData.user.confirmed_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        app_metadata: userData.user.app_metadata,
        user_metadata: userData.user.user_metadata,
        identities: userData.user.identities,
        created_at: userData.user.created_at,
        updated_at: userData.user.updated_at,
      }
    };
  } catch (error) {
    console.error('[Middleware] Session validation error:', error);
    return { response, user: null };
  }
}
