import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import BillingClient from './BillingClient';

export default async function SettingsBillingPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/billing');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

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