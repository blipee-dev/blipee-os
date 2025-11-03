/**
 * Hook to manage user profile data
 * Uses React Query for data fetching and mutations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name: string
  job_title: string
  department: string
  employee_id: string
  phone: string
  mobile_phone: string
  avatar_url: string
  created_at: string
  preferences?: {
    avatarSettings?: {
      type: 'icon' | 'initials'
      gradient: string
      icon: string
    }
    [key: string]: any
  }
}

export interface UpdateProfileData {
  full_name?: string
  display_name?: string
  job_title?: string
  department?: string
  employee_id?: string
  phone?: string
  mobile_phone?: string
  avatar_url?: string
  preferences?: any
}

async function fetchUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get user profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[useUserProfile] Error loading profile:', error)
    throw error
  }

  // If no profile exists, create one
  if (!data) {
    const newProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.name || '',
      preferences: {
        avatarSettings: {
          type: 'initials',
          gradient: 'blipee',
          icon: 'user',
        }
      }
    }

    const { data: createdProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert(newProfile)
      .select()
      .single()

    if (insertError) {
      console.error('[useUserProfile] Error creating profile:', insertError)
      throw insertError
    }

    return createdProfile as UserProfile
  }

  return data as UserProfile
}

async function updateUserProfile(updates: UpdateProfileData): Promise<UserProfile> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get existing preferences to merge
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  const existingPreferences = (currentProfile?.preferences as any) || {}

  const updateData = {
    ...updates,
    preferences: updates.preferences
      ? { ...existingPreferences, ...updates.preferences }
      : existingPreferences,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[useUserProfile] Error updating profile:', error)
    throw error
  }

  return data as UserProfile
}

export function useUserProfile() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['user-profile'], data)
      // Trigger avatar update event for Navbar
      window.dispatchEvent(new Event('avatarSettingsUpdated'))
    },
  })

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    updating: mutation.isPending,
    updateError: mutation.error?.message ?? null,
  }
}
