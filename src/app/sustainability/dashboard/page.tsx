import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DashboardClient from './DashboardClient';

export default async function SustainabilityDashboardPage() {
  // Check authentication using session-based auth
  const user = await requireServerAuth('/signin?redirect=/sustainability/dashboard');

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Allow: super admins, owners, managers, and members (viewers can only view)
  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  // For dashboard, even viewers can see data (read-only)
  // No additional permission check needed

  return <DashboardClient />;
}