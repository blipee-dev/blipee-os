import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Check if user is super admin (in super_admins table)
  const { data: superAdminRecord } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isSuperAdmin = !!superAdminRecord;

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
    // Regular users - first get their role from app_users table
    const { data: currentAppUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    let currentUserRole = currentAppUser?.role || 'viewer';

    // Try to get organizations from organization_members table first
    const { data: orgMemberships } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (orgMemberships && orgMemberships.length > 0) {
      // Get organization IDs from memberships
      organizationIds = orgMemberships.map(om => om.organization_id);

      // Fetch organization details
      const { data: orgsData, error: orgsDataError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', organizationIds);

      if (orgsDataError) {
        console.error('Error fetching organization data:', orgsDataError);
      }

      // Map organizations with their roles
      userOrgs = orgsData?.map(org => {
        const membership = orgMemberships.find(om => om.organization_id === org.id);
        return {
          organization_id: org.id,
          role: currentUserRole, // Use role from app_users
          organizations: org
        };
      }) || [];
    }

    // If no organizations from memberships, try to get from app_users table
    if (!userOrgs || userOrgs.length === 0) {
      if (currentAppUser && currentAppUser.organization_id) {
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
    }

    // If still no organizations, redirect
    if (!userOrgs || userOrgs.length === 0) {
      console.log('User has no organizations');
      redirect('/');
    }
    
    // Check permission using Simple RBAC system
    let hasPermission = false;

    if (organizationIds.length > 0) {
      // Check if user has permission to manage users in any of their organizations
      for (const orgId of organizationIds) {
        const { data: permissionResult } = await supabaseAdmin
          .rpc('check_user_permission', {
            p_user_id: user.id,
            p_resource_type: 'org',
            p_resource_id: orgId,
            p_action: 'users'
          });

        if (permissionResult) {
          hasPermission = true;
          break;
        }
      }
    }

    if (!hasPermission && userOrgs.length > 0) {
      // User doesn't have permission to manage users
      redirect('/');
    }
    
    // If still no organizations, redirect  
    if (userOrgs.length === 0) {
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

    // Check which users are super admins (using admin client)
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

  // Get the actual user role - for super admin use 'super_admin', otherwise use the role from app_users
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