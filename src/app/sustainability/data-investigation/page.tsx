import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DataInvestigationClient from './DataInvestigationClient';

export default async function SustainabilityDataInvestigationPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/data-investigation');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only allow: super admins, owners, managers, and members
  // Viewers cannot investigate data
  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    const allowedRoles = ['owner', 'manager', 'member'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions&required=member');
    }
  }

  return <DataInvestigationClient />;
}