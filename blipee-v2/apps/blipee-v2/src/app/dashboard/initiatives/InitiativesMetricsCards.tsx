'use client'

import styles from '../dashboard.module.css'

interface InitiativesMetricsCardsProps {
  stats: {
    total_dismissed: number
    can_reactivate: number
    permanently_dismissed: number
    affects_materiality: number
  }
}

export function InitiativesMetricsCards({ stats }: InitiativesMetricsCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      {/* Total Dismissed */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Dismissed</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{stats.total_dismissed}</div>
        <div className={styles.kpiSubtext}>metrics reviewed</div>
      </div>

      {/* Can Reactivate */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Can Reactivate</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{stats.can_reactivate}</div>
        <div className={styles.kpiSubtext}>
          <span className={styles.trendPositive}>
            {stats.total_dismissed > 0 ? ((stats.can_reactivate / stats.total_dismissed) * 100).toFixed(0) : 0}%
          </span>
          {' '}of total
        </div>
      </div>

      {/* Not Material */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Not Material</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{stats.permanently_dismissed}</div>
        <div className={styles.kpiSubtext}>permanent exclusions</div>
      </div>

      {/* Affects Materiality */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Affects Materiality</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{stats.affects_materiality}</div>
        <div className={styles.kpiSubtext}>
          impact on GRI assessment
        </div>
      </div>
    </div>
  )
}
