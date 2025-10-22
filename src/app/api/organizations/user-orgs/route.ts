import { NextRequest, NextResponse } from "next/server";
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PermissionService } from '@/lib/auth/permission-service';

export async function GET(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (isSuperAdmin) {
      // Super admins can see all organizations
      const { data: allOrgs, error: orgsError } = await supabaseAdmin
        .from("organizations")
        .select("*")
        .order('name');

      if (orgsError) {
        console.error('Error fetching all organizations:', orgsError);
        return NextResponse.json({ error: orgsError.message }, { status: 500 });
      }

      // Get counts for each organization
      const orgsWithCounts = await Promise.all(
        (allOrgs || []).map(async (org) => {
          // Count sites
          const { count: sitesCount } = await supabaseAdmin
            .from('sites')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Count users from app_users
          const { count: usersCount } = await supabaseAdmin
            .from('app_users')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          return {
            ...org,
            role: 'super_admin',
            sites: sitesCount || 0,
            users: usersCount || 0
          };
        })
      );

      return NextResponse.json({ organizations: orgsWithCounts });
    }

    // Regular users - get from user_access and app_users
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("app_users")
      .select("id, organization_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const orgIds: string[] = [];
    const orgRoles: Record<string, string> = {};

    // Check user_access table (Simple RBAC)
    const { data: userAccess, error: accessError } = await supabaseAdmin
      .from("user_access")
      .select("resource_id, role")
      .eq("user_id", user.id)
      .eq("resource_type", "org");

    if (userAccess && userAccess.length > 0) {
      userAccess.forEach(access => {
        orgIds.push(access.resource_id);
        orgRoles[access.resource_id] = access.role;
      });
    }

    // Fallback: Add direct organization from app_users if not in user_access
    if (userProfile?.organization_id && !orgIds.includes(userProfile.organization_id)) {
      orgIds.push(userProfile.organization_id);
      orgRoles[userProfile.organization_id] = userProfile.role || 'viewer';
    }

    if (orgIds.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    // Fetch organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .in("id", orgIds);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }

    // Get counts for each organization
    const orgsWithCounts = await Promise.all(
      (organizations || []).map(async (org) => {
        // Count sites
        const { count: sitesCount } = await supabaseAdmin
          .from('sites')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Count users from app_users (not organization_members)
        const { count: usersCount } = await supabaseAdmin
          .from('app_users')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        return {
          ...org,
          role: orgRoles[org.id] || 'viewer',
          sites: sitesCount || 0,
          users: usersCount || 0
        };
      })
    );

    return NextResponse.json({ organizations: orgsWithCounts });
  } catch (error) {
    console.error('Error in user-orgs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}