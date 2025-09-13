import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const supabase = await createClient();

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
    // Super admin can see all organizations and devices
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
    
    // Fetch ALL sites
    const { data: allSites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .order('name');

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = allSites || [];
    
    // Fetch ALL devices
    const { data: allDevices, error: devicesError } = await supabase
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
    // Regular users - fetch through user_access table
    const { data: userAccess, error: userAccessError } = await supabase
      .from('user_access')
      .select('resource_id, role')
      .eq('user_id', user.id)
      .eq('resource_type', 'organization');

    if (userAccessError) {
      console.error('Error fetching user access:', userAccessError);
      redirect('/');
    }

    if (!userAccess || userAccess.length === 0) {
      console.log('User has no organization access');
      redirect('/');
    }

    // Get organization IDs from user access
    organizationIds = userAccess.map(ua => ua.resource_id);
    
    // Fetch organization details
    const { data: orgsData, error: orgsDataError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .in('id', organizationIds);
      
    if (orgsDataError) {
      console.error('Error fetching organization data:', orgsDataError);
    }
    
    // Map organizations with their roles from user_access
    userOrgs = orgsData?.map(org => {
      const access = userAccess.find(ua => ua.resource_id === org.id);
      return {
        organization_id: org.id,
        role: access?.role || 'viewer',
        organizations: org
      };
    }) || [];
    
    // Check if user has permission to view devices (owner or manager)
    const hasPermission = userOrgs.some(uo => 
      ['owner', 'manager', 'member'].includes(uo.role)
    );
    
    if (!hasPermission && userOrgs.length > 0) {
      // User doesn't have permission to view devices
      redirect('/');
    }

    // Fetch sites for user's organizations
    const { data: sitesData, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .in('organization_id', organizationIds);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = sitesData || [];
    const siteIds = sites.map(s => s.id);

    // Fetch devices for user's sites
    const { data: devicesData, error: devicesError } = await supabase
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
