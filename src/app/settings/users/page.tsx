import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = await createClient();

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
    .single();

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
    // Regular user - fetch their organizations and users
    const { data: userOrgData, error: orgsError } = await supabase
      .from('user_organizations')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      // If there's an error fetching organizations, redirect to home
      redirect('/');
    }

    userOrgs = userOrgData || [];
    organizationIds = userOrgs?.map(uo => uo.organization_id) || [];
    
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
    
    // Check if user has permission to manage users (account_owner or sustainability_manager)
    const hasPermission = userOrgs.some(uo => 
      ['account_owner', 'sustainability_manager', 'facility_manager'].includes(uo.role)
    );
    
    if (!hasPermission && userOrgs.length > 0) {
      // User doesn't have permission to manage users
      redirect('/');
    }
    
    // If still no organizations, redirect  
    if (userOrgs.length === 0) {
      redirect('/');
    }

    // Fetch app users for user's organizations
    const { data: orgUsers, error: orgUsersError } = await supabase
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
      userRole={userOrgs?.[0]?.role || 'viewer'}
    />
  );
}