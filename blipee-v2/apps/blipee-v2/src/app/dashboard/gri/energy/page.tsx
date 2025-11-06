import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getEnergyDashboardDataGRI, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'
import { EnergyMetricsCards } from './EnergyMetricsCards'
import { EnergyChartsSection } from './EnergyChartsSection'
import { EnergySiteTable } from './EnergySiteTable'
import { GRIFilters } from '../GRIFilters'

export const dynamic = 'force-dynamic'

/**
 * GRI 302 Energy Dashboard Page (Server Component)
 */

interface EnergyPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function EnergyDashboardPage({ searchParams }: EnergyPageProps) {
  const organizationId = await getUserOrganizationId()

  if (!organizationId) {
    notFound()
  }

  const userSites = await getUserSites(organizationId)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: currentYear - 2021 }, (_, i) => 2022 + i)
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : currentYear

  const startDate = `${selectedYear}-01-01`
  const endDate = `${selectedYear}-12-31`

  const energyData = await getEnergyDashboardDataGRI(organizationId, {
    startDate,
    endDate,
    siteId: searchParams.site,
  })

  return (
    <>
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <h1>GRI 302 - Energy</h1>
          </div>
          <p className={styles.subtitle}>Track energy consumption and renewable energy usage</p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} />
      </div>

      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading metrics...</div></div>}>
        <EnergyMetricsCards data={energyData} />
      </Suspense>

      <Suspense fallback={<div className={styles.chartsLoading}>Loading charts...</div>}>
        <EnergyChartsSection data={energyData} />
      </Suspense>

      <Suspense fallback={<div className={styles.tableLoading}>Loading table...</div>}>
        <EnergySiteTable data={energyData} />
      </Suspense>
    </>
  )
}
