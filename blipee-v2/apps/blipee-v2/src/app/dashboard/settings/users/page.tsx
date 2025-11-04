'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'
import { UserDetailsModal } from '@/components/users/UserDetailsModal'
import styles from '@/styles/settings-layout.module.css'

interface Member {
  membership_id: string
  user_id: string
  role: string
  is_owner: boolean
  invitation_status: string
  joined_at: string | null
  full_name: string
  email: string
  job_title: string | null
  department: string | null
  phone: string | null
  mobile_phone: string | null
  access_all_facilities: boolean
  facility_ids: string[] | null
  last_active_at: string | null
}

async function fetchMembers(organizationId: string): Promise<Member[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      is_owner,
      invitation_status,
      joined_at,
      access_all_facilities,
      facility_ids,
      user_profiles!organization_members_user_id_fkey (
        full_name,
        email,
        job_title,
        department,
        phone,
        mobile_phone,
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
      membership_id: item.id,
      user_id: item.user_id,
      role: item.role,
      is_owner: item.is_owner,
      invitation_status: item.invitation_status,
      joined_at: item.joined_at,
      access_all_facilities: item.access_all_facilities,
      facility_ids: item.facility_ids,
      full_name: item.user_profiles.full_name,
      email: item.user_profiles.email,
      job_title: item.user_profiles.job_title,
      department: item.user_profiles.department,
      phone: item.user_profiles.phone,
      mobile_phone: item.user_profiles.mobile_phone,
      last_active_at: item.user_profiles.last_active_at,
    }))
}

export default function UsersPage() {
  const { organization, loading: orgLoading } = useUserOrganization()
  const { isSuperAdmin, loading: superAdminLoading } = useIsSuperAdmin()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ['members', organization?.id],
    queryFn: () => fetchMembers(organization!.id),
    enabled: !!organization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Check if current user is admin (owner or admin role)
  const currentUserMember = members.find(m => m.email === organization?.user_email)
  const isAdmin = currentUserMember?.is_owner || currentUserMember?.role === 'admin'

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US')
  }

  function getRoleBadgeColor(role: string, isOwner: boolean) {
    if (isOwner) return { bg: 'var(--primary-bg)', text: 'var(--primary-text)' }
    if (role === 'admin') return { bg: 'var(--warning-bg)', text: 'var(--warning-text)' }
    return { bg: 'var(--info-bg)', text: 'var(--info-text)' }
  }

  const handleRowClick = (member: Member) => {
    setSelectedUser(member)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleModalUpdate = () => {
    refetch()
  }

  if (orgLoading || isLoading || superAdminLoading) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 className={styles.sectionTitle}>Organization Users</h2>
            <p className={styles.sectionDescription}>
              Members of {organization.name} ({members.length} member{members.length !== 1 ? 's' : ''})
            </p>
          </div>

          {(isSuperAdmin || isAdmin) && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setIsModalOpen(true)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, var(--green) 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add User
              </button>
              {isSuperAdmin && (
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  🔐 Super Admin
                </span>
              )}
            </div>
          )}
        </div>

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
                    <tr
                      key={member.membership_id}
                      onClick={() => handleRowClick(member)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
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

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.813rem',
          color: 'var(--text-tertiary)',
          fontStyle: 'italic'
        }}>
          💡 Click on any row to view details
        </p>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin || false}
        onUpdate={handleModalUpdate}
      />
    </>
  )
}
