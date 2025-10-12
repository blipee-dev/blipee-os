import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import OverviewPage from './overview/OverviewPage';

export default async function SustainabilityHomePage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/sustainability');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Allow: super admins, owners, managers, and members (viewers can only view)
  if (!isSuperAdmin && !role) {
    redirect('/unauthorized?reason=no_organization');
  }

  // Render the Overview page as the default sustainability page
  return <OverviewPage />;
}
