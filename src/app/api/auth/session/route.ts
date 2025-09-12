import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SessionTracker } from '@/lib/session/tracker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // Get user profile from app_users if needed
    const { data: profile } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    // Return session data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          profile
        },
        expires_at: user.exp ? new Date(user.exp * 1000).toISOString() : null
      }
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get session",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, organizationId } = body;

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (action === 'start') {
      // Start a new session
      const sessionId = await SessionTracker.startSession({
        userId: user.id,
        organizationId,
        ipAddress,
        userAgent
      });

      return NextResponse.json({ 
        success: true, 
        sessionId,
        message: 'Session started' 
      });
    } else if (action === 'end') {
      // End the current session
      await SessionTracker.endSession(user.id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Session ended' 
      });
    } else if (action === 'heartbeat') {
      // Update session activity
      await SessionTracker.updateSessionActivity(user.id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Session activity updated' 
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}