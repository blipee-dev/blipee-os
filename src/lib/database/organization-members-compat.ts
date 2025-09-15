import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Compatibility layer for organization members queries
 * Handles both old (user_organizations) and new (organization_members) table names
 */
export class OrganizationMembersCompat {
  private tableName: string | null = null;
  
  constructor(private supabase: SupabaseClient) {}
  
  /**
   * Get the correct table name to use
   */
  private async getTableName(): Promise<string> {
    if (this.tableName) return this.tableName;
    
    try {
      // Try the new table first
      const { error: newTableError } = await this.supabase
        .from('organization_members')
        .select('user_id')
        .limit(1);
      
      if (!newTableError) {
        this.tableName = 'organization_members';
        return this.tableName;
      }
      
      // Fallback to old table
      const { error: oldTableError } = await this.supabase
        .from('user_organizations')
        .select('user_id')
        .limit(1);
      
      if (!oldTableError) {
        this.tableName = 'user_organizations';
        return this.tableName;
      }
      
      // Default to new table name if both fail
      this.tableName = 'organization_members';
      return this.tableName;
    } catch (error) {
      // Default to new table name on error
      this.tableName = 'organization_members';
      return this.tableName;
    }
  }
  
  /**
   * Get user's organization memberships
   */
  async getUserOrganizations(userId: string) {
    const tableName = await this.getTableName();
    
    if (tableName === 'organization_members') {
      return this.supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          invitation_status,
          organization:organizations (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('user_id', userId)
        .eq('invitation_status', 'accepted');
    } else {
      // Old table doesn't have invitation_status
      return this.supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('user_id', userId);
    }
  }
  
  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string) {
    const tableName = await this.getTableName();
    
    if (tableName === 'organization_members') {
      return this.supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          invitation_status,
          user:user_profiles (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('invitation_status', 'accepted');
    } else {
      return this.supabase
        .from('user_organizations')
        .select(`
          user_id,
          role,
          user:user_profiles (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId);
    }
  }
  
  /**
   * Check if user is member of organization
   */
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const tableName = await this.getTableName();
    
    const query = tableName === 'organization_members'
      ? this.supabase
          .from('organization_members')
          .select('user_id')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .eq('invitation_status', 'accepted')
          .single()
      : this.supabase
          .from('user_organizations')
          .select('user_id')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .single();
    
    const { data, error } = await query;
    return !error && !!data;
  }
}

// Factory function to create a compatibility instance
export function createOrgMembersCompat(supabase: SupabaseClient) {
  return new OrganizationMembersCompat(supabase);
}