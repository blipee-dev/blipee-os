import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {

    // Method 1: Via request headers
    const cookieHeader = request.headers.get('cookie');

    // Method 2: Via Next.js cookies()
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Method 3: Specific cookie
    const sessionCookie = cookieStore.get('blipee-session');

    return NextResponse.json({
      success: true,
      data: {
        headerMethod: cookieHeader,
        cookiesMethod: allCookies.map(c => ({ name: c.name, value: c.value })),
        sessionCookie: sessionCookie?.value || null
      }
    });
  } catch (error: any) {
    console.error('Cookie Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}