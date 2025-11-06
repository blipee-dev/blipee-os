import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDismissedMetrics, getInitiativesStats, getDismissedBreakdown } from '@/lib/data/initiatives'
import { getOrganizationForUser } from '@/lib/data/organizations'
import styles from '../dashboard.module.css'
import { InitiativesMetricsCards } from './InitiativesMetricsCards'
import { InitiativesContent } from './InitiativesContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Initiatives & Dismissed Metrics | Blipee',
  description: 'Track dismissed metrics and review your sustainability initiatives',
}

export default async function InitiativesPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const [dismissedMetrics, stats, breakdown] = await Promise.all([
    getDismissedMetrics(org.id),
    getInitiativesStats(org.id),
    getDismissedBreakdown(org.id),
  ])

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h1>Initiatives & Dismissed Metrics</h1>
          </div>
          <p className={styles.subtitle}>
            Track dismissed metrics and review recategorization opportunities
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading metrics...</div></div>}>
        <InitiativesMetricsCards stats={stats} />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<div className={styles.chartsLoading}>Loading content...</div>}>
        <InitiativesContent
          dismissedMetrics={dismissedMetrics}
          breakdown={breakdown}
          organizationId={org.id}
        />
      </Suspense>
    </>
  )
}
