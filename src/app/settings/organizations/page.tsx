import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import OrganizationsClient from './OrganizationsClient';

export default async function OrganizationsPage() {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/organizations');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  let initialOrganizations: any[] = [];

  if (isSuperAdmin) {
    // Super admin can see all organizations
    const { data: allOrgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        sites:sites(count),
        organization_members:organization_members(count)
      `)
      .order('name');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    }

    initialOrganizations = allOrgs?.map((org: any) => ({
      ...org,
      role: "super_admin",
      sites: org.sites?.[0]?.count || 0,
      users: org.organization_members?.[0]?.count || 0,
      status: org.subscription_status || "active",
      industry: org.industry_primary || "",
    })) || [];
  } else {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Regular users can only see their own organizations
    // Check if user has permission to view organizations
    const canViewOrganizations = await PermissionService.canManageUsers(user.id, organizationId);

    if (!canViewOrganizations) {
      redirect('/unauthorized?reason=insufficient_permissions&required=organizations_access');
    }

    // Fetch user's organizations using direct database query
    const { data: userOrgs, error: userOrgsError } = await supabaseAdmin
      .from('organization_members')
      .select(`
        role,
        organizations (
          *,
          sites:sites(count),
          organization_members:organization_members(count)
        )
      `)
      .eq('user_id', user.id);

    if (userOrgsError) {
      console.error('Error fetching user organizations:', userOrgsError);
    }

    initialOrganizations = userOrgs?.map((membership: any) => ({
      ...membership.organizations,
      role: membership.role,
      sites: membership.organizations.sites?.[0]?.count || 0,
      users: membership.organizations.organization_members?.[0]?.count || 0,
      status: membership.organizations.subscription_status || "active",
      industry: membership.organizations.industry_primary || "",
    })) || [];
  }

  return (
    <OrganizationsClient
      initialOrganizations={initialOrganizations}
      userRole={isSuperAdmin ? 'super_admin' : role}
    />
  );
}
