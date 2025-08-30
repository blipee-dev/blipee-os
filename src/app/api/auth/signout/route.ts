import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { sessionManager } from "@/lib/session/manager";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create response first
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    // Delete Redis session and clear cookie
    const cookieHeader = request.headers.get('cookie');
    const sessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
    
    if (sessionId) {
      await sessionManager.deleteSession(sessionId, response);
    }

    // Sign out from Supabase
    await authService.signOut();

    return response;
  } catch (error: any) {
    console.error('Error:', error);

    return NextResponse.json(
      {
        success: false,
        _error: errorerror.message || "Failed to sign out",
      },
      { status: 500 },
    );
  }
}
