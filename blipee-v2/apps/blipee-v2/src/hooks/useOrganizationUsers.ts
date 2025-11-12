'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/v2/client'
import type { OrgUser } from '@/lib/types/initiatives'

export function useOrganizationUsers(organizationId?: string) {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    async function fetchUsers() {
      try {
        const supabase = createClient()

        // Get all members of the organization
        const { data: members, error: membersError } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId)
          .is('deleted_at', null)

        if (membersError) throw membersError

        if (!members || members.length === 0) {
          setUsers([])
          setLoading(false)
          return
        }

        const userIds = members.map((m) => m.user_id)

        // Get user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)

        if (profilesError) throw profilesError

        setUsers(profiles || [])
      } catch (err) {
        console.error('Error fetching organization users:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [organizationId])

  return { users, loading, error }
}
