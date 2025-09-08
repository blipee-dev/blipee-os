import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { sessionManager } from "@/lib/session/manager";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // First check Redis session
    const sessionData = await sessionManager.getSession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        {
          success: false,
          _error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    // Get full session data from auth service
    const session = await authService.getSession();

    if (!session) {
      // Redis session exists but auth session doesn't - clean up
      const cookieHeader = request.headers.get('cookie');
      const sessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
      if (sessionId) {
        await sessionManager.deleteSession(sessionId);
      }
      
      return NextResponse.json(
        {
          success: false,
          _error: "Invalid session",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error:', error);

    return NextResponse.json(
      {
        success: false,
        _error: error.message || "Failed to get session",
      },
      { status: 500 },
    );
  }
}
