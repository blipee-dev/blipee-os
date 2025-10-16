import { NextRequest, NextResponse } from 'next/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { sessionAuth } from '@/lib/auth/session-auth';
import { sessionManager } from '@/lib/session/manager';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  method: z.enum(['totp']),
  code: z.string().length(6),
  rememberDevice: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const body = await request.json();
    const { challengeId, method, code, rememberDevice } = verifySchema.parse(body);

    // Initialize MFA service
    const mfaService = new MFAService();
    
    // Verify the challenge
    const result = await mfaService.verifyChallenge(challengeId, {
      method,
      code,
      rememberDevice: rememberDevice ?? false,
    });

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create authenticated session
    const { session, sessionId } = await sessionAuth.completeMFAVerification(
      result.userId,
      challengeId,
      request
    );

    // Update last_login and status for successful MFA verification
    
    try {
      const supabase = await createClient();
      
      // Get current user status
      const { data: currentUser, error: selectError } = await supabase
        .from('app_users')
        .select('status')
        .eq('auth_user_id', result.userId)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        // User doesn't exist in app_users table, create them
        
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            auth_user_id: result.userId,
            name: 'User', // Will be updated when user profile is loaded
            email: '', // Will be updated when user profile is loaded
            role: 'viewer', // Default role
            status: 'active', // Set as active since they're logging in
            last_login: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ MFA: Error creating user record:', insertError);
        } else {
        }
      } else if (selectError) {
        console.error('❌ MFA: Error fetching current user:', selectError);
      } else {

        // Update last_login and change status from pending to active
        const updateData: { last_login: string; status?: string } = {
          last_login: new Date().toISOString()
        };

        // If user status is pending, change to active on first login
        if (currentUser?.status === 'pending') {
          updateData.status = 'active';
        }


        const { error: updateError } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('auth_user_id', result.userId);

        if (updateError) {
          console.error('❌ MFA: Error updating user login status:', updateError);
        } else {
        }
      }
    } catch (error) {
      console.error('🔥 MFA DIRECT LOGIN TRACKING ERROR:', error);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'MFA verification successful',
      data: {
        user: session.user,
        session: session,
      }
    });

    // Set session cookie
    const cookieHeader = sessionManager['sessionService'].generateCookieHeader(sessionId);
    response.headers.set('Set-Cookie', cookieHeader);

    return response;
  } catch (error) {
    console.error('Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}