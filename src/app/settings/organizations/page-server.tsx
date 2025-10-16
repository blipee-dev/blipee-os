import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrganizationSettingsPage from './page';
import { PermissionService } from '@/lib/auth/permission-service';

export default async function OrganizationsPageWrapper() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Check if user is super admin
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  // If not super admin, check if they can manage organizations
  if (!isSuperAdmin) {
    // Get user's organizations
    const { data: appUser } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      redirect('/');
    }

    // Check if user has permission to manage organizations
    const canManage = await PermissionService.canManageOrganizations(
      user.id,
      appUser.organization_id
    );

    if (!canManage) {
      redirect('/');
    }
  }

  // User has permission, render the client component
  return <OrganizationSettingsPage />;
}