'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'

interface Site {
  id: string
  name: string
  type: string | null
  city: string | null
  country: string | null
  total_area_sqm: number | null
  total_employees: number | null
  status: string | null
}

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

export default function SitesPage() {
  const { organization, loading: orgLoading } = useUserOrganization()

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites', organization?.id],
    queryFn: () => fetchSites(organization!.id),
    enabled: !!organization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (orgLoading || isLoading) {
    return (
      <div className={styles.section}>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading sites...
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
        <h2 className={styles.sectionTitle}>Sites / Facilities</h2>
        <p className={styles.sectionDescription}>
          Manage your organization's sites ({sites.length} site{sites.length !== 1 ? 's' : ''})
        </p>

        {sites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>No sites registered</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Location</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Area (m²)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Employees</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{site.name}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{site.type || '-'}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {site.city && site.country ? `${site.city}, ${site.country}` : '-'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {site.total_area_sqm ? site.total_area_sqm.toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {site.total_employees || '-'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: site.status === 'active' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: site.status === 'active' ? 'var(--success-text)' : 'var(--warning-text)',
                      }}>
                        {site.status || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
