'use client'

import styles from '../dashboard.module.css'

interface SBTISummaryCardsProps {
  summary: {
    total_targets: number
    validated_targets: number
    draft_targets: number
    near_term_targets: number
    long_term_targets: number
    total_base_emissions: number | null
    total_target_emissions: number | null
    average_reduction_pct: number | null
    on_track_count: number
    at_risk_count: number
  }
}

export function SBTISummaryCards({ summary }: SBTISummaryCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <div className={styles.kpiLabel}>Total de Objetivos</div>
          <svg className={`${styles.kpiIcon} ${styles.iconGreen}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18M3 12h18" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{summary.total_targets}</div>
        <div className={styles.kpiTrend}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {summary.near_term_targets} curto prazo, {summary.long_term_targets} longo prazo
          </span>
        </div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <div className={styles.kpiLabel}>Objetivos Validados</div>
          <svg className={`${styles.kpiIcon} ${styles.iconBlue}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{summary.validated_targets}</div>
        <div className={styles.kpiTrend}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {summary.draft_targets} rascunhos
          </span>
        </div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <div className={styles.kpiLabel}>Redução Média</div>
          <svg className={`${styles.kpiIcon} ${styles.iconPurple}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className={styles.kpiValue}>
          {summary.average_reduction_pct ? `${summary.average_reduction_pct.toFixed(1)}%` : 'N/A'}
        </div>
        <div className={styles.kpiTrend}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Dos objetivos definidos
          </span>
        </div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <div className={styles.kpiLabel}>Progresso</div>
          <svg className={`${styles.kpiIcon} ${styles.iconAmber}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{summary.on_track_count}</div>
        <div className={styles.kpiTrend}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {summary.at_risk_count} em risco
          </span>
        </div>
      </div>
    </div>
  )
}
