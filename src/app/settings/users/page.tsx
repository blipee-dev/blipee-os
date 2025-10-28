import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';
import { PermissionService } from '@/lib/auth/permission-service';

export default async function UsersPage() {
  const supabase = createClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const user = await requireServerAuth('/signin');

  // Check if user is super admin using centralized service
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  let userOrgs;
  let organizationIds;
  let appUsers;

  if (isSuperAdmin) {
    // Super admin can see all organizations and users
    const { data: allOrgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    }

    userOrgs = allOrgs?.map(org => ({
      organization_id: org.id,
      role: 'super_admin',
      organizations: org
    })) || [];

    organizationIds = allOrgs?.map(org => org.id) || [];

    // Fetch all app users (using admin client to bypass RLS)
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
    }

    // Check which users are super admins (using admin client)
    const { data: superAdmins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');

    const superAdminIds = new Set(superAdmins?.map(sa => sa.user_id) || []);

    // Add is_super_admin flag to users
    appUsers = allUsers?.map(user => ({
      ...user,
      is_super_admin: superAdminIds.has(user.auth_user_id)
    })) || [];
  } else {
    // Regular users - get their organizations from app_users and user_access
    const { data: currentAppUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    console.log('[Users Page] Current user app_users data:', currentAppUser);

    let currentUserRole = currentAppUser?.role || 'viewer';

    // Get organizations from user_access table (Simple RBAC)
    const { data: userAccess } = await supabase
      .from('user_access')
      .select('resource_id, role')
      .eq('user_id', user.id)
      .eq('resource_type', 'org');

    console.log('[Users Page] User access data:', userAccess);

    if (userAccess && userAccess.length > 0) {
      // Get organization IDs from user_access
      organizationIds = userAccess.map(ua => ua.resource_id);

      // Fetch organization details
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', organizationIds);

      // Map organizations with their roles from user_access
      userOrgs = orgsData?.map(org => {
        const access = userAccess.find(ua => ua.resource_id === org.id);
        return {
          organization_id: org.id,
          role: access?.role || currentUserRole,
          organizations: org
        };
      }) || [];
    } else if (currentAppUser && currentAppUser.organization_id) {
      // Fallback: Use organization from app_users if no user_access entries
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', currentAppUser.organization_id)
        .single();

      if (orgData) {
        userOrgs = [{
          organization_id: currentAppUser.organization_id,
          role: currentUserRole,
          organizations: orgData
        }];
        organizationIds = [currentAppUser.organization_id];
      }
    }

    // If no organizations, redirect
    if (!userOrgs || userOrgs.length === 0) {
      console.log('[Users Page] No organizations found, redirecting to /');
      redirect('/');
    }

    console.log('[Users Page] Organization IDs:', organizationIds);
    console.log('[Users Page] User organizations:', userOrgs);

    // Check permission using centralized permission service
    let hasPermission = false;

    if (organizationIds && organizationIds.length > 0) {
      // Check if user has permission to manage users in any of their organizations
      for (const orgId of organizationIds) {
        const canManage = await PermissionService.canManageUsers(user.id, orgId);
        console.log(`[Users Page] Can manage users for org ${orgId}:`, canManage);
        if (canManage) {
          hasPermission = true;
          break;
        }
      }
    }

    console.log('[Users Page] Has permission:', hasPermission);
    console.log('[Users Page] Current user role:', currentUserRole);

    if (!hasPermission) {
      // User doesn't have permission to manage users
      console.log('[Users Page] No permission to manage users, redirecting to /');
      redirect('/');
    }

    // Fetch app users for user's organizations using admin client
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
    }

    // Check which users are super admins
    const { data: superAdmins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');

    const superAdminIds = new Set(superAdmins?.map(sa => sa.user_id) || []);

    // Add is_super_admin flag to users
    appUsers = orgUsers?.map(user => ({
      ...user,
      is_super_admin: superAdminIds.has(user.auth_user_id)
    })) || [];
  }

  // Get the actual user role
  let userRole = 'viewer';
  if (isSuperAdmin) {
    userRole = 'super_admin';
  } else {
    // Get the user's actual role from app_users table
    const { data: currentUser } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    userRole = currentUser?.role || 'viewer';
  }

  // Pass data to client component
  return (
    <UsersClient
      initialUsers={appUsers || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={userRole}
    />
  );
}