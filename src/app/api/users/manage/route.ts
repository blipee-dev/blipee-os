import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SimpleRoleName, LEGACY_TO_SIMPLE_MAPPING } from '@/lib/rbac/types';
import { sendInvitationEmailViaGmail } from '@/lib/email/send-invitation-gmail';

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

    // Check if current user is super admin
    const { data: superAdminCheck } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Check if user has permission to create users based on Simple RBAC
    // Get current user's role
    const { data: currentUser } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    // Only super admins, owners, and managers can create users
    const canCreate = superAdminCheck || (currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager'));

    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create users' }, { status: 403 });
    }

    // IMPORTANT: Check if user already exists in app_users FIRST
    const { data: existingAppUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingAppUser) {
      // User already exists in app_users
      if (existingAppUser.auth_user_id) {
        // Already has auth account
        return NextResponse.json({
          error: 'User with this email already exists'
        }, { status: 409 });
      } else {
        // App user exists but no auth account - delete it first
        await supabaseAdmin
          .from('app_users')
          .delete()
          .eq('email', email);
      }
    }

    // Detect user's language from request headers
    const acceptLanguage = request.headers.get('accept-language') || '';
    const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());
    let userLanguage = 'en';
    if (languages.some(l => l.startsWith('es'))) userLanguage = 'es';
    else if (languages.some(l => l.startsWith('pt'))) userLanguage = 'pt';

    // Get organization details for the email
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single();

    const organizationName = orgData?.name || 'Your Organization';

    // Create the auth user WITHOUT sending Supabase's default invite
    // We'll generate a random password that the user will reset
    const tempPassword = Math.random().toString(36).slice(-16) + 'Aa1!'; // Meets password requirements

    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Don't auto-confirm email
      user_metadata: {
        full_name: name,
        display_name: name,
        organization_id: organization_id,
        language: userLanguage
      }
    });

    // If user creation successful, send our custom invitation email
    if (!createUserError && authUser) {
      try {
        // Generate password reset link
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: email,
          options: {
            data: {
              full_name: name,
              organization_id: organization_id,
              language: userLanguage
            }
          }
        });

        if (resetData && !resetError) {
          // The Supabase invite link has the token in query params
          // We need to use the direct Supabase link with proper redirect
          const actionLink = resetData.properties.action_link;

          // Parse and modify the Supabase URL to ensure proper redirect
          const url = new URL(actionLink);
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

          // IMPORTANT: Update the redirect_to parameter to our auth callback page
          // This ensures after Supabase verifies the token, it redirects to our callback
          url.searchParams.delete('redirect_to');
          url.searchParams.append('redirect_to', `${baseUrl}/auth/callback`);

          // The modified Supabase URL that will redirect to our callback
          const confirmationUrl = url.toString();

          console.log('Invitation link generated:', confirmationUrl);

          // Send our custom invitation email
          await sendInvitationEmailViaGmail({
            email,
            userName: name,
            organizationName,
            inviterName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team Admin',
            role,
            confirmationUrl,
            language: userLanguage as 'en' | 'es' | 'pt'
          });

          console.log(`Custom invitation email sent to ${email} in ${userLanguage}`);
        }
      } catch (emailError) {
        console.error('Error sending custom invitation email:', emailError);
        // Continue even if email fails - user can still be created
      }
    }

    if (createUserError) {
      console.error('Error creating auth user:', createUserError);
      // If invite fails, try to check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        // User already exists in auth, use their ID
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('app_users')
          .insert([{
            name,
            email,
            role,
            organization_id,
            auth_user_id: existingUser.id,
            status: status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: {
              access_level: access_level || 'organization',
              site_ids: access_level === 'site' ? (site_ids || []) : []
            }
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating app user:', createError);
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json({
          user: { ...newUser, site_ids, access_level },
          message: 'User created with existing auth account'
        });
      } else {
        return NextResponse.json({ error: 'Failed to create auth account: ' + createUserError.message }, { status: 500 });
      }
    }

    // Auth user created successfully
    // The trigger should have created the app_users record, but let's check
    // First, wait a brief moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if the trigger created the user
    let { data: newUser, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select()
      .eq('email', email)
      .single();

    // If the trigger didn't create it (or there was an error), create it manually
    if (!newUser || fetchError) {
      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('app_users')
        .insert([{
          name,
          email,
          role,
          organization_id,
          auth_user_id: authUser.user.id,
          status: 'pending', // Will become active after first login
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          permissions: {
            access_level: access_level || 'organization',
            site_ids: access_level === 'site' ? (site_ids || []) : []
          }
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating app user:', createError);
        // If app_users creation fails, we should clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      newUser = createdUser;
    } else {
      // If trigger created it, update it with the correct data
      const { data: updatedUser } = await supabaseAdmin
        .from('app_users')
        .update({
          name,
          role,
          organization_id,
          status: 'pending',
          permissions: {
            access_level: access_level || 'organization',
            site_ids: access_level === 'site' ? (site_ids || []) : []
          }
        })
        .eq('email', email)
        .select()
        .single();

      if (updatedUser) {
        newUser = updatedUser;
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

    // Get the user being updated to check if it's self-update
    const { data: targetUser } = await supabaseAdmin
      .from('app_users')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    // Check if this is a self-update (user updating their own profile)
    const isSelfUpdate = targetUser?.auth_user_id === user.id;

    // If not self-update, check permissions
    if (!isSelfUpdate) {
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

      // Only super admins, owners, and managers can update other users
      const canUpdate = superAdminCheck || (currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager'));

      if (!canUpdate) {
        return NextResponse.json({ error: 'Insufficient permissions to update users' }, { status: 403 });
      }
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

    // Store access level and site_ids in permissions field as JSONB
    // Make sure site_ids is always an array
    const siteIdsArray = Array.isArray(site_ids) ? site_ids : [];
    updateData.permissions = {
      access_level: access_level || 'organization',
      site_ids: access_level === 'site' ? siteIdsArray : []
    };

    console.log('Updating user with data:', updateData);
    console.log('User ID:', id);

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

    // Also update auth.users metadata if auth_user_id exists
    if (updatedUser.auth_user_id) {
      try {
        // Update user metadata in auth.users
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          updatedUser.auth_user_id,
          {
            email: email, // Update email if changed
            user_metadata: {
              full_name: name,
              display_name: name,
              role: role,
              organization_id: organization_id,
              permissions: updateData.permissions
            }
          }
        );

        if (authUpdateError) {
          console.error('Error updating auth user metadata:', authUpdateError);
          // Don't fail the whole operation if metadata update fails
          console.log('Warning: Could not update auth user metadata, but app_user was updated successfully');
        } else {
          console.log(`Successfully updated both app_user and auth metadata for user ${id}`);
        }
      } catch (authError) {
        console.error('Failed to update auth user:', authError);
        // Continue - app_user update was successful
      }
    }

    // Simple RBAC: Role is stored directly in app_users table
    // Permissions field handles site-level access control
    // Auth metadata is kept in sync for consistency

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

    // Check if current user is super admin
    const { data: superAdminCheck } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Check if current user has permission to delete users based on Simple RBAC
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

    // Simple RBAC: No user_roles table to clean up
    // User access is stored in user_access table if needed
    // Clean up user_access entries
    await supabaseAdmin
      .from('user_access')
      .delete()
      .eq('user_id', targetUser.auth_user_id || userId);

    // Delete the user from app_users first (due to foreign key constraint)
    const { error: deleteError } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting app_user:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Now delete from auth.users if auth_user_id exists
    if (targetUser.auth_user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        targetUser.auth_user_id
      );

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);
        // Don't fail the whole operation if auth deletion fails
        // The app_user is already deleted
        console.log('Warning: Could not delete auth user, but app_user was deleted successfully');
      } else {
        console.log(`Successfully deleted both app_user and auth user for ${userId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

