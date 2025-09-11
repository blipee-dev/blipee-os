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
  const startTime = Date.now();
  console.log('🔍 SignIn handler started');
  
  let body: any;
  try {
    const parseStart = Date.now();
    body = await request.json();
    console.log(`📝 Request parsed in ${Date.now() - parseStart}ms`);

    // Validate input
    const validateStart = Date.now();
    const validated = signInSchema.parse(body);
    console.log(`✅ Validation completed in ${Date.now() - validateStart}ms`);

    // Sign in user with session creation
    const authStart = Date.now();
    console.log('🔐 Starting authentication...');
    const result = await sessionAuth.signIn(
      validated.email,
      validated.password,
      request
    );
    console.log(`🔐 Authentication completed in ${Date.now() - authStart}ms`);

    // Log successful authentication
    if (result.user) {
      const auditStart = Date.now();
      await auditLogger.logAuthSuccess(
        request,
        result.user.id,
        validated.email,
        result.requiresMFA ? 'password' : 'password'
      );
      console.log(`📊 Audit logging completed in ${Date.now() - auditStart}ms`);
    }

    // Check if MFA is required
    if (result.requiresMFA) {
      const totalDuration = Date.now() - startTime;
      console.log(`🔍 SignIn completed (MFA required) in ${totalDuration}ms`);
      
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
    const responseStart = Date.now();
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
    console.log(`🍪 Response creation completed in ${Date.now() - responseStart}ms`);

    const totalDuration = Date.now() - startTime;
    console.log(`🔍 SignIn completed successfully in ${totalDuration}ms`);
    
    return response;
  } catch (error: any) {
    console.error('Error:', error);

    // Log authentication failure
    if (body?.email) {
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
          _error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        _error: error.message || "Failed to sign in",
      },
      { status: 401 },
    );
  }
}

// Export wrapped handler with rate limiting
export const POST = withAuthSecurity(signInHandler, 'signin');
