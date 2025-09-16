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

    // Fetch all app users
    const { data: allUsers, error: allUsersError } = await supabase
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
    
    appUsers = allUsers;
  } else {
    // Regular users - fetch their organizations through organization_members table
    const { data: orgMemberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Error fetching organization memberships:', membershipError);
      redirect('/');
    }

    if (!orgMemberships || orgMemberships.length === 0) {
      console.log('User has no organization memberships');
      redirect('/');
    }

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

    // Map organizations with their roles from organization_members
    userOrgs = orgsData?.map(org => {
      const membership = orgMemberships.find(om => om.organization_id === org.id);
      return {
        organization_id: org.id,
        role: membership?.role || 'viewer',
        organizations: org
      };
    }) || [];
    
    // If user has no organizations, try to get from app_users table
    if (userOrgs.length === 0) {
      const { data: appUserData } = await supabase
        .from('app_users')
        .select(`
          organization_id,
          role,
          organizations:organization_id (
            id,
            name,
            slug
          )
        `)
        .eq('auth_user_id', user.id)
        .single();
        
      if (appUserData && appUserData.organizations) {
        userOrgs = [{
          organization_id: appUserData.organization_id,
          role: appUserData.role,
          organizations: appUserData.organizations
        }];
        organizationIds = [appUserData.organization_id];
      }
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

    appUsers = orgUsers;
  }

  // Pass data to client component
  return (
    <UsersClient 
      initialUsers={appUsers || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={isSuperAdmin ? 'super_admin' : (userOrgs?.[0]?.role || 'viewer')}
    />
  );
}