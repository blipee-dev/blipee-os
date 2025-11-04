/**
 * Hook to check if current user is a super admin
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

async function checkIsSuperAdmin(): Promise<boolean> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  // Check if user is in super_admins table
  const { data, error } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

export function useIsSuperAdmin() {
  const query = useQuery({
    queryKey: ['is-super-admin'],
    queryFn: checkIsSuperAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutes - super admin status doesn't change often
  })

  return {
    isSuperAdmin: query.data ?? false,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  }
}
