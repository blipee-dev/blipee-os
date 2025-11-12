'use client'

import { useTranslations } from 'next-intl'
import type { GapAnalysisDashboard } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface GapAnalysisSummaryCardsProps {
  data: GapAnalysisDashboard
}

export function GapAnalysisSummaryCards({ data }: GapAnalysisSummaryCardsProps) {
  const t = useTranslations('gri.gapAnalysis.summaryCards')
  const tMetrics = useTranslations('gri.gapAnalysis.metrics')

  const coveragePercentage = data.total_available_metrics > 0
    ? Math.round((data.total_tracking_metrics / data.total_available_metrics) * 100)
    : 0

  return (
    <div className={styles.kpiGrid}>
      {/* Total Coverage */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('coverage')}</span>
          <span className={styles.kpiStandard}>{t('overall')}</span>
        </div>
        <div className={styles.kpiValue}>
          {coveragePercentage}
        </div>
        <div className={styles.kpiUnit}>{t('coverageUnit')}</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>📊</span>
          <span>{data.total_tracking_metrics} {tMetrics('of')} {data.total_available_metrics} {t('coverageDescription')}</span>
        </div>
      </div>

      {/* Opportunities */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('opportunities')}</span>
          <span className={styles.kpiStandard}>{t('opportunitiesDescription')}</span>
        </div>
        <div className={styles.kpiValue}>
          {data.total_opportunities}
        </div>
        <div className={styles.kpiUnit}>{t('opportunitiesUnit')}</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>💡</span>
          <span>{t('opportunitiesDescription')}</span>
        </div>
      </div>

      {/* Quick Wins */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('quickWins')}</span>
          <span className={styles.kpiStandard}>{t('quickWinsDescription')}</span>
        </div>
        <div className={styles.kpiValue}>
          {data.total_quick_wins}
        </div>
        <div className={styles.kpiUnit}>{t('quickWinsUnit')}</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>🚀</span>
          <span>{t('quickWinsDescription')}</span>
        </div>
      </div>

      {/* GRI Standards */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('standards')}</span>
          <span className={styles.kpiStandard}>{t('standardsRange')}</span>
        </div>
        <div className={styles.kpiValue}>
          {data.standards.length}
        </div>
        <div className={styles.kpiUnit}>{t('standardsUnit')}</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>📋</span>
          <span>{t('standardsDescription')}</span>
        </div>
      </div>
    </div>
  )
}
