import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signout error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to sign out",
        },
        { status: 500 }
      );
    }

    // Clear any session cookies
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    // Clear Supabase auth cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    allCookies.forEach(cookie => {
      if (cookie.name.includes('sb-') || cookie.name.includes('auth')) {
        response.cookies.delete(cookie.name);
      }
    });

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