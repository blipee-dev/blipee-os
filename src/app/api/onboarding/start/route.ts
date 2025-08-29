import { NextRequest, NextResponse } from "next/server";
import { onboardingService } from "@/lib/onboarding/service";
import { authService } from "@/lib/auth/service";
import { z } from "zod";
import type { UserRole } from "@/types/auth";

const startOnboardingSchema = z.object({
  role: z.string(),
});

export async function POST(_request: NextRequest) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, _error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = startOnboardingSchema.parse(body);

    const flow = await onboardingService.startOnboarding(
      session.user.id,
      validated.role as UserRole,
    );

    return NextResponse.json({
      success: true,
      data: flow,
    });
  } catch (_error: any) {
    console.error("Start onboarding _error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          _error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, _error: error.message || "Failed to start onboarding" },
      { status: 500 },
    );
  }
}
