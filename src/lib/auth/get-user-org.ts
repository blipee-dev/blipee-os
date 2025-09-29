/**
 * Helper function to get user's organization consistently
 * Uses organization_members table to link users to organizations
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface UserOrgInfo {
  organizationId: string | null;
  role: string | null;
}

export async function getUserOrganization(userId: string): Promise<UserOrgInfo> {
  // Check organization_members table which links users to organizations
  const { data: memberData } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (memberData?.organization_id) {
    return {
      organizationId: memberData.organization_id,
      role: memberData.role
    };
  }

  // No organization found
  return {
    organizationId: null,
    role: null
  };
}