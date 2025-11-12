import type { InitiativesSummary } from '@/lib/types/initiatives'
import styles from '../dashboard.module.css'

interface InitiativesSummaryCardsProps {
  summary: InitiativesSummary
}

export function InitiativesSummaryCards({ summary }: InitiativesSummaryCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      {/* Total Initiatives */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Initiatives</span>
          <span className={styles.kpiStandard}>Active</span>
        </div>
        <div className={styles.kpiValue}>
          {summary.total_initiatives}
        </div>
        <div className={styles.kpiUnit}>initiatives</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>🎯</span>
          <span>{summary.in_progress_count} in progress • {summary.completed_count} completed</span>
        </div>
      </div>

      {/* Average Progress */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Average Progress</span>
          <span className={styles.kpiStandard}>Overall</span>
        </div>
        <div className={styles.kpiValue}>
          {Math.round(summary.avg_progress || 0)}
        </div>
        <div className={styles.kpiUnit}>%</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>📊</span>
          <span>Across all active initiatives</span>
        </div>
      </div>

      {/* Total Budget */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Budget</span>
          <span className={styles.kpiStandard}>Allocated</span>
        </div>
        <div className={styles.kpiValue}>
          {summary.total_budget ? `€${(summary.total_budget / 1000).toFixed(0)}k` : '€0'}
        </div>
        <div className={styles.kpiUnit}>EUR</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>💰</span>
          <span>
            {summary.total_budget_spent
              ? `€${(summary.total_budget_spent / 1000).toFixed(0)}k spent`
              : 'No expenses yet'}
          </span>
        </div>
      </div>

      {/* Completion Rate */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Completion Rate</span>
          <span className={styles.kpiStandard}>Success</span>
        </div>
        <div className={styles.kpiValue}>
          {summary.total_initiatives > 0
            ? Math.round((summary.completed_count / summary.total_initiatives) * 100)
            : 0}
        </div>
        <div className={styles.kpiUnit}>%</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>✅</span>
          <span>{summary.completed_count} of {summary.total_initiatives} completed</span>
        </div>
      </div>
    </div>
  )
}
