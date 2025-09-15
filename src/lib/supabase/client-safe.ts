import { createClient } from '@/lib/supabase/client';

/**
 * Safe wrapper for Supabase queries that handles missing tables gracefully
 */
export function createSafeClient() {
  const client = createClient();
  
  // Override the from method to handle missing tables
  const originalFrom = client.from.bind(client);
  
  client.from = function(table: string) {
    // Redirect old table names to new ones
    const tableMapping: Record<string, string> = {
      'user_organizations': 'organization_members'
    };
    
    const actualTable = tableMapping[table] || table;
    
    if (actualTable !== table) {
      console.warn(`Table '${table}' has been renamed to '${actualTable}'. Please update your code.`);
    }
    
    return originalFrom(actualTable);
  };
  
  return client;
}

/**
 * Get user organizations with automatic table name handling
 */
export async function getUserOrganizationsClient(userId: string) {
  const supabase = createSafeClient();
  
  const { data, error } = await supabase
    .from('organization_members')  // Always use the correct table name
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
    
  return { data, error };
}