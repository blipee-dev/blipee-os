import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DataMigrationClient from './DataMigrationClient';

export default async function SustainabilityDataMigrationPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/data-migration');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only allow: super admins, owners, and managers
  // Data migration is a critical operation
  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    const allowedRoles = ['owner', 'manager'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions&required=manager');
    }
  }

  return <DataMigrationClient />;
}