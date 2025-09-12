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

  // Fetch user's organizations
  const { data: userOrgs, error: orgsError } = await supabase
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

  const organizationIds = userOrgs?.map(uo => uo.organization_id) || [];

  // Fetch sites for user's organizations
  const { data: sites, error: sitesError } = await supabase
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