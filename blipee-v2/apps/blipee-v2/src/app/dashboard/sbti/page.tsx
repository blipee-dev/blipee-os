import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { getSBTITargets, getSBTISummary } from '@/app/actions/sbti'
import { SBTISummaryCards } from './SBTISummaryCards'
import { SBTIMainContent } from './SBTIMainContent'
import styles from '../dashboard.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Objetivos SBTi | Blipee',
  description: 'Definir, acompanhar e atingir metas climáticas baseadas em ciência',
}

export default async function SBTIPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const [targetsResult, summaryResult] = await Promise.all([
    getSBTITargets(),
    getSBTISummary(),
  ])

  if (targetsResult.error || summaryResult.error) {
    return (
      <>
        <div className={styles.dashboardHeader}>
          <div>
            <div className={styles.dashboardTitle}>
              <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M3 12h18M19.07 4.93l-14.14 14.14M4.93 4.93l14.14 14.14" />
              </svg>
              <h1>Objetivos SBTi</h1>
            </div>
            <p className={styles.subtitle}>
              Metas climáticas baseadas em ciência • {org.name}
            </p>
          </div>
        </div>

        <div style={{
          padding: '2rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          color: 'var(--error-color)'
        }}>
          Erro ao carregar objetivos SBTi: {targetsResult.error || summaryResult.error}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18" />
              <path d="M19.07 4.93l-14.14 14.14M4.93 4.93l14.14 14.14" />
            </svg>
            <h1>Objetivos SBTi</h1>
          </div>
          <p className={styles.subtitle}>
            Metas climáticas baseadas em ciência • {org.name}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <Suspense
        fallback={
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>A carregar resumo...</div>
          </div>
        }
      >
        <SBTISummaryCards summary={summaryResult.data!} />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<div className={styles.chartsLoading}>A carregar objetivos...</div>}>
        <SBTIMainContent
          targets={targetsResult.data || []}
          organizationId={org.id}
        />
      </Suspense>
    </>
  )
}
