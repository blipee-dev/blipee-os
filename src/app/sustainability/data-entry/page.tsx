import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DataEntryClient from './DataEntryClient';

export default async function SustainabilityDataEntryPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/data-entry');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only allow: super admins, owners, managers, and members to enter data
  // Viewers should NOT be able to modify data
  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  if (!isSuperAdmin && role === 'viewer') {
    redirect('/unauthorized?reason=insufficient_permissions&required=member');
  }

  return <DataEntryClient />;
}