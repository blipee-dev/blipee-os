import { IntensityMetrics } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EmissionsIntensityCardsProps {
  intensity: IntensityMetrics
}

export function EmissionsIntensityCards({ intensity }: EmissionsIntensityCardsProps) {
  const hasData = intensity.perEmployee !== null || intensity.perRevenueMillion !== null || intensity.perFloorAreaM2 !== null || intensity.perCustomer !== null

  if (!hasData) {
    return null // Don't show intensity cards if no business metrics are configured
  }

  return (
    <div className={styles.kpiGrid}>
      {/* Primary Metric: Per Employee - GRI 305-4 */}
      {intensity.perEmployee !== null && (
        <div className={`${styles.kpiCard} ${styles.kpiCardPrimary}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Emissions Intensity</span>
            <span className={styles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={styles.kpiValue}>
            {intensity.perEmployee.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={styles.kpiUnit}>tonnes CO₂e / employee</div>
          <div className={styles.kpiTrend}>
            {intensity.perEmployeeYoY !== null ? (
              <>
                <span className={styles.trendIcon} style={{ color: intensity.perEmployeeYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perEmployeeYoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perEmployeeYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perEmployeeYoY).toFixed(1)}% vs same period last year
                </span>
              </>
            ) : (
              <>
                <span className={styles.trendIcon}>👥</span>
                <span>
                  {intensity.employeeCount?.toLocaleString('en-US')} employees
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per Revenue Million */}
      {intensity.perRevenueMillion !== null && (
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Per Revenue</span>
            <span className={styles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={styles.kpiValue}>
            {intensity.perRevenueMillion.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={styles.kpiUnit}>tonnes CO₂e / $M revenue</div>
          <div className={styles.kpiTrend}>
            {intensity.perRevenueMillionYoY !== null ? (
              <>
                <span className={styles.trendIcon} style={{ color: intensity.perRevenueMillionYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perRevenueMillionYoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perRevenueMillionYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perRevenueMillionYoY).toFixed(1)}% vs same period last year
                </span>
              </>
            ) : (
              <>
                <span className={styles.trendIcon}>💰</span>
                <span>
                  ${(intensity.revenue! / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}M revenue
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per Floor Area */}
      {intensity.perFloorAreaM2 !== null && (
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Per Floor Area</span>
            <span className={styles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={styles.kpiValue}>
            {intensity.perFloorAreaM2.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={styles.kpiUnit}>kg CO₂e / m²</div>
          <div className={styles.kpiTrend}>
            {intensity.perFloorAreaM2YoY !== null ? (
              <>
                <span className={styles.trendIcon} style={{ color: intensity.perFloorAreaM2YoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perFloorAreaM2YoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perFloorAreaM2YoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perFloorAreaM2YoY).toFixed(1)}% vs same period last year
                </span>
              </>
            ) : (
              <>
                <span className={styles.trendIcon}>🏢</span>
                <span>
                  {intensity.floorArea?.toLocaleString('en-US')} m² total
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info Card - What is Intensity */}
      <div className={`${styles.kpiCard} ${styles.kpiCardInfo}`}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>About Intensity</span>
          <span className={styles.kpiStandard}>ℹ️</span>
          </div>
        <div className={styles.kpiInfoText}>
          Intensity metrics show carbon efficiency - emissions normalized by business metrics. Lower values indicate better efficiency.
        </div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>📊</span>
          <span>Essential for meaningful year-over-year comparisons</span>
        </div>
      </div>
    </div>
  )
}
