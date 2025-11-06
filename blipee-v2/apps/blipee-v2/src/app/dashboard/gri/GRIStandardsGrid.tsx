import { GRIDashboardData } from '@/lib/data/gri'
import styles from './gri.module.css'
import Link from 'next/link'

interface GRIStandardsGridProps {
  data: GRIDashboardData
}

const standardIcons: Record<string, string> = {
  '301': '📦', // Materials
  '302': '⚡', // Energy
  '303': '💧', // Water
  '304': '🌳', // Biodiversity
  '305': '🏭', // Emissions
  '306': '♻️', // Waste
  '307': '⚖️', // Compliance
  '308': '🏢', // Suppliers
}

const automationLevels: Record<string, string> = {
  '301': '10%',
  '302': '80%',
  '303': '30-50%',
  '304': '10%',
  '305': '90%',
  '306': '50%',
  '307': '0%',
  '308': '20%',
}

export function GRIStandardsGrid({ data }: GRIStandardsGridProps) {
  return (
    <div className={styles.standardsSection}>
      <h2 className={styles.sectionTitle}>GRI Environmental Standards (301-308)</h2>

      <div className={styles.standardsGrid}>
        {data.standards.map((standard) => {
          const completionClass =
            standard.completion_percentage >= 75
              ? styles.statusHigh
              : standard.completion_percentage >= 25
              ? styles.statusMedium
              : styles.statusLow

          return (
            <Link
              href={`/dashboard/gri/${standard.standard_code}`}
              key={standard.standard_code}
              className={styles.standardCard}
            >
              <div className={styles.standardHeader}>
                <span className={styles.standardIcon}>
                  {standardIcons[standard.standard_code]}
                </span>
                <span className={styles.standardCode}>GRI {standard.standard_code}</span>
              </div>

              <h3 className={styles.standardName}>{standard.standard_name}</h3>

              <div className={styles.standardMetrics}>
                <div className={styles.metricRow}>
                  <span>Metrics Recorded</span>
                  <span className={styles.metricValue}>
                    {standard.metrics_recorded}/{standard.total_metrics}
                  </span>
                </div>
                <div className={styles.metricRow}>
                  <span>Automation</span>
                  <span className={styles.metricValue}>
                    {automationLevels[standard.standard_code]}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${completionClass}`}
                    style={{ width: `${standard.completion_percentage}%` }}
                  />
                </div>
                <span className={styles.progressLabel}>{standard.completion_percentage}% complete</span>
              </div>

              {/* Key Metric */}
              {standard.key_metric_value !== undefined && (
                <div className={styles.keyMetric}>
                  <span className={styles.keyMetricLabel}>Key Metric:</span>
                  <span className={styles.keyMetricValue}>
                    {standard.key_metric_value.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    {standard.key_metric_unit}
                  </span>
                </div>
              )}

              {/* Last Updated */}
              {standard.last_updated && (
                <div className={styles.lastUpdated}>
                  Last updated:{' '}
                  {new Date(standard.last_updated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
