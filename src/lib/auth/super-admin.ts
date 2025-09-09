import { createClient } from '@/lib/supabase/server';

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('is_super_admin', { user_uuid: userId });
    
    if (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in isSuperAdmin function:', error);
    return false;
  }
}

export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('is_current_user_super_admin');
    
    if (error) {
      console.error('Error checking current user super admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in isCurrentUserSuperAdmin function:', error);
    return false;
  }
}

export async function addSuperAdmin(userId: string, createdBy: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('super_admins')
      .insert({
        user_id: userId,
        created_by: createdBy
      });
    
    if (error) {
      console.error('Error adding super admin:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in addSuperAdmin function:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function removeSuperAdmin(userId: string, removedBy: string) {
  try {
    const supabase = await createClient();
    
    // Prevent removing self
    if (userId === removedBy) {
      return { success: false, error: 'Cannot remove your own super admin access' };
    }
    
    const { error } = await supabase
      .from('super_admins')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error removing super admin:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in removeSuperAdmin function:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function getSuperAdmins() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('super_admins')
      .select(`
        id,
        user_id,
        created_at,
        created_by
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching super admins:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getSuperAdmins function:', error);
    return null;
  }
}