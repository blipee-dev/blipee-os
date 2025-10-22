import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import CommutePage from './CommutePage';

export default async function CommuteRoute() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/commute');

  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  return <CommutePage />;
}
