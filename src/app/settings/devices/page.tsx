import { createClient } from '@/lib/supabase/server';
// Force recompilation
import { redirect } from 'next/navigation';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
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
    .select('id, name, organization_id')
    .in('organization_id', organizationIds);

  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
  }

  const siteIds = sites?.map(s => s.id) || [];

  // Fetch devices for user's sites
  const { data: devices, error: devicesError } = await supabase
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

  // Pass data to client component
  return (
    <DevicesClient 
      initialDevices={devices || []}
      sites={sites || []}
      userRole={userOrgs?.[0]?.role || 'viewer'}
    />
  );
}
