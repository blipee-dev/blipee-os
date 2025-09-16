import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SitesClient from './SitesClient';

export default async function SitesPage() {
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
    // Regular users - fetch their organizations through organization_members table
    const { data: orgMemberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id);

    console.log('Settings/Sites - User:', user.email, 'ID:', user.id);
    console.log('Settings/Sites - Organization memberships:', orgMemberships);

    if (membershipError) {
      console.error('Error fetching organization memberships:', membershipError);
    }

    userOrgs = [];
    organizationIds = [];

    // If user has organization memberships, fetch them
    if (orgMemberships && orgMemberships.length > 0) {
      organizationIds = orgMemberships.map(om => om.organization_id);

      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', organizationIds);

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
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
    }

    // Fetch sites for user's organizations only if they have any
    if (organizationIds && organizationIds.length > 0) {
      console.log('Settings/Sites - Fetching sites for organizations:', organizationIds);
      // Use admin client to bypass RLS for fetching sites
      const { data: userSites, error: sitesError } = await supabaseAdmin
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

      console.log('Settings/Sites - Fetched sites:', userSites?.length || 0, 'sites');
      if (userSites && userSites.length > 0) {
        console.log('Settings/Sites - Site details:');
        userSites.forEach(site => {
          console.log(`  - ${site.name} (ID: ${site.id}, Org: ${site.organization_id})`);
        });
      }
      sites = userSites;
    } else {
      sites = [];
    }
  }

  // Count devices for each site
  const sitesWithCounts = await Promise.all(
    (sites || []).map(async (site) => {
      const { count } = await supabaseAdmin
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
  console.log('Settings/Sites - Final data passed to client:');
  console.log('  - Sites:', sitesWithCounts?.length || 0);
  if (sitesWithCounts && sitesWithCounts.length > 0) {
    console.log('  - Sites with counts details:');
    sitesWithCounts.forEach(site => {
      console.log(`    - ${site.name} (ID: ${site.id}, Devices: ${site.devices_count})`);
    });
  }
  console.log('  - Organizations:', userOrgs?.length || 0);
  console.log('  - User role:', isSuperAdmin ? 'super_admin' : (userOrgs?.[0]?.role || 'viewer'));

  return (
    <SitesClient
      initialSites={sitesWithCounts || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={isSuperAdmin ? 'super_admin' : (userOrgs?.[0]?.role || 'viewer')}
    />
  );
}