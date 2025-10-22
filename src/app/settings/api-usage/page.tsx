import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import ApiUsageClient from './ApiUsageClient';

export default async function ApiUsagePage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/settings/api-usage');

  // Check permissions - only owners and managers can access API usage
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Only owners and managers can view API usage
    if (role !== 'owner' && role !== 'sustainability_manager') {
      redirect('/unauthorized?reason=insufficient_permissions&required=owner_or_manager');
    }
  }

  return <ApiUsageClient />;
}