import { EnergyDashboardDataGRI } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EnergyMetricsCardsProps {
  data: EnergyDashboardDataGRI
}

export function EnergyMetricsCards({ data }: EnergyMetricsCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      {/* Total Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Energy</span>
          <span className={styles.kpiStandard}>GRI 302</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalEnergy.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          {data.totalEnergyYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalEnergyYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalEnergyYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalEnergyYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalEnergyYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>⚡</span>
              <span>All energy sources</span>
            </>
          )}
        </div>
      </div>

      {/* Renewable Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Renewable Energy</span>
          <span className={styles.kpiStandard}>GRI 302-1</span>
        </div>
        <div className={styles.kpiValue}>
          {data.renewableTotal.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          {data.renewableTotalYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.renewableTotalYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.renewableTotalYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.renewableTotalYoY > 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.renewableTotalYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🌱</span>
              <span>{data.renewablePercentage.toFixed(1)}% of total</span>
            </>
          )}
        </div>
      </div>

      {/* Non-Renewable Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Non-Renewable Energy</span>
          <span className={styles.kpiStandard}>GRI 302-1</span>
        </div>
        <div className={styles.kpiValue}>
          {data.nonRenewableTotal.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          {data.nonRenewableTotalYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.nonRenewableTotalYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.nonRenewableTotalYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.nonRenewableTotalYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.nonRenewableTotalYoY).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>⚫</span>
              <span>{(100 - data.renewablePercentage).toFixed(1)}% of total</span>
            </>
          )}
        </div>
      </div>

      {/* Renewable Percentage */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Renewable Share</span>
          <span className={styles.kpiStandard}>Target: 100%</span>
        </div>
        <div className={styles.kpiValue}>
          {data.renewablePercentage.toFixed(1)}
        </div>
        <div className={styles.kpiUnit}>%</div>
        <div className={styles.kpiTrend}>
          {data.renewablePercentageYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.renewablePercentageYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.renewablePercentageYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.renewablePercentageYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.renewablePercentageYoY > 0 ? '+' : ''}{data.renewablePercentageYoY.toFixed(1)}pp vs last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🎯</span>
              <span>Clean energy ratio</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
