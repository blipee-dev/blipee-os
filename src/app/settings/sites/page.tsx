import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SitesClient from './SitesClient';

export default async function SitesPage() {
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
    .maybeSingle();

  const isSuperAdmin = !!superAdminRecord;

  let userOrgs;
  let organizationIds;
  let sites;

  if (isSuperAdmin) {
    // Super admin can see all organizations and sites
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
    
    // Fetch ALL sites for super admin
    const { data: allSites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }
    
    sites = allSites;
  } else {
    // Regular users - fetch their organizations through user_access table
    const { data: userAccess, error: userAccessError } = await supabase
      .from('user_access')
      .select('resource_id, role')
      .eq('user_id', user.id)
      .eq('resource_type', 'organization');

    if (userAccessError) {
      console.error('Error fetching user access:', userAccessError);
    }

    userOrgs = [];
    organizationIds = [];

    // If user has access to organizations, fetch them
    if (userAccess && userAccess.length > 0) {
      organizationIds = userAccess.map(ua => ua.resource_id);
      
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', organizationIds);

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
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
    }

    // Fetch sites for user's organizations only
    const { data: userSites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .in('organization_id', organizationIds)
      .order('created_at', { ascending: false });

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }
    
    sites = userSites;
  }

  // Count devices for each site
  const sitesWithCounts = await Promise.all(
    (sites || []).map(async (site) => {
      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id);
      
      return {
        ...site,
        devices_count: count || 0
      };
    })
  );

  // Pass data to client component
  return (
    <SitesClient 
      initialSites={sitesWithCounts || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={userOrgs?.[0]?.role || 'viewer'}
    />
  );
}