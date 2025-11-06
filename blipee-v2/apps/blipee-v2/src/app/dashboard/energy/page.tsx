import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getEnergyDashboardData, getUserOrganizationId, getUserSites } from '@/lib/data/energy'
import styles from '../dashboard.module.css'
import { EnergyMetricsCards } from './EnergyMetricsCards'
import { EnergyChartsSection } from './EnergyChartsSection'
import { EnergySiteTable } from './EnergySiteTable'
import { EnergyFilters } from './EnergyFilters'

export const dynamic = 'force-dynamic'

/**
 * Energy Dashboard Page (Server Component)
 *
 * Modern Next.js 14/15 pattern:
 * - Fetches data directly in Server Component
 * - No API routes needed
 * - Automatic request deduplication
 */

// Types for search params
interface EnergyPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function EnergyDashboardPage({ searchParams }: EnergyPageProps) {
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

  // Fetch energy data
  const energyData = await getEnergyDashboardData(organizationId, {
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
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <h1>Energy Dashboard</h1>
          </div>
          <p className={styles.subtitle}>Monitor and analyze energy consumption across your organization</p>
        </div>

        <EnergyFilters sites={userSites} availableYears={availableYears} />
      </div>

      {/* KPI Cards - Fast to render */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading metrics...</div></div>}>
        <EnergyMetricsCards data={energyData} />
      </Suspense>

      {/* Charts Section - Can be suspended */}
      <Suspense fallback={<div className={styles.chartsLoading}>Loading charts...</div>}>
        <EnergyChartsSection data={energyData} />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div className={styles.tableLoading}>Loading table...</div>}>
        <EnergySiteTable data={energyData} />
      </Suspense>
    </>
  )
}
