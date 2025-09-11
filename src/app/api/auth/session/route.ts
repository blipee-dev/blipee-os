import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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