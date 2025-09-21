import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SessionTracker } from '@/lib/session/tracker';
import { sessionManager } from '@/lib/session/manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Session API: Starting with cookies:', request.cookies.getAll().map(c => c.name));

    // Get the custom session from session manager
    const sessionData = await sessionManager.getSessionFromCookies();
    console.log('Session API: Custom session result:', { hasSession: !!sessionData, userId: sessionData?.userId });

    if (!sessionData) {
      // No custom session found
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          code: "NO_SESSION",
        },
        { status: 401 }
      );
    }

    // Get user details from Supabase auth using the userId from session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(sessionData.userId);
    console.log('Session API: User lookup result:', { hasUser: !!user, error: authError?.message });

    if (authError || !user) {
      console.error('Auth error in session endpoint:', authError?.message);
      return NextResponse.json(
        {
          success: false,
          error: authError?.message || "User not found",
          code: "USER_NOT_FOUND",
        },
        { status: 401 }
      );
    }

    // Get user profile from app_users using admin client to avoid RLS issues
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!profileError) {
        profile = profileData;
      } else {
        console.warn('Profile not found or error loading profile:', profileError);
      }
    } catch (profileErr) {
      console.warn('Error fetching user profile:', profileErr);
      // Continue without profile - user can still authenticate
    }

    // Check if user is super admin
    let isSuperAdmin = false;
    try {
      const { data: superAdminRecord } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      isSuperAdmin = !!superAdminRecord;
    } catch (error) {
      console.warn('Error checking super admin status:', error);
    }

    // Load organizations based on super admin status
    let organizations = [];
    let currentOrganization = null;
    let permissions = sessionData.permissions || [];

    if (isSuperAdmin) {
      // Super admin - load ALL organizations
      try {
        const { data: allOrgs, error: orgsError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .order('name');

        if (!orgsError && allOrgs) {
          organizations = allOrgs;
          // Set first organization as current for super admin
          if (allOrgs.length > 0) {
            currentOrganization = allOrgs[0];
          }
          // Super admin has all permissions
          permissions = ['*'];
        }
      } catch (error) {
        console.warn('Error loading organizations for super admin:', error);
      }
    } else if (sessionData.organizationId) {
      // Regular user - load their organization from session data
      try {
        const { data: userOrg, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', sessionData.organizationId)
          .single();

        if (!orgError && userOrg) {
          organizations = [userOrg];
          currentOrganization = userOrg;
        }
      } catch (error) {
        console.warn('Error loading user organization:', error);
      }
    } else if (profile?.organization_id) {
      // Fallback: load from profile if session doesn't have org ID
      try {
        const { data: userOrg, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (!orgError && userOrg) {
          organizations = [userOrg];
          currentOrganization = userOrg;
          // Load user permissions based on role
          permissions = [profile.role || 'viewer'];
        }
      } catch (error) {
        console.warn('Error loading user organization:', error);
      }
    }

    // Return session data with organizations
    return NextResponse.json({
      success: true,
      data: {
        session: {
          user: {
            ...user,
            profile
          },
          organizations,
          current_organization: currentOrganization,
          permissions,
          expires_at: user.exp ? new Date(user.exp * 1000).toISOString() : null
        }
      }
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get session",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, organizationId } = body;

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (action === 'start') {
      // Start a new session
      const sessionId = await SessionTracker.startSession({
        userId: user.id,
        organizationId,
        ipAddress,
        userAgent
      });

      return NextResponse.json({ 
        success: true, 
        sessionId,
        message: 'Session started' 
      });
    } else if (action === 'end') {
      // End the current session
      await SessionTracker.endSession(user.id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Session ended' 
      });
    } else if (action === 'heartbeat') {
      // Update session activity
      await SessionTracker.updateSessionActivity(user.id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Session activity updated' 
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}