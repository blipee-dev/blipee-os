/**
 * Helper function to get user's organization consistently
 * Uses Simple RBAC system with app_users and user_access tables
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface UserOrgInfo {
  organizationId: string | null;
  role: string | null;
}

export async function getUserOrganization(userId: string): Promise<UserOrgInfo> {
  // First check app_users table
  const { data: appUser } = await supabaseAdmin
    .from('app_users')
    .select('organization_id, role')
    .eq('auth_user_id', userId)
    .single();

  if (appUser?.organization_id) {
    return {
      organizationId: appUser.organization_id,
      role: appUser.role
    };
  }

  // If not found, check user_access table
  const { data: userAccess } = await supabaseAdmin
    .from('user_access')
    .select('resource_id, role')
    .eq('user_id', userId)
    .eq('resource_type', 'org')
    .limit(1)
    .single();

  if (userAccess) {
    return {
      organizationId: userAccess.resource_id,
      role: userAccess.role
    };
  }

  // No organization found
  return {
    organizationId: null,
    role: null
  };
}