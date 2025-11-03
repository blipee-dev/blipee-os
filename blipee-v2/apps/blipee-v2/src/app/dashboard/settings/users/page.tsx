'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'

interface Member {
  id: string
  role: string
  is_owner: boolean
  invitation_status: string
  joined_at: string | null
  full_name: string
  email: string
  job_title: string | null
  last_active_at: string | null
}

async function fetchMembers(organizationId: string): Promise<Member[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      is_owner,
      invitation_status,
      joined_at,
      user_profiles!organization_members_user_id_fkey (
        full_name,
        email,
        job_title,
        last_active_at
      )
    `)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_owner', { ascending: false })
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('[Members] Error loading members:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Filter out members without user_profiles (RLS blocked or missing data)
  return data
    .filter(item => item.user_profiles !== null)
    .map(item => ({
      id: item.id,
      role: item.role,
      is_owner: item.is_owner,
      invitation_status: item.invitation_status,
      joined_at: item.joined_at,
      full_name: item.user_profiles.full_name,
      email: item.user_profiles.email,
      job_title: item.user_profiles.job_title,
      last_active_at: item.user_profiles.last_active_at,
    }))
}

export default function UsersPage() {
  const { organization, loading: orgLoading } = useUserOrganization()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', organization?.id],
    queryFn: () => fetchMembers(organization!.id),
    enabled: !!organization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US')
  }

  function getRoleBadgeColor(role: string, isOwner: boolean) {
    if (isOwner) return { bg: 'var(--primary-bg)', text: 'var(--primary-text)' }
    if (role === 'admin') return { bg: 'var(--warning-bg)', text: 'var(--warning-text)' }
    return { bg: 'var(--info-bg)', text: 'var(--info-text)' }
  }

  if (orgLoading || isLoading) {
    return (
      <div className={styles.section}>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading users...
        </p>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>No Organization</h2>
        <p className={styles.sectionDescription}>
          You are not associated with any organization.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Organization Users</h2>
        <p className={styles.sectionDescription}>
          Members of {organization.name} ({members.length} member{members.length !== 1 ? 's' : ''})
        </p>

        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>No members found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Job Title</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Member since</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Last active</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const badgeColor = getRoleBadgeColor(member.role, member.is_owner)
                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {member.full_name}
                        {member.is_owner && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-text)' }}>
                            👑
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {member.email}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                        {member.job_title || '-'}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          backgroundColor: badgeColor.bg,
                          color: badgeColor.text,
                        }}>
                          {member.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                        {formatDate(member.joined_at)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                        {formatDate(member.last_active_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
