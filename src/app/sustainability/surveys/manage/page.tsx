import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import SurveyManagePage from './SurveyManagePage';

export default async function SurveyManageRoute() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/surveys/manage');

  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only managers and above can access survey management
  if (!isSuperAdmin && !['account_owner', 'sustainability_manager', 'facility_manager'].includes(role)) {
    redirect('/unauthorized?reason=insufficient_permissions');
  }

  return <SurveyManagePage />;
}
