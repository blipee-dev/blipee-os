import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import ApiUsageClient from './ApiUsageClient';

export default async function ApiUsagePage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/api-usage');
  }

  // Check permissions - only owners and managers can access API usage
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!isSuperAdmin) {
    if (!organizationId || !role) {
      redirect('/unauthorized?reason=no_organization');
    }

    // Only owners and managers can view API usage
    if (role !== 'owner' && role !== 'sustainability_manager') {
      redirect('/unauthorized?reason=insufficient_permissions&required=owner_or_manager');
    }
  }

  return <ApiUsageClient />;
}