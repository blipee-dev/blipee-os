import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import SitesClient from './SitesClient';

export default async function SitesPage() {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/sites');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  let userOrgs: any[] = [];
  let sites: any[] = [];

  if (isSuperAdmin) {
    // Super admin can see all organizations and sites
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

    // Fetch ALL sites for super admin
    const { data: allSites, error: sitesError } = await supabaseAdmin
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

    sites = allSites || [];
  } else {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Check if user has permission to view/manage sites
    const canManageSites = await PermissionService.canManageSites(user.id);

    if (!canManageSites) {
      redirect('/unauthorized?reason=insufficient_permissions&required=sites_access');
    }

    // Fetch organization details
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organizationId)
      .single();

    if (orgData) {
      userOrgs = [{
        organization_id: orgData.id,
        role: role,
        organizations: orgData
      }];
    }

    // Fetch sites for user's organization
    const { data: userSites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = userSites || [];
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

  return (
    <SitesClient
      initialSites={sitesWithCounts || []}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={isSuperAdmin ? 'super_admin' : role}
    />
  );
}