import { NextRequest, NextResponse } from "next/server";
import { sessionAuth } from "@/lib/auth/session-auth";
import { sessionManager } from "@/lib/session/manager";
import { withAuthSecurity } from "@/lib/security/api/wrapper";
import { auditLogger } from "@/lib/audit/server";
import { createClient } from "@/lib/supabase/server";
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

    // Update last_login and status for successful authentication
    if (result.user && !result.requiresMFA) {
      const loginUpdateStart = Date.now();
      console.log('🔥 DIRECT LOGIN TRACKING: Updating user login status for user:', result.user.id);
      
      try {
        // Use admin client to bypass RLS
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        );

        // Get current user status - first check by auth_user_id
        let { data: currentUser, error: selectError } = await supabaseAdmin
          .from('app_users')
          .select('id, status, auth_user_id')
          .eq('auth_user_id', result.user.id)
          .single();

        // If not found by auth_user_id, check by email (for legacy records)
        if (selectError && selectError.code === 'PGRST116' && result.user.email) {
          console.log('👤 User not found by auth_user_id, checking by email...');
          const { data: userByEmail, error: emailError } = await supabaseAdmin
            .from('app_users')
            .select('id, status, auth_user_id')
            .eq('email', result.user.email)
            .single();

          if (userByEmail && !userByEmail.auth_user_id) {
            // User exists but missing auth_user_id, update it
            console.log('🔄 Updating existing user with auth_user_id');
            const { error: updateError } = await supabaseAdmin
              .from('app_users')
              .update({
                auth_user_id: result.user.id,
                status: 'active',
                last_login: new Date().toISOString(),
              })
              .eq('id', userByEmail.id);

            if (updateError) {
              console.error('❌ Error updating user auth_user_id:', updateError);
            } else {
              console.log('✅ Successfully linked user to auth account');
              currentUser = { ...userByEmail, auth_user_id: result.user.id, status: 'active' };
              selectError = null;
            }
          } else if (userByEmail) {
            // User exists with different auth_user_id
            currentUser = userByEmail;
            selectError = null;
          }
        }

        if (selectError && selectError.code === 'PGRST116') {
          // User doesn't exist in app_users table, create them
          console.log('👤 User not found in app_users, creating record...');

          const { error: insertError } = await supabaseAdmin
            .from('app_users')
            .insert({
              auth_user_id: result.user.id,
              name: result.user.user_metadata?.full_name || result.user.email?.split('@')[0] || 'User',
              email: result.user.email || '',
              role: 'viewer', // Default role
              status: 'active', // Set as active since they're logging in
              last_login: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Error creating user record:', insertError);
          } else {
            console.log('✅ Successfully created user record and updated login time');
          }
        } else if (selectError) {
          console.error('❌ Error fetching current user:', selectError);
        } else {
          console.log('👤 Current user status:', currentUser?.status);

          // Update last_login and change status from pending to active
          const updateData: { last_login: string; status?: string } = {
            last_login: new Date().toISOString()
          };

          // If user status is pending, change to active on first login
          if (currentUser?.status === 'pending') {
            updateData.status = 'active';
            console.log('🔄 Changing status from pending to active');
          }

          console.log('💾 Updating with data:', updateData);

          const { error: updateError } = await supabaseAdmin
            .from('app_users')
            .update(updateData)
            .eq('auth_user_id', result.user.id);

          if (updateError) {
            console.error('❌ Error updating user login status:', updateError);
          } else {
            console.log('✅ Successfully updated user login status');
          }
        }
      } catch (error) {
        console.error('🔥 DIRECT LOGIN TRACKING ERROR:', error);
      }
      
      console.log(`🔥 DIRECT LOGIN TRACKING completed in ${Date.now() - loginUpdateStart}ms`);
    }

    // Log successful authentication
    if (result.user) {
      const auditStart = Date.now();
      await auditLogger.logAuth('login', 'success', {
        email: validated.email,
        userId: result.user.id,
        metadata: {
          requiresMFA: result.requiresMFA
        }
      });
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

    // Set session cookie - use the sessionService directly since SessionManager doesn't expose this method
    if (result.sessionId) {
      // Access the sessionService directly to generate the cookie header
      const cookieHeader = sessionManager['sessionService'].generateCookieHeader(result.sessionId);
      response.headers.set('Set-Cookie', cookieHeader);
      console.log('🍪 Session cookie set:', cookieHeader);
    }
    console.log(`🍪 Response creation completed in ${Date.now() - responseStart}ms`);

    const totalDuration = Date.now() - startTime;
    console.log(`🔍 SignIn completed successfully in ${totalDuration}ms`);
    
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
