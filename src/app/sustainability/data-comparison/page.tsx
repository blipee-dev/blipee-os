import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import DataComparisonClient from './DataComparisonClient';

export default async function SustainabilityDataComparisonPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/sustainability/data-comparison');
  }

  // Check permissions
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganization(user.id);

  // Allow all authenticated users with organization membership (including viewers)
  if (!isSuperAdmin && (!organizationId || !role)) {
    redirect('/unauthorized?reason=no_organization');
  }

  return <DataComparisonClient />;
}