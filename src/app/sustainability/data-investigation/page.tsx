import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import DataInvestigationClient from './DataInvestigationClient';

export default async function SustainabilityDataInvestigationPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/sustainability/data-investigation');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  // Only allow: super admins, owners, managers, and members
  // Viewers cannot investigate data
  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    const allowedRoles = ['owner', 'manager', 'member'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions&required=member');
    }
  }

  return <DataInvestigationClient />;
}