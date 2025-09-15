import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check if mock auth is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH !== 'true') {
      return NextResponse.json(
        { error: "Mock authentication is not enabled" },
        { status: 403 }
      );
    }

    // Simple mock authentication - accept any email/password for demo
    // In production, this would validate against Supabase
    const mockUser = {
      id: "mock-user-001",
      email: email,
      full_name: email.split('@')[0],
      onboarding_completed: true,
      user_metadata: {
        role: "admin",
        organization: "PLMJ"
      }
    };

    const mockSession = {
      user: mockUser,
      current_organization: {
        id: "org-001",
        name: "PLMJ",
        slug: "plmj"
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Set a mock session cookie
    cookies().set('mock-session', JSON.stringify(mockSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({
      success: true,
      data: {
        session: mockSession,
        user: mockUser
      }
    });
  } catch (error: any) {
    console.error("Mock signin error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}