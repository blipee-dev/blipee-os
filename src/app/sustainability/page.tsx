import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import OverviewPage from './overview/OverviewPage';

export default async function SustainabilityHomePage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Allow: super admins, owners, managers, and members (viewers can only view)
  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  // Render the Overview page as the default sustainability page
  // Note: conversationId and organizationId are now handled by the layout
  return <OverviewPage conversationId="" organizationId={organizationId} />;
}
