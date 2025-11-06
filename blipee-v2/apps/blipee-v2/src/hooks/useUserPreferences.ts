/**
 * Hook to manage user preferences
 * Uses React Query for data fetching and mutations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

export interface UserPreferences {
  language: string
  timezone: string
  emailNotifications: boolean
  criticalAlerts: boolean
  warningAlerts: boolean
  infoAlerts: boolean
  defaultDateRange: string
}

export interface UpdatePreferencesData {
  language?: string
  timezone?: string
  emailNotifications?: boolean
  criticalAlerts?: boolean
  warningAlerts?: boolean
  infoAlerts?: boolean
  defaultDateRange?: string
}

async function fetchUserPreferences(): Promise<UserPreferences> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get user preferences
  const { data, error } = await supabase
    .from('user_profiles')
    .select('preferred_language, timezone, notification_settings, preferences')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[useUserPreferences] Error loading preferences:', error)
    throw error
  }

  const notificationSettings = (data?.notification_settings as any) || {}
  const preferences = (data?.preferences as any) || {}

  // Map old locale codes to new ones for backward compatibility
  let language = data?.preferred_language || 'pt-PT'
  if (language === 'pt') language = 'pt-PT'
  if (language === 'en') language = 'en-US'
  if (language === 'es') language = 'es-ES'

  return {
    language,
    timezone: data?.timezone || 'Europe/Lisbon (WEST)',
    emailNotifications: notificationSettings.email ?? true,
    criticalAlerts: notificationSettings.critical ?? true,
    warningAlerts: notificationSettings.warning ?? true,
    infoAlerts: notificationSettings.info ?? false,
    defaultDateRange: preferences.defaultDateRange || 'last-7-days',
  }
}

async function updateUserPreferences(updates: UpdatePreferencesData): Promise<UserPreferences> {
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
    preferred_language: updates.language,
    timezone: updates.timezone,
    notification_settings: {
      email: updates.emailNotifications,
      critical: updates.criticalAlerts,
      warning: updates.warningAlerts,
      info: updates.infoAlerts,
    },
    preferences: {
      ...existingPreferences,
      defaultDateRange: updates.defaultDateRange,
    },
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('[useUserPreferences] Error updating preferences:', error)
    throw error
  }

  // Return the updated preferences
  return {
    language: updates.language!,
    timezone: updates.timezone!,
    emailNotifications: updates.emailNotifications!,
    criticalAlerts: updates.criticalAlerts!,
    warningAlerts: updates.warningAlerts!,
    infoAlerts: updates.infoAlerts!,
    defaultDateRange: updates.defaultDateRange!,
  }
}

export function useUserPreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const mutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['user-preferences'], data)
    },
  })

  return {
    preferences: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    updatePreferences: mutation.mutate,
    updatePreferencesAsync: mutation.mutateAsync,
    updating: mutation.isPending,
    updateError: mutation.error?.message ?? null,
  }
}
