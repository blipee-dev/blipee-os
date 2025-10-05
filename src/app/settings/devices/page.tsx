import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/devices');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  let userOrgs: any[] = [];
  let sites: any[] = [];
  let devices: any[] = [];

  if (isSuperAdmin) {
    // Super admin can see all organizations and devices
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

    // Fetch ALL sites
    const { data: allSites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, organization_id')
      .order('name');

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = allSites || [];

    // Fetch ALL devices
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
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Check if user has permission to view devices/sites
    const canManageSites = await PermissionService.canManageSites(user.id, organizationId);

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
    const { data: sitesData, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, organization_id')
      .eq('organization_id', organizationId);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
    }

    sites = sitesData || [];
    const siteIds = sites.map(s => s.id);

    // Fetch devices for user's sites
    if (siteIds.length > 0) {
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
  }

  return (
    <DevicesClient
      initialDevices={devices}
      sites={sites}
      organizations={userOrgs?.map(uo => uo.organizations) || []}
      userRole={isSuperAdmin ? 'super_admin' : role}
    />
  );
}
