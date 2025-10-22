import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DataComparisonClient from './DataComparisonClient';

export default async function SustainabilityDataComparisonPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/data-comparison');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Allow all authenticated users with organization membership (including viewers)
  if (!isSuperAdmin && (!organizationId || !role)) {
    redirect('/unauthorized?reason=no_organization');
  }

  return <DataComparisonClient />;
}