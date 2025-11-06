'use client'

import type { WaterDashboardData } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { WaterIntensityCards } from './WaterIntensityCards'
import styles from '../../dashboard.module.css'

interface WaterChartsSectionProps {
  data: WaterDashboardData
}

export function WaterChartsSection({ data }: WaterChartsSectionProps) {
  const { monthlyTrend, bySource } = data

  // Transform monthly trend for LineChart - show withdrawal vs consumption
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.withdrawal,
  }))

  // Calculate water balance for donut chart
  const donutSegments = [
    {
      label: 'Withdrawal',
      value: data.totalWithdrawal,
      color: '#3b82f6', // blue
    },
    {
      label: 'Consumption',
      value: data.totalConsumption,
      color: '#ef4444', // red
    },
    {
      label: 'Discharge',
      value: data.totalDischarge,
      color: '#10b981', // green
    },
  ].filter((segment) => segment.value > 0)

  // Transform sources for BarChart (top 5)
  const barChartData = bySource
    .slice(0, 5)
    .map((source) => ({
      label: source.source,
      value: source.value,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // cyan gradient
    }))

  return (
    <div className={styles.chartsSection}>
      {/* Line Chart - Monthly Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Water Withdrawal Trend</h2>
          <p className={styles.chartDescription}>Monthly water withdrawal over time (m³)</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>No data available for this period</div>
        )}
      </div>

      {/* Donut Chart - Water Balance */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Water Balance</h2>
          <p className={styles.chartDescription}>Withdrawal, consumption, and discharge distribution</p>
        </div>
        {donutSegments.length > 0 && donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>No data available</div>
        )}
      </div>

      {/* Bar Chart - Top Water Sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Top Water Sources</h2>
          <p className={styles.chartDescription}>Top 5 sources by volume (m³)</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>No water source data available</div>
        )}
      </div>

      {/* Intensity Cards - Direct 2x2 Grid */}
      <WaterIntensityCards intensity={data.intensity} />
    </div>
  )
}
