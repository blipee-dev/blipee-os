import { NextRequest, NextResponse } from "next/server";
import { onboardingService } from "@/lib/onboarding/service";
import { authService } from "@/lib/auth/service";
import { z } from "zod";

const completeStepSchema = z.object({
  stepId: z.string(),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = completeStepSchema.parse(body);

    const result = await onboardingService.completeStep(
      session.user.id,
      validated.stepId,
      validated.data,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Complete step error:", error);

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
      { success: false, error: error.message || "Failed to complete step" },
      { status: 500 },
    );
  }
}
