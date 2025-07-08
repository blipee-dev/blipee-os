import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = signInSchema.parse(body);

    // Sign in user
    const result = await authService.signIn(
      validated.email,
      validated.password,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Signin error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sign in",
      },
      { status: 401 },
    );
  }
}
