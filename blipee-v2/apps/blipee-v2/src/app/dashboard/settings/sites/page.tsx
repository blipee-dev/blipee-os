'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'
import { SiteDetailsModal } from '@/components/sites/SiteDetailsModal'
import styles from '@/styles/settings-layout.module.css'

interface Site {
  id: string
  name: string
  organization_id: string
  type: string | null
  location: string | null
  address: any
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  total_area_sqm: number | null
  total_employees: number | null
  floors: number | null
  floor_details: any
  timezone: string | null
  status: string | null
  devices_count: number | null
  metadata: any
  created_at: string
  updated_at: string
  organizations?: {
    name: string
  }
}

// Fetch sites for a specific organization
async function fetchSites(organizationId: string): Promise<Site[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error) {
    console.error('[Sites] Error loading sites:', error)
    return []
  }

  return data || []
}

// Fetch ALL sites for super admin
async function fetchAllSites(): Promise<Site[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sites')
    .select(`
      *,
      organizations!inner(name)
    `)
    .order('name')

  if (error) {
    console.error('[Sites] Error loading all sites:', error)
    return []
  }

  return data || []
}

export default function SitesPage() {
  const t = useTranslations('settings.settings.sites')
  const { organization, loading: orgLoading } = useUserOrganization()
  const { isSuperAdmin, loading: superAdminLoading } = useIsSuperAdmin()

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'organization' | 'type' | 'location' | 'employees' | 'created'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  // Super admin: fetch all sites. Regular user: fetch sites for selected organization
  const { data: sites = [], isLoading, refetch } = useQuery({
    queryKey: isSuperAdmin ? ['all-sites'] : ['sites', organization?.id],
    queryFn: isSuperAdmin ? fetchAllSites : () => fetchSites(organization!.id),
    enabled: isSuperAdmin || !!organization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get unique types
  const types = useMemo(() => {
    const unique = new Set(
      sites
        .map((site) => site.type)
        .filter((type): type is string => Boolean(type))
    )
    return Array.from(unique).sort()
  }, [sites])

  // Get unique locations (cities)
  const locations = useMemo(() => {
    const unique = new Set(
      sites
        .map((site) => site.city)
        .filter((city): city is string => Boolean(city))
    )
    return Array.from(unique).sort()
  }, [sites])

  // Filter and sort sites
  const filteredSites = useMemo(() => {
    let filtered = sites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.city && site.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (site.country && site.country.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = typeFilter === 'all' || site.type === typeFilter

      const matchesLocation = locationFilter === 'all' || site.city === locationFilter

      const matchesStatus = statusFilter === 'all' || site.status === statusFilter

      return matchesSearch && matchesType && matchesLocation && matchesStatus
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'organization':
          if (isSuperAdmin) {
            const orgA = a.organizations?.name || ''
            const orgB = b.organizations?.name || ''
            comparison = orgA.localeCompare(orgB)
          }
          break
        case 'type':
          const typeA = a.type || ''
          const typeB = b.type || ''
          comparison = typeA.localeCompare(typeB)
          break
        case 'location':
          const locationA = a.city || ''
          const locationB = b.city || ''
          comparison = locationA.localeCompare(locationB)
          break
        case 'employees':
          comparison = (a.total_employees || 0) - (b.total_employees || 0)
          break
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [sites, searchTerm, typeFilter, locationFilter, statusFilter, sortField, sortDirection, isSuperAdmin])

  const handleSort = (field: 'name' | 'organization' | 'type' | 'location' | 'employees' | 'created') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (site: Site) => {
    setSelectedSite(site)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSite(null)
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
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                />
                <circle
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  cx="12"
                  cy="10"
                  r="3"
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

  if (!organization && !isSuperAdmin) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('noOrganization')}</h2>
        <p className={styles.sectionDescription}>
          {t('noOrganizationDescription')}
        </p>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('noSitesTitle')}</h2>
        <p className={styles.sectionDescription}>
          {isSuperAdmin
            ? t('noSitesDescriptionAdmin')
            : t('noSitesDescriptionUser')}
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
    <div>
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
            {isSuperAdmin ? t('titleAll') : t('titleYour')}
          </h2>
          <p className={styles.sectionDescription}>
            {isSuperAdmin
              ? `${t('descriptionAll')} (${filteredSites.length} ${t('of')} ${sites.length})`
              : `${t('descriptionYour')} (${filteredSites.length} ${t('of')} ${sites.length})`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => {
              setSelectedSite(null)
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
            {t('addSiteButton')}
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
              {t('superAdminBadge')}
            </span>
          )}
        </div>
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          <option value="all">{t('allTypes')}</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
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
          <option value="all">{t('allLocations')}</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
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
          <option value="all">{t('allStatuses')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="inactive">{t('statusInactive')}</option>
        </select>

        {(searchTerm || typeFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setTypeFilter('all')
              setLocationFilter('all')
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
        {filteredSites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-tertiary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>{t('noSitesFoundTitle')}</p>
            {(searchTerm || typeFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all') && (
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('noSitesFoundDescription')}</p>
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
                      {t('tableHeaderSiteName')}
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
                  {isSuperAdmin && (
                    <th
                      onClick={() => handleSort('organization')}
                      style={{
                        padding: '1rem 1.5rem',
                        color: sortField === 'organization' ? 'var(--green)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('tableHeaderOrganization')}
                        {sortField === 'organization' && (
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
                  )}
                  <th
                    onClick={() => handleSort('type')}
                    style={{
                      padding: '1rem 1.5rem',
                      color: sortField === 'type' ? 'var(--green)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t('tableHeaderType')}
                      {sortField === 'type' && (
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
                    onClick={() => handleSort('location')}
                    style={{
                      padding: '1rem 1.5rem',
                      color: sortField === 'location' ? 'var(--green)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t('tableHeaderLocation')}
                      {sortField === 'location' && (
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
                    onClick={() => handleSort('employees')}
                    style={{
                      padding: '1rem 1.5rem',
                      color: sortField === 'employees' ? 'var(--green)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t('tableHeaderEmployees')}
                      {sortField === 'employees' && (
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
                    {t('tableHeaderStatus')}
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
                      {t('tableHeaderCreated')}
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
                {filteredSites.map((site) => (
                  <tr
                    key={site.id}
                    onClick={() => handleRowClick(site)}
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
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{site.name}</div>
                      {site.total_area_sqm && (
                        <div style={{ fontSize: '0.813rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                          {site.total_area_sqm.toLocaleString()} m²
                        </div>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                        {site.organizations?.name || '—'}
                      </td>
                    )}
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {site.type || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {site.city && site.country ? (
                        <>
                          <div>{site.city}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                            {site.country}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {site.total_employees?.toLocaleString() || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        padding: '0.375rem 0.875rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.813rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        backgroundColor: site.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: site.status === 'active' ? '#22c55e' : '#ef4444',
                        border: `1px solid ${site.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}>
                        {site.status === 'active' ? t('statusBadgeActive') : t('statusBadgeInactive')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(site.created_at).toLocaleDateString()}
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
          {t('clickRowHint')}
        </p>
      </div>

      {/* Site Details Modal */}
      <SiteDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        site={selectedSite}
        isSuperAdmin={isSuperAdmin}
        onUpdate={handleModalUpdate}
      />
    </div>
  )
}
