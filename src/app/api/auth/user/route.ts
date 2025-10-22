import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/sessions";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/user
 * Returns the current user data based on session cookie
 * This endpoint works because the session cookie is small and doesn't get chunked
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('blipee-session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Validate session
    const session = await validateSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user data from Supabase
    const supabase = createAdminClient();
    const { data: user, error } = await supabase.auth.admin.getUserById(session.user_id);

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get app_users data for role and organization info
    const { data: appUser } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.user.id)
      .single();

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.user.id,
          email: user.user.email,
          user_metadata: user.user.user_metadata,
          app_metadata: user.user.app_metadata,
          role: appUser?.role || 'viewer',
          created_at: user.user.created_at,
        },
        session: {
          id: session.id,
          expires_at: session.expires_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
