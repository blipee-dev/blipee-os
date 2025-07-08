import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  user?: any;
  error?: string;
}

/**
 * Middleware to require authentication and check roles
 */
export async function requireAuth(
  request: NextRequest,
  requiredRoles?: string[]
): Promise<AuthResult> {
  try {
    // Get session from cookies or headers
    const sessionId = request.cookies.get('blipee-session')?.value ||
                     request.headers.get('x-session-id');
    
    if (!sessionId) {
      return {
        authenticated: false,
        error: 'No session found',
      };
    }
    
    // Verify session
    const session = await verifySession(sessionId);
    if (!session) {
      return {
        authenticated: false,
        error: 'Invalid or expired session',
      };
    }
    
    // Check if roles are required
    if (requiredRoles && requiredRoles.length > 0) {
      // Get user roles from organization_members
      const { data: userRoles, error } = await supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('user_id', session.userId);
      
      if (error || !userRoles) {
        return {
          authenticated: false,
          error: 'Failed to check user roles',
        };
      }
      
      // Check if user has any of the required roles
      const userRoleNames = userRoles.map((r: any) => r.role);
      const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));
      
      if (!hasRequiredRole) {
        return {
          authenticated: false,
          error: 'Insufficient permissions',
        };
      }
    }
    
    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', session.userId)
      .single();
    
    return {
      authenticated: true,
      userId: session.userId,
      sessionId: sessionId,
      user: user || undefined,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Create an authenticated response with user context
 */
export function createAuthenticatedResponse(
  data: any,
  authResult: AuthResult,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add user context headers
  if (authResult.userId) {
    response.headers.set('x-user-id', authResult.userId);
  }
  
  return response;
}