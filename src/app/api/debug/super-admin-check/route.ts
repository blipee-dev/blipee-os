import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PermissionService } from '@/lib/auth/permission-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 });
    }

    // Check super admin status using different methods
    const isSuperAdminViaPermissionService = await PermissionService.isSuperAdmin(user.id);

    // Direct check
    const { data: superAdminRecord } = await supabaseAdmin
      .from('super_admins')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get app user info
    const { data: appUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: {
        auth_id: user.id,
        email: user.email
      },
      appUser,
      superAdminRecord,
      isSuperAdminViaPermissionService,
      debugInfo: {
        hasSupabaseCookies: Array.from(request.cookies.getAll()).some(
          cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-')
        ),
        cookieNames: Array.from(request.cookies.getAll()).map(c => c.name)
      }
    });
  } catch (error: any) {
    console.error('Debug super admin check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}