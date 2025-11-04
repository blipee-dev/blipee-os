'use client'

import { useState, useMemo } from 'react'
import { useUserOrganizations, Organization } from '@/hooks/useUserOrganizations'
import { OrganizationDetailsModal } from '@/components/organizations/OrganizationDetailsModal'
import styles from '@/styles/settings-layout.module.css'

export default function OrganizationsPage() {
  const { organizations, loading, isSuperAdmin, refetch } = useUserOrganizations()

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'industry' | 'size' | 'status' | 'created'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Modal state
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get unique industries
  const industries = useMemo(() => {
    const unique = new Set(
      organizations
        .map((org) => org.industry)
        .filter((industry): industry is string => Boolean(industry))
    )
    return Array.from(unique).sort()
  }, [organizations])

  // Filter and sort organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesIndustry =
        industryFilter === 'all' || org.industry === industryFilter

      const matchesSize = sizeFilter === 'all' || org.company_size === sizeFilter

      const matchesStatus = statusFilter === 'all' || org.status === statusFilter

      return matchesSearch && matchesIndustry && matchesSize && matchesStatus
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'industry':
          const industryA = a.industry_primary || a.industry || ''
          const industryB = b.industry_primary || b.industry || ''
          comparison = industryA.localeCompare(industryB)
          break
        case 'size':
          const sizeOrder = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
          const sizeA = sizeOrder.indexOf(a.company_size || '')
          const sizeB = sizeOrder.indexOf(b.company_size || '')
          comparison = sizeA - sizeB
          break
        case 'status':
          const statusOrder = ['inactive', 'setup', 'active']
          const statusA = statusOrder.indexOf(a.status || '')
          const statusB = statusOrder.indexOf(b.status || '')
          comparison = statusA - statusB
          break
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [organizations, searchTerm, industryFilter, sizeFilter, statusFilter, sortField, sortDirection])

  const handleSort = (field: 'name' | 'industry' | 'size' | 'status' | 'created') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (org: Organization) => {
    setSelectedOrg(org)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedOrg(null)
  }

  if (loading) {
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
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                />
                <polyline
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  points="9 22 9 12 15 12 15 22"
                />
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <p className="text-slate-300 font-semibold">Loading Organizations</p>
            <p className="text-slate-500 text-sm mt-1">Fetching your organization data...</p>
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

  if (organizations.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>No Organizations</h2>
        <p className={styles.sectionDescription}>
          You are not associated with any organization.
        </p>
        {isSuperAdmin && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              💡 As a super admin, you should see all organizations. If this list is empty,
              no organizations have been created in the system yet.
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
              {isSuperAdmin ? 'All Organizations' : 'Your Organizations'}
            </h2>
            <p className={styles.sectionDescription}>
              {isSuperAdmin
                ? `Manage all organizations in the system (${filteredOrganizations.length} of ${organizations.length})`
                : `Organizations you are a member of (${filteredOrganizations.length} of ${organizations.length})`}
            </p>
          </div>
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

        {/* Filters - Simple inline */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Search by name..."
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
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
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
            <option value="all">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
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
            <option value="all">All Sizes</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="501-1000">501-1000</option>
            <option value="1001-5000">1001-5000</option>
            <option value="5000+">5000+</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="setup">Setup Required</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchTerm || industryFilter !== 'all' || sizeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setIndustryFilter('all')
                setSizeFilter('all')
                setStatusFilter('all')
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
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {filteredOrganizations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-tertiary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <p>No organizations found</p>
              {(searchTerm || industryFilter !== 'all' || sizeFilter !== 'all') && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Try adjusting your filters</p>
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
                        Organization
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
                      onClick={() => handleSort('industry')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'industry' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Primary Industry
                        {sortField === 'industry' && (
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
                      onClick={() => handleSort('size')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'size' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Size
                        {sortField === 'size' && (
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
                      onClick={() => handleSort('status')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'status' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Status
                        {sortField === 'status' && (
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      {isSuperAdmin ? 'Access Level' : 'Your Role'}
                    </th>
                    <th
                      onClick={() => handleSort('created')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'created' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Created
                        {sortField === 'created' && (
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
                  {filteredOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => handleRowClick(org)}
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
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{org.name}</div>
                        <div style={{ fontSize: '0.813rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                          {org.slug}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {org.industry_primary || org.industry || '—'}
                        {org.industry_secondary && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                            + {org.industry_secondary}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {org.company_size || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.813rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                          backgroundColor: org.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : org.status === 'setup' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: org.status === 'active' ? '#22c55e' : org.status === 'setup' ? '#fb923c' : '#ef4444',
                          border: `1px solid ${org.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : org.status === 'setup' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                          {org.status === 'active' ? '● Active' : org.status === 'setup' ? '⚙ Setup' : '✖ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          backgroundColor: (isSuperAdmin || org.role === 'platform_admin') ? '#8b5cf6' : (org.is_owner ? 'var(--primary-bg)' : 'var(--info-bg)'),
                          color: (isSuperAdmin || org.role === 'platform_admin') ? 'white' : (org.is_owner ? 'var(--primary-text)' : 'var(--info-text)'),
                        }}>
                          {(isSuperAdmin || org.role === 'platform_admin') ? 'Super Admin' : `${org.role}${org.is_owner ? ' ⭐' : ''}`}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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
          💡 Click on any row to view details and manage the organization
        </p>
      </div>

      {/* Details Modal */}
      <OrganizationDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        organization={selectedOrg}
        isSuperAdmin={isSuperAdmin}
        onUpdate={() => {
          refetch()
          handleModalClose()
        }}
      />
    </>
  )
}
