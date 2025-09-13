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
    .single();

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
    // Regular user - fetch their organizations
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
    }

    userOrgs = userOrgData || [];
    organizationIds = userOrgs?.map(uo => uo.organization_id) || [];

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