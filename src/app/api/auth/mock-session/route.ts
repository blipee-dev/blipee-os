import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if mock auth is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH !== 'true') {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get mock session from cookie
    const mockSessionCookie = cookies().get('mock-session');
    
    if (!mockSessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = JSON.parse(mockSessionCookie.value);

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
}