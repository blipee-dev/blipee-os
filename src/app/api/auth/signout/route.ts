import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await authService.signOut();

    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error: any) {
    console.error("Signout error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sign out",
      },
      { status: 500 },
    );
  }
}
