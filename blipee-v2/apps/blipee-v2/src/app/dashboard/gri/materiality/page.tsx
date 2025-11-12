import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getGRIGapAnalysis, getUserOrganizationId, getUserSites } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'
import { GapAnalysisSummaryCards } from './GapAnalysisSummaryCards'
import { GapAnalysisContent } from './GapAnalysisContent'
import { GRIFilters } from '../GRIFilters'
import { getMetricTrackingStatuses } from '@/app/actions/gri/metricTracking'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('gri.gapAnalysis')
  return {
    title: `${t('title')} | Blipee`,
    description: t('subtitle'),
  }
}

interface GapAnalysisPageProps {
  searchParams: {
    site?: string
    year?: string
  }
}

export default async function GRIGapAnalysisPage({ searchParams }: GapAnalysisPageProps) {
  const organizationId = await getUserOrganizationId()

  if (!organizationId) {
    notFound()
  }

  const t = await getTranslations('gri.gapAnalysis')
  const tCommon = await getTranslations('gri.common')

  // Fetch user sites for the filter
  const userSites = await getUserSites(organizationId)

  // Get available years (from 2022-current)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: currentYear - 2021 }, (_, i) => 2022 + i)

  const gapAnalysisData = await getGRIGapAnalysis(organizationId, {
    siteId: searchParams.site,
  })

  // Load metric tracking statuses
  const statusesResult = await getMetricTrackingStatuses()
  const metricStatuses = statusesResult instanceof Map ? statusesResult : new Map()

  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <h1>{t('title')}</h1>
          </div>
          <p className={styles.subtitle}>
            {t('subtitle')} • {gapAnalysisData.organization_name}
          </p>
        </div>

        <GRIFilters sites={userSites} availableYears={availableYears} hideYearFilter />
      </div>

      {/* Summary KPI Cards */}
      <Suspense fallback={<div className={styles.kpiGrid}><div className={styles.kpiCard}>{tCommon('loadingMetrics')}</div></div>}>
        <GapAnalysisSummaryCards data={gapAnalysisData} />
      </Suspense>

      {/* Main Gap Analysis Content */}
      <Suspense fallback={<div className={styles.chartsLoading}>{tCommon('loading')}</div>}>
        <GapAnalysisContent data={gapAnalysisData} initialStatuses={metricStatuses} />
      </Suspense>
    </>
  )
}
