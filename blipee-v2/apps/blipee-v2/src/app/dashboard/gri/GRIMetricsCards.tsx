import { GRIDashboardData } from '@/lib/data/gri'
import styles from '../dashboard.module.css'

interface GRIMetricsCardsProps {
  data: GRIDashboardData
}

export function GRIMetricsCards({ data }: GRIMetricsCardsProps) {
  return (
    <div className={styles.kpiGrid}>
      {/* Total Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Emissions</span>
          <span className={styles.kpiStandard}>GRI 305</span>
        </div>
        <div className={styles.kpiValue}>
          {data.total_emissions_tonnes.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tonnes CO₂e</div>
        <div className={styles.kpiTrend}>
          {data.total_emissions_yoy !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.total_emissions_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {data.total_emissions_yoy < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.total_emissions_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.total_emissions_yoy).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>📊</span>
              <span>Scope 1, 2, 3 combined</span>
            </>
          )}
        </div>
      </div>

      {/* Total Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Energy</span>
          <span className={styles.kpiStandard}>GRI 302</span>
        </div>
        <div className={styles.kpiValue}>
          {data.total_energy_kwh.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          {data.total_energy_yoy !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.total_energy_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {data.total_energy_yoy < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.total_energy_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.total_energy_yoy).toFixed(1)}% vs same period last year
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

      {/* Total Water */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Water</span>
          <span className={styles.kpiStandard}>GRI 303</span>
        </div>
        <div className={styles.kpiValue}>
          {data.total_water_m3.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>m³</div>
        <div className={styles.kpiTrend}>
          {data.total_water_yoy !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.total_water_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {data.total_water_yoy < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.total_water_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.total_water_yoy).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>💧</span>
              <span>Withdrawal & consumption</span>
            </>
          )}
        </div>
      </div>

      {/* Total Waste */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Waste</span>
          <span className={styles.kpiStandard}>GRI 306</span>
        </div>
        <div className={styles.kpiValue}>
          {(data.total_waste_kg / 1000).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tonnes</div>
        <div className={styles.kpiTrend}>
          {data.total_waste_yoy !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.total_waste_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {data.total_waste_yoy < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.total_waste_yoy < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.total_waste_yoy).toFixed(1)}% vs same period last year
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🗑️</span>
              <span>Generated waste</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
