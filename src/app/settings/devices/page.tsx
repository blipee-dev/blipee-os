import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Check if user is super admin
  const { data: superAdminRecord } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  
  const isSuperAdmin = !!superAdminRecord;
  
  let userOrgs: any[] = [];
  let organizationIds: string[] = [];
  let sites: any[] = [];
  let devices: any[] = [];

  if (isSuperAdmin) {
    // Super admin can see all organizations and devices (using admin client to bypass RLS)
    const { data: allOrgs, error: orgsError } = await supabaseAdmin
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
    
    // Fetch ALL sites (using admin client to bypass RLS)
    const { data: allSites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, organization_id')
      .order('name');

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = allSites || [];
    
    // Fetch ALL devices (using admin client to bypass RLS)
    const { data: allDevices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select(`
        *,
        sites (
          name,
          location,
          organizations (
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
    }

    devices = allDevices || [];
  } else {
    // Regular users - fetch through organization_members table
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

    // Check permission using Simple RBAC system
    let hasPermission = false;

    if (organizationIds.length > 0) {
      // Check if user has permission to view devices in any of their organizations
      for (const orgId of organizationIds) {
        const { data: permissionResult } = await supabaseAdmin
          .rpc('check_user_permission', {
            p_user_id: user.id,
            p_resource_type: 'org',
            p_resource_id: orgId,
            p_action: 'sites'  // Sites permission includes devices
          });

        if (permissionResult) {
          hasPermission = true;
          break;
        }
      }
    }

    if (!hasPermission && userOrgs.length > 0) {
      // User doesn't have permission to view devices
      redirect('/');
    }

    // Fetch sites for user's organizations using admin client
    const { data: sitesData, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, organization_id')
      .in('organization_id', organizationIds);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = sitesData || [];
    const siteIds = sites.map(s => s.id);

    // Fetch devices for user's sites using admin client
    const { data: devicesData, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select(`
        *,
        sites (
          name,
          location,
          organizations (
            name,
            slug
          )
        )
      `)
      .in('site_id', siteIds)
      .order('created_at', { ascending: false });

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
    }

    devices = devicesData || [];
  }

  // Pass data to client component
  return (
    <DevicesClient 
      initialDevices={devices}
      sites={sites}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={isSuperAdmin ? 'super_admin' : (userOrgs?.[0]?.role || 'viewer')}
    />
  );
}
