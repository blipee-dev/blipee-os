import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getInitiativesSummary, getInitiatives } from '@/app/actions/initiatives'
import { getOrganizationForUser } from '@/lib/data/organizations'
import styles from '../dashboard.module.css'
import { InitiativesSummaryCards } from './InitiativesSummaryCards'
import { InitiativesMainContent } from './InitiativesMainContent'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('initiatives')
  return {
    title: `${t('title')} | Blipee`,
    description: t('subtitle'),
  }
}

export default async function InitiativesPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const t = await getTranslations('initiatives')

  // Fetch data
  const [summaryResult, initiativesResult] = await Promise.all([
    getInitiativesSummary(),
    getInitiatives(),
  ])

  const summary = summaryResult.data || {
    total_initiatives: 0,
    in_progress: 0,
    completed: 0,
    planning: 0,
    on_hold: 0,
    cancelled: 0,
    total_metrics_tracked: 0,
    total_milestones: 0,
    completed_milestones: 0,
  }

  const initiatives = initiativesResult.data || []

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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h1>{t('title')}</h1>
          </div>
          <p className={styles.subtitle}>
            {t('subtitle')} • {org.name}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <Suspense
        fallback={
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>{t('loading')}</div>
          </div>
        }
      >
        <InitiativesSummaryCards summary={summary} />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<div className={styles.chartsLoading}>{t('loading')}</div>}>
        <InitiativesMainContent initiatives={initiatives} organizationId={org.id} />
      </Suspense>
    </>
  )
}
