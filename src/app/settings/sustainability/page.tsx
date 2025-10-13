import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import SustainabilityClient from './SustainabilityClient';

export default async function SustainabilityPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/sustainability');
  }

  // Check permissions - Only super admin can access this page
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/unauthorized?reason=admin_only');
  }

  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Fetch initial data for the client
  let initialCatalog = {};
  let initialOrganizationMetrics: any[] = [];
  let initialSites: any[] = [];

  try {
    // Fetch catalog
    const catalogResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/metrics/catalog`,
      {
        headers: {
          'Cookie': `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
    );

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      initialCatalog = catalogData.grouped || {};
    }

    // Fetch organization's selected metrics
    const orgResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/metrics/organization`,
      {
        headers: {
          'Cookie': `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
    );

    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      initialOrganizationMetrics = orgData.metrics || [];
    }

    // Fetch sites
    const sitesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sites`,
      {
        headers: {
          'Cookie': `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
    );

    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json();
      initialSites = sitesData.sites || [];
    }
  } catch (error) {
    console.error('Error fetching initial sustainability data:', error);
    // Continue with empty data if API calls fail
  }

  return (
    <SustainabilityClient
      initialCatalog={initialCatalog}
      initialOrganizationMetrics={initialOrganizationMetrics}
      initialSites={initialSites}
    />
  );
}