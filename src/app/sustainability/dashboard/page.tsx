import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import DashboardClient from './DashboardClient';

export default async function SustainabilityDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/sustainability/dashboard');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  // Allow: super admins, owners, managers, and members (viewers can only view)
  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  // For dashboard, even viewers can see data (read-only)
  // No additional permission check needed

  return <DashboardClient />;
}