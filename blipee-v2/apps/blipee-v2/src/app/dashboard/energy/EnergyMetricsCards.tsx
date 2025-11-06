'use client'

import type { EnergyDashboardData } from '@/lib/data/energy'
import styles from '../dashboard.module.css'

interface EnergyMetricsCardsProps {
  data: EnergyDashboardData
}

export function EnergyMetricsCards({ data }: EnergyMetricsCardsProps) {
  const { totalConsumption, totalCost, totalEmissions, renewablePercentage, yoyComparison } = data

  // Format numbers
  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // Render YoY trend indicator
  const renderTrend = (change: number, isInverted: boolean = false) => {
    if (!change || change === 0) {
      return <span className={styles.trendNeutral}>No change YoY</span>
    }

    // For inverted metrics (like emissions, cost, consumption), decrease is good
    // For renewable, increase is good
    const isPositive = isInverted ? change < 0 : change > 0
    const trendClass = isPositive ? styles.trendPositive : styles.trendNegative
    const arrow = change > 0 ? '↑' : '↓'
    const sign = change > 0 ? '+' : ''

    return (
      <span className={trendClass}>
        {arrow} {sign}{formatNumber(Math.abs(change), 1)}% YoY
      </span>
    )
  }

  return (
    <div className={styles.kpiGrid}>
      {/* Total Consumption */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Total Consumption</span>
          <svg
            className={`${styles.kpiIcon} ${styles.iconAmber}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{formatNumber(totalConsumption)} MWh</div>
        <div className={styles.kpiTrend}>
          {yoyComparison ? renderTrend(yoyComparison.consumption.change, true) : <span className={styles.trendNeutral}>Current period</span>}
        </div>
      </div>

      {/* Cost Savings */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Energy Cost</span>
          <svg
            className={`${styles.kpiIcon} ${styles.iconGreen}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className={styles.kpiValue}>€{formatNumber(totalCost, 0)}</div>
        <div className={styles.kpiTrend}>
          {yoyComparison ? renderTrend(yoyComparison.cost.change, true) : <span className={styles.trendNeutral}>Estimated cost</span>}
        </div>
      </div>

      {/* Carbon Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Carbon Emissions</span>
          <svg
            className={`${styles.kpiIcon} ${styles.iconBlue}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
        </div>
        <div className={styles.kpiValue}>{formatNumber(totalEmissions)} tCO₂e</div>
        <div className={styles.kpiTrend}>
          {yoyComparison ? renderTrend(yoyComparison.emissions.change, true) : <span className={styles.trendNeutral}>Scope 2 emissions</span>}
        </div>
      </div>

      {/* Renewable Percentage */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Renewable Energy</span>
          <svg
            className={`${styles.kpiIcon} ${styles.iconPurple}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div className={styles.kpiValue}>
          {formatNumber(renewablePercentage)}%
        </div>
        <div className={styles.kpiTrend}>
          {yoyComparison ? (
            renderTrend(yoyComparison.renewable.change, false)
          ) : (
            <span className={styles.trendNeutral}>Of total consumption</span>
          )}
        </div>
      </div>
    </div>
  )
}
