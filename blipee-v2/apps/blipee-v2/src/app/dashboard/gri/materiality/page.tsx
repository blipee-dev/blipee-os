import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getGRIMateriality } from '@/lib/data/initiatives'
import { getOrganizationForUser } from '@/lib/data/organizations'
import styles from '../../dashboard.module.css'
import { MaterialityMetricsCards } from './MaterialityMetricsCards'
import { MaterialityContent } from './MaterialityContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'GRI Materiality Assessment | Blipee',
  description: 'Auto-generated GRI materiality assessment based on your metric tracking decisions',
}

export default async function GRIMaterialityPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const materialityData = await getGRIMateriality(org.id)

  // Calculate stats
  const totalMetrics = materialityData.reduce((sum, std) => sum + std.total_metrics, 0)
  const materialMetrics = materialityData.reduce((sum, std) => sum + std.material_metrics, 0)
  const materialStandards = materialityData.filter((std) => std.is_material).length
  const avgPeerAdoption = materialityData.length > 0
    ? materialityData.reduce((sum, std) => sum + (std.peer_adoption_avg || 0), 0) / materialityData.length
    : 0

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6" />
              <path d="M18.36 5.64l-4.24 4.24m-4.24 4.24L5.64 18.36" />
              <path d="M23 12h-6m-6 0H1" />
              <path d="M18.36 18.36l-4.24-4.24m-4.24-4.24L5.64 5.64" />
            </svg>
            <h1>GRI Materiality Assessment</h1>
          </div>
          <p className={styles.subtitle}>
            Auto-generated from your metric tracking decisions • {org.name}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>Loading metrics...</div></div>}>
        <MaterialityMetricsCards
          totalTopics={materialityData.length}
          materialStandards={materialStandards}
          totalMetrics={totalMetrics}
          materialMetrics={materialMetrics}
          avgPeerAdoption={avgPeerAdoption}
        />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<div className={styles.chartsLoading}>Loading content...</div>}>
        <MaterialityContent
          materialityData={materialityData}
          organizationName={org.name}
          industry={org.industry_sector || 'Professional Services'}
          totalMetrics={totalMetrics}
          materialMetrics={materialMetrics}
        />
      </Suspense>
    </>
  )
}
