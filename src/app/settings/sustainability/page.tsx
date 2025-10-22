import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import SustainabilityClient from './SustainabilityClient';

export default async function SustainabilityPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/settings/sustainability');

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
    // Fetch catalog (cookies are automatically included in server-side fetch)
    const catalogResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/metrics/catalog`,
      { cache: 'no-store' }
    );

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      initialCatalog = catalogData.grouped || {};
    }

    // Fetch organization's selected metrics
    const orgResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/metrics/organization`,
      { cache: 'no-store' }
    );

    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      initialOrganizationMetrics = orgData.metrics || [];
    }

    // Fetch sites
    const sitesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sites`,
      { cache: 'no-store' }
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