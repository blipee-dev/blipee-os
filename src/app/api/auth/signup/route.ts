import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import { z } from "zod";
import { UserRole } from "@/types/auth";
import { withErrorHandler } from "@/lib/api/error-handler";
import { rateLimit, RateLimitConfigs } from "@/lib/api/rate-limit";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  role: z.string().optional(),
});

const limiter = rateLimit(RateLimitConfigs.auth.signup);

export const POST = withErrorHandler(async ((_request: NextRequest) => {
  // Check rate limit
  await limiter.check(request);

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
      ...(validated.companyName && { company_name: validated.companyName }),
      role: validated.role as UserRole,
    },
  );

  return NextResponse.json({
    success: true,
    data: result,
  });
});
