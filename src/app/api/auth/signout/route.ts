import { NextRequest, NextResponse } from "next/server";
import { deleteSession, validateSession } from "@/lib/auth/sessions";
import { createAdminClient } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/audit/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('blipee-session')?.value;

    if (sessionToken) {
      // Validate session to get user info for audit logging
      const session = await validateSession(sessionToken);

      if (session) {
        // Get user data for audit log
        const supabase = createAdminClient();
        const { data: user } = await supabase.auth.admin.getUserById(session.user_id);

        // Delete session from database
        await deleteSession(sessionToken);

        // Log successful logout
        if (user?.user) {
          await auditLogger.logAuth('logout', 'success', {
            email: user.user.email,
            userId: user.user.id,
          });
        }
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    // Clear session cookie
    response.cookies.set('blipee-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Session Auth] Session deleted and cookie cleared');
    }

    return response;
  } catch (error: any) {
    console.error('Signout error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sign out",
      },
      { status: 500 }
    );
  }
}