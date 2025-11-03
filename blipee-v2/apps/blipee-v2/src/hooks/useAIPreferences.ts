/**
 * Hook to manage AI Assistant preferences
 * Uses React Query for data fetching and mutations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

export interface AIPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal'
  proactivity: 'low' | 'medium' | 'high'
  detail_level: 'concise' | 'balanced' | 'detailed'
}

export interface AIPreferences {
  response_format?: 'bullets' | 'paragraphs' | 'mixed'
  include_examples?: boolean
  show_technical_details?: boolean
  suggest_improvements?: boolean
}

export interface AISettings {
  personality: AIPersonality
  preferences: AIPreferences
}

async function fetchAISettings(): Promise<AISettings> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get AI settings
  const { data, error } = await supabase
    .from('user_profiles')
    .select('ai_personality, ai_preferences')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[useAIPreferences] Error loading AI settings:', error)
    throw error
  }

  const personality = (data?.ai_personality as any) || {
    tone: 'professional',
    proactivity: 'medium',
    detail_level: 'balanced',
  }

  const preferences = (data?.ai_preferences as any) || {
    response_format: 'mixed',
    include_examples: true,
    show_technical_details: false,
    suggest_improvements: true,
  }

  return {
    personality,
    preferences,
  }
}

async function updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (settings.personality) {
    updateData.ai_personality = settings.personality
  }

  if (settings.preferences) {
    updateData.ai_preferences = settings.preferences
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('[useAIPreferences] Error updating AI settings:', error)
    throw error
  }

  // Return the updated settings
  return {
    personality: settings.personality || {} as AIPersonality,
    preferences: settings.preferences || {} as AIPreferences,
  }
}

export function useAIPreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['ai-preferences'],
    queryFn: fetchAISettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const mutation = useMutation({
    mutationFn: updateAISettings,
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['ai-preferences'], data)
    },
  })

  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync,
    updating: mutation.isPending,
    updateError: mutation.error?.message ?? null,
  }
}
