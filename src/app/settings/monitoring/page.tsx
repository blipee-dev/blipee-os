import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import MonitoringClient from './MonitoringClient';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/monitoring');
  }

  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    const allowedRoles = ['owner', 'manager'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions');
    }
  }

  return <MonitoringClient />;
}