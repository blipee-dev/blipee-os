import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Check if current user is super admin
    const { data: superAdminCheck } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get current user's role
    const { data: currentUser } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    // Only super admins, owners, and managers can delete users
    const canDelete = superAdminCheck || (currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager'));

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete users' }, { status: 403 });
    }

    // Get all users to be deleted with their auth_user_ids
    const { data: usersToDelete, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('id, email, auth_user_id')
      .in('id', userIds);

    if (fetchError) {
      console.error('Error fetching users to delete:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    console.log(`Starting bulk delete for ${usersToDelete?.length || 0} users`);

    for (const targetUser of usersToDelete || []) {
      try {
        // Clean up user_access entries
        await supabaseAdmin
          .from('user_access')
          .delete()
          .eq('user_id', targetUser.auth_user_id || targetUser.id);

        // Delete from app_users first (due to foreign key constraint)
        const { error: deleteError } = await supabaseAdmin
          .from('app_users')
          .delete()
          .eq('id', targetUser.id);

        if (deleteError) {
          console.error(`Error deleting app_user ${targetUser.email}:`, deleteError);
          errors.push({ email: targetUser.email, error: deleteError.message });
          failedCount++;
          continue;
        }

        // Now delete from auth.users if auth_user_id exists
        if (targetUser.auth_user_id) {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
            targetUser.auth_user_id
          );

          if (authDeleteError) {
            console.error(`Error deleting auth user for ${targetUser.email}:`, authDeleteError);
            // Don't count as failure since app_user was deleted
            console.log(`Warning: Could not delete auth user for ${targetUser.email}, but app_user was deleted`);
          } else {
            console.log(`Successfully deleted both app_user and auth user for ${targetUser.email}`);
          }
        }

        successCount++;

        // Log audit entry for each deletion
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: user.id,
            action: 'user.deleted',
            resource_type: 'user',
            resource_id: targetUser.id,
            details: {
              deleted_user_email: targetUser.email,
              deleted_by: currentUser?.email || user.email,
              bulk_operation: true
            }
          })
          .select()
          .single();

      } catch (error: any) {
        console.error(`Unexpected error deleting user ${targetUser.email}:`, error);
        errors.push({ email: targetUser.email, error: error.message });
        failedCount++;
      }
    }

    console.log(`Bulk delete completed: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      totalRequested: userIds.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error in bulk user deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}