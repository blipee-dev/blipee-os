import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getGRIDashboardData, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../dashboard.module.css'
import { GRIMetricsCards } from './GRIMetricsCards'
import { GRIStandardsGrid } from './GRIStandardsGrid'
import { GRIFilters } from './GRIFilters'
import { EmissionsIntensityCards } from './emissions/EmissionsIntensityCards'

export const dynamic = 'force-dynamic'

/**
 * GRI Dashboard Page (Server Component)
 *
 * Overview of all 8 GRI Environmental Standards
 * - Compliance tracking
 * - Key metrics visualization
 * - Standards completion status
 */

interface GRIPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function GRIDashboardPage({ searchParams }: GRIPageProps) {
  // Get current user's organization
  const organizationId = await getUserOrganizationId()

  if (!organizationId) {
    notFound()
  }

  // Fetch user sites for the filter
  const userSites = await getUserSites(organizationId)

  // Get available years
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: currentYear - 2021 }, (_, i) => 2022 + i)

  // Get selected year from search params, default to current year
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : currentYear

  // Calculate date range for the selected year
  const startDate = `${selectedYear}-01-01`
  const endDate = `${selectedYear}-12-31`

  // Fetch GRI data
  const griData = await getGRIDashboardData(organizationId, {
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
            <svg
              className={styles.carbonIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h1>GRI Dashboard</h1>
          </div>
          <p className={styles.subtitle}>
            Monitor compliance across all 8 GRI Environmental Standards (301-308)
          </p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} />
      </div>

      {/* Key Metrics Cards - Fast to render */}
      <Suspense
        fallback={
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>Loading metrics...</div>
          </div>
        }
      >
        <GRIMetricsCards data={griData} />
      </Suspense>

      {/* Intensity Metrics - GRI 305-4 */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading intensity metrics...</div></div>}>
        <EmissionsIntensityCards intensity={griData.intensity} />
      </Suspense>

      {/* GRI Standards Grid */}
      <Suspense fallback={<div className={styles.chartsLoading}>Loading standards...</div>}>
        <GRIStandardsGrid data={griData} />
      </Suspense>

      {/* Compliance Status */}
      <Suspense fallback={<div className={styles.tableLoading}>Loading compliance data...</div>}>
        <div className={styles.complianceSection}>
          <h2 className={styles.sectionTitle}>Compliance Overview</h2>
          <div className={styles.complianceGrid}>
            <div className={styles.complianceCard}>
              <h3>Total Incidents</h3>
              <p className={styles.complianceValue}>{griData.compliance_incidents}</p>
              <span className={styles.complianceLabel}>GRI 307</span>
            </div>
            <div className={styles.complianceCard}>
              <h3>High Risk Suppliers</h3>
              <p className={styles.complianceValue}>{griData.high_risk_suppliers}</p>
              <span className={styles.complianceLabel}>GRI 308</span>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  )
}
