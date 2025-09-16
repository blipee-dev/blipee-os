import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { RBACService } from '@/lib/rbac/service';
import { RoleName, LEGACY_ROLE_MAPPING } from '@/lib/rbac/types';

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
    const { name, email, role, organization_id, status, site_ids, access_level } = body;

    // Check if user has permission to create users using Enterprise RBAC
    const hasPermission = await RBACService.checkPermission({
      user_id: user.id,
      resource: 'user',
      action: 'create',
      organization_id
    });

    if (!hasPermission.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions to create users' }, { status: 403 });
    }

    // Create the user using admin client (bypasses RLS)
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('app_users')
      .insert([{
        name,
        email,
        role,
        organization_id,
        status: status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Grant role to the new user using Enterprise RBAC
    if (newUser.auth_user_id || newUser.id) {
      // Map legacy role name to Enterprise RBAC role
      const rbacRoleName = LEGACY_ROLE_MAPPING[role] || RoleName.STAKEHOLDER;

      if (access_level === 'site' && site_ids && site_ids.length > 0) {
        // Grant site-specific roles
        for (const site_id of site_ids) {
          await RBACService.grantRole(
            newUser.auth_user_id || newUser.id,
            rbacRoleName,
            organization_id,
            site_id,
            user.id
          );
        }
      } else {
        // Grant organization-wide role
        await RBACService.grantRole(
          newUser.auth_user_id || newUser.id,
          rbacRoleName,
          organization_id,
          undefined,
          user.id
        );
      }

      // Also store in permissions field for backward compatibility
      if (access_level === 'site') {
        await supabaseAdmin
          .from('app_users')
          .update({
            permissions: {
              access_level,
              site_ids
            }
          })
          .eq('id', newUser.id);
      }
    }

    return NextResponse.json({ user: { ...newUser, site_ids, access_level } });
  } catch (error: any) {
    console.error('Error in user creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { id, name, email, role, organization_id, status, site_ids, access_level } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user has permission to update users using Enterprise RBAC
    const hasPermission = await RBACService.checkPermission({
      user_id: user.id,
      resource: 'user',
      action: 'update',
      organization_id
    });

    if (!hasPermission.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions to update users' }, { status: 403 });
    }

    // Update the user using admin client (bypasses RLS)
    const updateData: any = {
      name,
      email,
      role,
      organization_id,
      status,
      updated_at: new Date().toISOString()
    };

    // Store access level and site_ids in permissions field
    if (access_level) {
      updateData.permissions = {
        access_level,
        site_ids: access_level === 'site' ? site_ids : []
      };
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('app_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update user roles using Enterprise RBAC
    if (updatedUser.auth_user_id || id) {
      // First, deactivate all existing roles for this user in the organization
      const { data: existingRoles } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', updatedUser.auth_user_id || id)
        .eq('organization_id', organization_id)
        .eq('is_active', true);

      if (existingRoles) {
        for (const userRole of existingRoles) {
          await RBACService.revokeRole(userRole.id);
        }
      }

      // Map legacy role name to Enterprise RBAC role
      const rbacRoleName = LEGACY_ROLE_MAPPING[role] || RoleName.STAKEHOLDER;

      if (access_level === 'site' && site_ids && site_ids.length > 0) {
        // Grant site-specific roles
        for (const site_id of site_ids) {
          await RBACService.grantRole(
            updatedUser.auth_user_id || id,
            rbacRoleName,
            organization_id,
            site_id,
            user.id
          );
        }
      } else {
        // Grant organization-wide role
        await RBACService.grantRole(
          updatedUser.auth_user_id || id,
          rbacRoleName,
          organization_id,
          undefined,
          user.id
        );
      }
    }

    return NextResponse.json({ user: { ...updatedUser, site_ids, access_level } });
  } catch (error: any) {
    console.error('Error in user update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user to be deleted to check their organization
    const { data: targetUser } = await supabaseAdmin
      .from('app_users')
      .select('organization_id, auth_user_id')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user has permission to delete users using Enterprise RBAC
    const hasPermission = await RBACService.checkPermission({
      user_id: user.id,
      resource: 'user',
      action: 'delete',
      organization_id: targetUser.organization_id
    });

    if (!hasPermission.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions to delete users' }, { status: 403 });
    }

    // Delete user_roles entries if they exist
    const { data: tableExists } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .limit(1);

    if (tableExists !== null) {
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', targetUser.auth_user_id || userId);
    }

    // Delete the user using admin client (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

