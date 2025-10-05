import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import DataMigrationClient from './DataMigrationClient';

export default async function SustainabilityDataMigrationPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/sustainability/data-migration');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  // Only allow: super admins, owners, and managers
  // Data migration is a critical operation
  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    const allowedRoles = ['owner', 'manager'];
    if (!allowedRoles.includes(role)) {
      redirect('/unauthorized?reason=insufficient_permissions&required=manager');
    }
  }

  return <DataMigrationClient />;
}