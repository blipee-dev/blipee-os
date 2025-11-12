import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getWasteDashboardData, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'
import { WasteMetricsCards } from './WasteMetricsCards'
import { WasteChartsSection } from './WasteChartsSection'
import { WasteSiteTable } from './WasteSiteTable'
import { GRIFilters } from '../GRIFilters'

export const dynamic = 'force-dynamic'

/**
 * GRI 306 Waste Dashboard Page (Server Component) - i18n enabled
 *
 * Modern Next.js 14/15 pattern:
 * - Fetches data directly in Server Component
 * - No API routes needed
 * - Automatic request deduplication
 * - Multi-language support (en-US, es-ES, pt-PT)
 */

// Types for search params
interface WastePageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function WasteDashboardPage({ searchParams }: WastePageProps) {
  const t = await getTranslations('gri.waste')
  const tCommon = await getTranslations('gri.common')

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

  // Fetch waste data
  const wasteData = await getWasteDashboardData(organizationId, {
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
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
            <h1>{t('title')}</h1>
          </div>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} />
      </div>

      {/* KPI Cards - Fast to render */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>{tCommon('loadingMetrics')}</div></div>}>
        <WasteMetricsCards data={wasteData} />
      </Suspense>

      {/* Charts Section - Includes intensity metrics */}
      <Suspense fallback={<div className={styles.chartsLoading}>{tCommon('loadingCharts')}</div>}>
        <WasteChartsSection data={wasteData} />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div className={styles.tableLoading}>{tCommon('loadingTable')}</div>}>
        <WasteSiteTable data={wasteData} />
      </Suspense>
    </>
  )
}
