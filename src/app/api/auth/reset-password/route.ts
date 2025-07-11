import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = resetPasswordSchema.parse(body);

    // Send reset password email
    await authService.resetPassword(validated.email);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send reset email. Please try again.",
      },
      { status: 500 },
    );
  }
}
