import { NextRequest, NextResponse } from "next/server";
import { withAuthSecurity } from "@/lib/security/api/wrapper";
import { auditLogger } from "@/lib/audit/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/sessions";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function signInHandler(request: NextRequest) {
  const startTime = Date.now();

  let body: any;
  try {
    body = await request.json();

    // Validate input
    const validated = signInSchema.parse(body);

    // Use admin client to verify credentials
    // We don't need to set cookies here anymore - we'll use sessions instead
    const supabase = createAdminClient();

    // Verify credentials with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Authentication failed");
    }

    // Update last_login in app_users table
    try {
      // Update or create app_users record
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (existingUser) {
        // Update existing user
        await supabase
          .from('app_users')
          .update({
            last_login: new Date().toISOString(),
            status: 'active',
          })
          .eq('auth_user_id', authData.user.id);
      } else {
        // Create new app_users record if doesn't exist
        await supabase
          .from('app_users')
          .insert({
            auth_user_id: authData.user.id,
            name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
            email: authData.user.email || '',
            role: 'viewer',
            status: 'active',
            last_login: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error updating login status:', error);
      // Don't fail signin if this fails
    }

    // TODO: Handle MFA in future - for now skipping
    // MFA will need to be re-implemented with session-based auth

    // Create session in database
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     undefined;

    const session = await createSession(authData.user.id, {
      userAgent,
      ipAddress,
      expiresInDays: 30, // 30 days
    });

    // Log successful authentication
    await auditLogger.logAuth('login', 'success', {
      email: validated.email,
      userId: authData.user.id,
    });

    // Create response with session ID cookie (small, no chunking needed!)
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_metadata: authData.user.user_metadata,
        },
      },
    });

    // Set session ID cookie (tiny cookie, no chunking issues!)
    response.cookies.set('blipee-session', session.session_token, {
      httpOnly: true, // Secure: JavaScript can't access it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Session Auth] Created session:', session.id);
      console.log('🍪 [Session Auth] Session cookie set (httpOnly=true, size=', session.session_token.length, 'bytes)');
    }

    return response;
  } catch (error: any) {
    console.error('Error:', error);

    // Log authentication failure
    if (body?.email) {
      await auditLogger.logAuth('login_failed', 'failure', {
        email: body.email,
        error: error.message || "Authentication failed",
        metadata: {
          errorCode: error.code
        }
      });
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
