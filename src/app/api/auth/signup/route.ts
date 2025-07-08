import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { z } from "zod";
import { UserRole } from "@/types/auth";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  role: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Signup request body:", body);

    // Validate input
    const validated = signUpSchema.parse(body);

    // Sign up user with transaction support
    const result = await authService.signUpWithTransaction(
      validated.email,
      validated.password,
      {
        full_name: validated.fullName,
        company_name: validated.companyName,
        role: validated.role as UserRole,
      },
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);

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
        error: error.message || "Failed to sign up",
      },
      { status: 500 },
    );
  }
}
