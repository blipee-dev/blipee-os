import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import BillingClient from './BillingClient';

export default async function SettingsBillingPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/settings/billing');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only owners can manage billing
  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    if (role !== 'owner') {
      redirect('/unauthorized?reason=insufficient_permissions&required=owner');
    }
  }

  return <BillingClient />;
}