'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'
import { UserDetailsModal } from '@/components/users/UserDetailsModal'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('settings.settings.users')

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'department' | 'joined'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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

  // Get unique roles
  const roles = useMemo(() => {
    const unique = new Set(
      members
        .map((member) => member.role)
        .filter((role): role is string => Boolean(role))
    )
    return Array.from(unique).sort()
  }, [members])

  // Get unique departments
  const departments = useMemo(() => {
    const unique = new Set(
      members
        .map((member) => member.department)
        .filter((dept): dept is string => Boolean(dept))
    )
    return Array.from(unique).sort()
  }, [members])

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.job_title && member.job_title.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesRole = roleFilter === 'all' || member.role === roleFilter

      const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter

      return matchesSearch && matchesRole && matchesDepartment
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name)
          break
        case 'email':
          comparison = a.email.localeCompare(b.email)
          break
        case 'role':
          // Owners first, then admins, then members
          const roleOrder = ['owner', 'admin', 'member']
          const roleA = a.is_owner ? 'owner' : a.role
          const roleB = b.is_owner ? 'owner' : b.role
          comparison = roleOrder.indexOf(roleA) - roleOrder.indexOf(roleB)
          break
        case 'department':
          const deptA = a.department || ''
          const deptB = b.department || ''
          comparison = deptA.localeCompare(deptB)
          break
        case 'joined':
          comparison = new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [members, searchTerm, roleFilter, departmentFilter, sortField, sortDirection])

  const handleSort = (field: 'name' | 'email' | 'role' | 'department' | 'joined') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getRoleBadgeColor(role: string, isOwner: boolean) {
    if (isOwner) return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a855f7' }
    if (role === 'admin') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' }
    return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          {/* Animated icon */}
          <div className="relative w-20 h-20">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>

            {/* Rotating gradient ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-blue-500 animate-spin"></div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-500 to-blue-500 opacity-20 animate-pulse"></div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                />
                <circle
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  cx="9"
                  cy="7"
                  r="4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                />
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <p className="text-slate-300 font-semibold">{t('loadingTitle')}</p>
            <p className="text-slate-500 text-sm mt-1">{t('loadingDescription')}</p>
          </div>

          {/* Animated dots */}
          <div className="flex gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('noOrganizationTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('noOrganizationDescription')}
        </p>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('noUsersTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('noUsersDescription')}
        </p>
        {isSuperAdmin && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {t('superAdminNote')}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '2rem',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 className={styles.sectionTitle}>
              {t('titleOrganizationUsers')}
            </h2>
            <p className={styles.sectionDescription}>
              {`${t('descriptionMembers')} ${organization.name} (${filteredMembers.length} ${t('of')} ${members.length})`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {(isSuperAdmin || isAdmin) && (
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
                {t('addUserButton')}
              </button>
            )}
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
                {t('superAdminBadge')}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('allRoles')}</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('allDepartments')}</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {(searchTerm || roleFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setDepartmentFilter('all')
              }}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: '0.813rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-tertiary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>{t('noUsersFoundTitle')}</p>
              {(searchTerm || roleFilter !== 'all' || departmentFilter !== 'all') && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('noUsersFoundDescription')}</p>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '2px solid var(--glass-border)',
                }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th
                      onClick={() => handleSort('name')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'name' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderName')}
                        {sortField === 'name' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortDirection === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('email')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'email' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderEmail')}
                        {sortField === 'email' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortDirection === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('department')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'department' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderDepartment')}
                        {sortField === 'department' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortDirection === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('role')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'role' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderRole')}
                        {sortField === 'role' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortDirection === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('joined')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'joined' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderJoined')}
                        {sortField === 'joined' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortDirection === 'asc' ? (
                              <polyline points="18 15 12 9 6 15" />
                            ) : (
                              <polyline points="6 9 12 15 18 9" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
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
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: badgeColor.bg,
                                color: badgeColor.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {member.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {member.full_name}
                                {member.is_owner && (
                                  <span style={{ fontSize: '0.875rem' }}>
                                    👑
                                  </span>
                                )}
                              </div>
                              {member.job_title && (
                                <div style={{ fontSize: '0.813rem', color: 'var(--text-tertiary)' }}>
                                  {member.job_title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {member.email}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                          {member.department || '-'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <span style={{
                            padding: '0.375rem 0.875rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.813rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            backgroundColor: badgeColor.bg,
                            color: badgeColor.text,
                            border: `1px solid ${
                              member.is_owner
                                ? 'rgba(139, 92, 246, 0.3)'
                                : member.role === 'admin'
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : 'rgba(59, 130, 246, 0.3)'
                            }`,
                          }}>
                            {member.is_owner ? t('roleBadgeOwner') : member.role === 'admin' ? t('roleBadgeAdmin') : t('roleBadgeMember')}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                          {formatDate(member.joined_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.813rem',
          color: 'var(--text-tertiary)',
          fontStyle: 'italic'
        }}>
          {t('clickRowHint')}
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
