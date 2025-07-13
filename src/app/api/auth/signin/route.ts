import { NextRequest, NextResponse } from "next/server";
import { sessionAuth } from "@/lib/auth/session-auth";
import { sessionManager } from "@/lib/session/manager";
import { withAuthSecurity } from "@/lib/security/api/wrapper";
import { auditLogger } from "@/lib/audit/logger";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function signInHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = signInSchema.parse(body);

    // Sign in user with session creation
    const result = await sessionAuth.signIn(
      validated.email,
      validated.password,
      request
    );

    // Log successful authentication
    if (result.user) {
      await auditLogger.logAuthSuccess(
        request,
        result.user.id,
        validated.email,
        result.requiresMFA ? 'password' : 'password'
      );
    }

    // Check if MFA is required
    if (result.requiresMFA) {
      return NextResponse.json({
        success: true,
        data: {
          requiresMFA: true,
          challengeId: result.challengeId,
          user: result.user,
        },
      });
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        session: result.session,
      },
    });

    // Set session cookie
    if (result.sessionId) {
      const cookieHeader = sessionManager['sessionService'].generateCookieHeader(result.sessionId);
      response.headers.set('Set-Cookie', cookieHeader);
    }

    return response;
  } catch (error: any) {
    console.error("Signin error:", error);

    // Log authentication failure
    const body = await request.clone().json().catch(() => ({}));
    if (body.email) {
      await auditLogger.logAuthFailure(
        request,
        body.email,
        error.message || "Authentication failed",
        error.code
      );
    }

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

// Export wrapped handler with rate limiting
export const POST = withAuthSecurity(signInHandler, 'signin');
