'use server'

import { createAdminClient, createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'

interface InviteUserData {
  email: string
  full_name: string
  job_title?: string
  department?: string
  phone?: string
  mobile_phone?: string
  organization_id: string
  role: string
  access_all_facilities: boolean
  facility_ids?: string[]
}

interface UpdateUserData extends InviteUserData {
  user_id: string
}

/**
 * Invite a new user to the organization
 * Creates auth credentials and sends invitation email
 */
export async function inviteUser(formData: InviteUserData) {
  try {
    // 1. Verify current user is authenticated and has permissions
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // 2. Check if user is admin or super admin
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role, is_owner')
      .eq('user_id', user.id)
      .eq('organization_id', formData.organization_id)
      .single()

    const isSuperAdmin = user.user_metadata?.is_super_admin === true
    const isAdmin = currentMember?.is_owner || currentMember?.role === 'admin'

    if (!isSuperAdmin && !isAdmin) {
      return { error: 'Insufficient permissions' }
    }

    // 3. Create user in auth.users via Admin API with custom invitation token (SAFE-LINK PROOF)
    const adminClient = createAdminClient()

    // Create user without sending native Supabase email
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      email_confirm: false, // User will confirm via our custom token
      user_metadata: {
        full_name: formData.full_name,
        organization_id: formData.organization_id,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { error: authError.message }
    }

    if (!authUser?.user) {
      return { error: 'Failed to create user' }
    }

    // Generate invitation token
    const { storeToken, generateTokenUrl } = await import('@/lib/auth/tokens')
    const { token, error: tokenError } = await storeToken(
      formData.email,
      'invitation',
      { organization_id: formData.organization_id } // Store org ID in metadata
    )

    if (tokenError || !token) {
      console.error('Token generation error:', tokenError)
      // Cleanup auth user if token fails
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return { error: 'Failed to generate invitation token' }
    }

    // Generate invitation URL
    const invitationUrl = generateTokenUrl(
      process.env.NEXT_PUBLIC_APP_URL!,
      'invitation',
      formData.email,
      token
    )

    console.log('[INVITE USER] Invitation URL:', invitationUrl)

    // Send invitation email
    const { sendEmail } = await import('@/lib/email/mailer')
    const { userInvitationTemplate } = await import('@/lib/email/templates')

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', formData.organization_id)
      .single()

    const emailResult = await sendEmail({
      to: formData.email,
      subject: `You've been invited to ${org?.name || 'blipee'}`,
      html: userInvitationTemplate(
        inviterProfile?.full_name || 'A team member',
        org?.name || 'the organization',
        invitationUrl,
        formData.role
      ),
    })

    if (!emailResult.success) {
      console.error('[INVITE USER] Failed to send invitation email:', emailResult.error)
      // Cleanup and return error
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return { error: 'Failed to send invitation email. Please try again.' }
    }

    console.log('[INVITE USER] Invitation email sent successfully')

    // 4. Create user_profile (using the ID from auth.users)
    const { error: profileError } = await adminClient.from('user_profiles').insert({
      id: authUser.user.id,
      email: formData.email,
      full_name: formData.full_name,
      job_title: formData.job_title,
      department: formData.department,
      phone: formData.phone,
      mobile_phone: formData.mobile_phone,
    })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to cleanup auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return { error: `Failed to create user profile: ${profileError.message}` }
    }

    // 5. Create organization membership
    const { error: memberError } = await adminClient.from('organization_members').insert({
      user_id: authUser.user.id,
      organization_id: formData.organization_id,
      role: formData.role as any,
      access_all_facilities: formData.access_all_facilities,
      facility_ids: formData.facility_ids || null,
      invitation_status: 'pending',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error('Member error:', memberError)
      // Try to cleanup auth user and profile if membership creation fails
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      await adminClient.from('user_profiles').delete().eq('id', authUser.user.id)
      return { error: `Failed to create organization membership: ${memberError.message}` }
    }

    revalidatePath('/dashboard/settings/users')
    return { success: true, userId: authUser.user.id }
  } catch (error) {
    console.error('Invite user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing user
 */
export async function updateUser(formData: UpdateUserData) {
  try {
    // 1. Verify current user is authenticated and has permissions
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // 2. Check if user is admin or super admin
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role, is_owner')
      .eq('user_id', user.id)
      .eq('organization_id', formData.organization_id)
      .single()

    const isSuperAdmin = user.user_metadata?.is_super_admin === true
    const isAdmin = currentMember?.is_owner || currentMember?.role === 'admin'

    if (!isSuperAdmin && !isAdmin) {
      return { error: 'Insufficient permissions' }
    }

    // 3. Update user_profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: formData.full_name,
        job_title: formData.job_title,
        department: formData.department,
        phone: formData.phone,
        mobile_phone: formData.mobile_phone,
      })
      .eq('id', formData.user_id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return { error: `Failed to update user profile: ${profileError.message}` }
    }

    // 4. Update organization membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .update({
        role: formData.role as any,
        access_all_facilities: formData.access_all_facilities,
        facility_ids: formData.facility_ids || null,
      })
      .eq('user_id', formData.user_id)
      .eq('organization_id', formData.organization_id)

    if (memberError) {
      console.error('Member update error:', memberError)
      return { error: `Failed to update organization membership: ${memberError.message}` }
    }

    revalidatePath('/dashboard/settings/users')
    return { success: true }
  } catch (error) {
    console.error('Update user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a user from the organization
 */
export async function deleteUser(userId: string, organizationId: string) {
  try {
    // 1. Verify current user is authenticated and has permissions
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // 2. Check if user is admin or super admin
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role, is_owner')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    const isSuperAdmin = user.user_metadata?.is_super_admin === true
    const isAdmin = currentMember?.is_owner || currentMember?.role === 'admin'

    if (!isSuperAdmin && !isAdmin) {
      return { error: 'Insufficient permissions' }
    }

    // 3. Soft delete organization membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (memberError) {
      console.error('Delete member error:', memberError)
      return { error: `Failed to remove user: ${memberError.message}` }
    }

    // 4. Check if user has other organization memberships
    const { data: otherMemberships, error: checkError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (checkError) {
      console.error('Check memberships error:', checkError)
    }

    // 5. If no other active memberships, soft delete user profile
    if (!otherMemberships || otherMemberships.length === 0) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId)

      if (profileError) {
        console.error('Delete profile error:', profileError)
      }
    }

    revalidatePath('/dashboard/settings/users')
    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
