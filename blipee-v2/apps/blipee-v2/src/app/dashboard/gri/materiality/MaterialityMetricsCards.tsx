'use client'

import styles from './materiality.module.css'

interface MaterialityMetricsCardsProps {
  totalTopics: number
  materialStandards: number
  totalMetrics: number
  materialMetrics: number
  avgPeerAdoption: number
}

export function MaterialityMetricsCards({
  totalTopics,
  materialStandards,
  totalMetrics,
  materialMetrics,
  avgPeerAdoption,
}: MaterialityMetricsCardsProps) {
  const coveragePercent = totalMetrics > 0 ? ((materialMetrics / totalMetrics) * 100).toFixed(0) : 0

  return (
    <div className={styles.kpiGrid}>
      {/* Total Topics */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Topics</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{totalTopics}</div>
        <div className={styles.kpiSubtext}>GRI standards assessed</div>
      </div>

      {/* Material Standards */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Material</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{materialStandards}</div>
        <div className={styles.kpiSubtext}>
          of {totalTopics} standards
        </div>
      </div>

      {/* Coverage */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Coverage</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{coveragePercent}%</div>
        <div className={styles.kpiSubtext}>
          {materialMetrics}/{totalMetrics} metrics
        </div>
      </div>

      {/* Peer Alignment */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Peer Alignment</span>
          <svg className={styles.kpiIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{avgPeerAdoption.toFixed(0)}%</div>
        <div className={styles.kpiSubtext}>industry average</div>
      </div>
    </div>
  )
}
