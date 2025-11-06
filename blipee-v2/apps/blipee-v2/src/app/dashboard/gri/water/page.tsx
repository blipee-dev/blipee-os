import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getWaterDashboardData, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'
import { WaterMetricsCards } from './WaterMetricsCards'
import { WaterChartsSection } from './WaterChartsSection'
import { WaterSiteTable } from './WaterSiteTable'
import { GRIFilters } from '../GRIFilters'

export const dynamic = 'force-dynamic'

/**
 * GRI 303 Water and Effluents Dashboard Page (Server Component)
 *
 * Modern Next.js 14/15 pattern:
 * - Fetches data directly in Server Component
 * - No API routes needed
 * - Automatic request deduplication
 */

// Types for search params
interface WaterPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function WaterDashboardPage({ searchParams }: WaterPageProps) {
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

  // Fetch water data
  const waterData = await getWaterDashboardData(organizationId, {
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
            <h1>GRI 303 - Water and Effluents</h1>
          </div>
          <p className={styles.subtitle}>Monitor water withdrawal, consumption, and discharge across all facilities</p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} />
      </div>

      {/* KPI Cards - Fast to render */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading metrics...</div></div>}>
        <WaterMetricsCards data={waterData} />
      </Suspense>

      {/* Charts Section - Includes intensity metrics */}
      <Suspense fallback={<div className={styles.chartsLoading}>Loading charts...</div>}>
        <WaterChartsSection data={waterData} />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div className={styles.tableLoading}>Loading table...</div>}>
        <WaterSiteTable data={waterData} />
      </Suspense>
    </>
  )
}
