import { WasteDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface WasteMetricsCardsProps {
  data: WasteDashboardData
}

export function WasteMetricsCards({ data }: WasteMetricsCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      {/* Total Waste Generated */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Waste Generated</span>
          <span className={styles.kpiStandard}>GRI 306-3</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalGenerated.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>kg</div>
        <div className={styles.kpiTrend}>
          {data.totalGeneratedYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalGeneratedYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalGeneratedYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalGeneratedYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalGeneratedYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🗑️</span>
              <span>All waste types</span>
            </>
          )}
        </div>
      </div>

      {/* Waste Diverted */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Waste Diverted</span>
          <span className={styles.kpiStandard}>GRI 306-4</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalDiverted.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>kg</div>
        <div className={styles.kpiTrend}>
          {data.totalDivertedYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalDivertedYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.totalDivertedYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.totalDivertedYoY > 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalDivertedYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>♻️</span>
              <span>Recycled & recovered</span>
            </>
          )}
        </div>
      </div>

      {/* Waste Disposed */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Waste Disposed</span>
          <span className={styles.kpiStandard}>GRI 306-5</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalDisposed.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>kg</div>
        <div className={styles.kpiTrend}>
          {data.totalDisposedYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalDisposedYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalDisposedYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalDisposedYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalDisposedYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🚮</span>
              <span>Landfill & incineration</span>
            </>
          )}
        </div>
      </div>

      {/* Recycling Rate */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Recycling Rate</span>
          <span className={styles.kpiStandard}>GRI 306</span>
        </div>
        <div className={styles.kpiValue}>
          {data.recyclingRate.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </div>
        <div className={styles.kpiUnit}>%</div>
        <div className={styles.kpiTrend}>
          {data.recyclingRateYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.recyclingRateYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.recyclingRateYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.recyclingRateYoY > 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.recyclingRateYoY).toFixed(1)}pp vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>📊</span>
              <span>Diversion rate</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
