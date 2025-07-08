import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await authService.getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error("Session error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get session",
      },
      { status: 500 },
    );
  }
}
