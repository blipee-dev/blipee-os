import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getEmissionsDashboardData, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'
import { EmissionsMetricsCards } from './EmissionsMetricsCards'
import { EmissionsChartsSection } from './EmissionsChartsSection'
import { EmissionsSiteTable } from './EmissionsSiteTable'
import { GRIFilters } from '../GRIFilters'

export const dynamic = 'force-dynamic'

/**
 * GRI 305 Emissions Dashboard Page (Server Component)
 *
 * Modern Next.js 14/15 pattern:
 * - Fetches data directly in Server Component
 * - No API routes needed
 * - Automatic request deduplication
 */

// Types for search params
interface EmissionsPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function EmissionsDashboardPage({ searchParams }: EmissionsPageProps) {
  const t = await getTranslations('gri')

  // Get current user's organization
  const organizationId = await getUserOrganizationId()

  if (!organizationId) {
    notFound()
  }

  // Fetch user sites for the filter
  const userSites = await getUserSites(organizationId)

  // Get available years (from database we know data exists from 2022-2025)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: currentYear - 2021 }, (_, i) => 2022 + i)

  // Get selected year from search params, default to current year
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : currentYear

  // Calculate date range for the selected year
  const startDate = `${selectedYear}-01-01`
  const endDate = `${selectedYear}-12-31`

  // Fetch emissions data
  const emissionsData = await getEmissionsDashboardData(organizationId, {
    startDate,
    endDate,
    siteId: searchParams.site,
  })

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <h1>{t('emissions.title')}</h1>
          </div>
          <p className={styles.subtitle}>{t('emissions.subtitle')}</p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} />
      </div>

      {/* KPI Cards - Fast to render */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>{t('common.loadingMetrics')}</div></div>}>
        <EmissionsMetricsCards data={emissionsData} />
      </Suspense>

      {/* Charts Section - Includes intensity metrics */}
      <Suspense fallback={<div className={styles.chartsLoading}>{t('common.loadingCharts')}</div>}>
        <EmissionsChartsSection data={emissionsData} />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div className={styles.tableLoading}>{t('common.loadingTable')}</div>}>
        <EmissionsSiteTable data={emissionsData} />
      </Suspense>
    </>
  )
}
