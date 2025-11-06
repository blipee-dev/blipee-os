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
  // Helper to get status badge details
  const getStatusBadge = (status: 'full' | 'partial' | 'none') => {
    switch (status) {
      case 'full':
        return { emoji: '🟢', label: 'Well Reported', class: styles.statusBadgeFull }
      case 'partial':
        return { emoji: '🟡', label: 'Partially Reported', class: styles.statusBadgePartial }
      case 'none':
        return { emoji: '🔴', label: 'Not Reported', class: styles.statusBadgeNone }
    }
  }

  // Helper to format YoY with arrow
  const formatYoY = (yoy: number | null | undefined) => {
    if (yoy === null || yoy === undefined) return null
    const arrow = yoy < 0 ? '↓' : '↑'
    const color = yoy < 0 ? '#10b981' : '#ef4444'
    return { value: Math.abs(yoy).toFixed(1), arrow, color }
  }

  return (
    <div className={styles.standardsSection}>
      <h2 className={styles.sectionTitle}>GRI Environmental Standards (301-308)</h2>

      <div className={styles.standardsGrid}>
        {data.standards.map((standard) => {
          const statusBadge = getStatusBadge(standard.status)
          const yoyData = formatYoY(standard.key_metric_yoy)
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
              {/* Header with icon and code */}
              <div className={styles.standardHeader}>
                <span className={styles.standardIcon}>
                  {standardIcons[standard.standard_code]}
                </span>
                <span className={styles.standardCode}>GRI {standard.standard_code}</span>
              </div>

              <h3 className={styles.standardName}>{standard.standard_name}</h3>

              {/* Status Badge */}
              <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                <span className={styles.statusEmoji}>{statusBadge.emoji}</span>
                <span className={styles.statusLabel}>{statusBadge.label}</span>
              </div>

              {/* Coverage and Data Depth */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Coverage</div>
                  <div className={styles.metricValue}>
                    {standard.metrics_recorded}/{standard.total_metrics}
                  </div>
                  <div className={styles.metricSubtext}>{standard.completion_percentage}%</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Data Depth</div>
                  <div className={styles.metricValue}>{standard.total_records}</div>
                  <div className={styles.metricSubtext}>
                    {standard.data_quality === 'high' ? 'High granularity' :
                     standard.data_quality === 'medium' ? 'Medium' : 'Annual only'}
                  </div>
                </div>
              </div>

              {/* Automation */}
              <div className={styles.automationRow}>
                <span className={styles.automationLabel}>🤖 Automation:</span>
                <span className={styles.automationValue}>{automationLevels[standard.standard_code]}</span>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${completionClass}`}
                    style={{ width: `${Math.min(standard.completion_percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Key Metric with YoY */}
              {standard.key_metric_value !== undefined && standard.key_metric_value > 0 && (
                <div className={styles.keyMetricSection}>
                  <div className={styles.keyMetricLabel}>KEY METRIC</div>
                  <div className={styles.keyMetricValue}>
                    {standard.key_metric_value.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    <span className={styles.keyMetricUnit}>{standard.key_metric_unit}</span>
                  </div>
                  {yoyData && (
                    <div className={styles.yoyIndicator} style={{ color: yoyData.color }}>
                      <span className={styles.yoyArrow}>{yoyData.arrow}</span>
                      <span className={styles.yoyValue}>{yoyData.value}% vs last year</span>
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              {standard.last_updated && (
                <div className={styles.lastUpdated}>
                  Last update:{' '}
                  {new Date(standard.last_updated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
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
