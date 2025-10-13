import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import LogsClient from './LogsClient';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/settings/logs');
  }

  // Check permissions - Only super admin can access this page
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/unauthorized?reason=admin_only');
  }

  return <LogsClient />;
}