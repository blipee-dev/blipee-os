import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import LogsClient from './LogsClient';

export default async function Page() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/settings/logs');

  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Allow account_owner and sustainability_manager to view logs
    const allowedRoles = ['account_owner', 'sustainability_manager'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions');
    }
  }

  return <LogsClient />;
}