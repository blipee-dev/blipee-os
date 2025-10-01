/**
 * Helper function to get user's organization consistently
 * Uses organization_members table to link users to organizations
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';

export interface UserOrgInfo {
  organizationId: string | null;
  role: string | null;
  organization?: {
    id: string;
    name: string;
    industry_primary?: string;
    company_size?: string;
    compliance_frameworks?: string[];
  };
}

// Main version using admin client for API routes
export async function getUserOrganization(supabase: SupabaseClient): Promise<UserOrgInfo | null> {
  // Get authenticated user from the passed client
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }

  // Use admin client to bypass RLS and get organization data
  const { data: memberData } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (memberData?.organization_id) {
    // Get organization details using admin client
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id, name, industry_primary, company_size, compliance_frameworks')
      .eq('id', memberData.organization_id)
      .single();

    return {
      organizationId: memberData.organization_id,
      role: memberData.role,
      organization: orgData || undefined
    };
  }

  // No organization found
  return null;
}

// Alternative version that takes just a userId
export async function getUserOrganizationById(userId: string): Promise<UserOrgInfo> {
  // Check organization_members table which links users to organizations
  const { data: memberData } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (memberData?.organization_id) {
    // Get organization details
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id, name, industry_primary, company_size, compliance_frameworks')
      .eq('id', memberData.organization_id)
      .single();

    return {
      organizationId: memberData.organization_id,
      role: memberData.role,
      organization: orgData || undefined
    };
  }

  // No organization found
  return {
    organizationId: null,
    role: null
  };
}