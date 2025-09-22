import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Check if user is super_admin using admin client (bypasses RLS)
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (superAdmin) {
      return NextResponse.json({
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        organizationId: null,
        authUserId: userId
      });
    }

    // Check app_users table using admin client
    const { data: appUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (appUser?.organization_id) {
      return NextResponse.json({
        role: appUser.role,
        isSuperAdmin: false,
        organizationId: appUser.organization_id,
        authUserId: userId
      });
    }

    // Check organization_members table as fallback
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (member) {
      return NextResponse.json({
        role: member.role,
        isSuperAdmin: false,
        organizationId: member.organization_id,
        authUserId: userId
      });
    }

    // No role found
    return NextResponse.json({
      role: 'MEMBER',
      isSuperAdmin: false,
      organizationId: null,
      authUserId: userId
    });

  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}