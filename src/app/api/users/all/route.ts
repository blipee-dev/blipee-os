import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: superAdminCheck } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (superAdminCheck) {
      // Super admin can see all users
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from('app_users')
        .select(`
          *,
          organizations:organization_id (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (allUsersError) {
        console.error('Error fetching all users:', allUsersError);
        return NextResponse.json({ error: allUsersError.message }, { status: 500 });
      }

      // Check which users are super admins
      const { data: superAdmins } = await supabaseAdmin
        .from('super_admins')
        .select('user_id');

      const superAdminIds = new Set(superAdmins?.map(sa => sa.user_id) || []);

      // Add is_super_admin flag to users
      const usersWithFlags = allUsers?.map(user => ({
        ...user,
        is_super_admin: superAdminIds.has(user.auth_user_id)
      })) || [];

      return NextResponse.json({ users: usersWithFlags });
    } else {
      // Regular user - fetch based on their organizations
      const { data: userOrgs } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      const organizationIds = userOrgs?.map(uo => uo.organization_id) || [];

      if (organizationIds.length === 0) {
        // Try to get from app_users table
        const { data: appUserData } = await supabase
          .from('app_users')
          .select('organization_id')
          .eq('auth_user_id', user.id)
          .single();

        if (appUserData) {
          organizationIds.push(appUserData.organization_id);
        }
      }

      // Fetch users for user's organizations using admin client to bypass RLS
      const { data: orgUsers, error: orgUsersError } = await supabaseAdmin
        .from('app_users')
        .select(`
          *,
          organizations:organization_id (
            name,
            slug
          )
        `)
        .in('organization_id', organizationIds)
        .order('created_at', { ascending: false });

      if (orgUsersError) {
        console.error('Error fetching org users:', orgUsersError);
        return NextResponse.json({ error: orgUsersError.message }, { status: 500 });
      }

      // Check which users are super admins
      const { data: superAdmins } = await supabaseAdmin
        .from('super_admins')
        .select('user_id');

      const superAdminIds = new Set(superAdmins?.map(sa => sa.user_id) || []);

      // Add is_super_admin flag to users
      const usersWithFlags = orgUsers?.map(user => ({
        ...user,
        is_super_admin: superAdminIds.has(user.auth_user_id)
      })) || [];

      return NextResponse.json({ users: usersWithFlags });
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}