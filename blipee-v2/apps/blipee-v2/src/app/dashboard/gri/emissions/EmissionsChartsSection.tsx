'use client'

import type { EmissionsDashboardData } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { CompactIntensityCards } from './CompactIntensityCards'
import styles from '../../dashboard.module.css'

interface EmissionsChartsSectionProps {
  data: EmissionsDashboardData
}

export function EmissionsChartsSection({ data }: EmissionsChartsSectionProps) {
  const { monthlyTrend, byScope, bySource } = data

  // Transform monthly trend for LineChart (show total only for simplicity)
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.total,
  }))

  // Transform scopes for DonutChart
  const donutSegments = byScope.map((scope) => ({
    label: scope.scope,
    value: scope.value,
    color:
      scope.scope === 'Scope 1'
        ? '#ef4444'
        : scope.scope === 'Scope 2'
        ? '#f59e0b'
        : '#3b82f6',
  }))

  // Transform sources for BarChart (top 5)
  const barChartData = bySource
    .slice(0, 5)
    .map((source) => ({
      label: source.source,
      value: source.value,
      gradient:
        source.category === 'scope1'
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : source.category === 'scope2'
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    }))

  return (
    <div className={styles.chartsSection}>
      {/* Line Chart - Monthly Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Emissions Trend</h2>
          <p className={styles.chartDescription}>Monthly total emissions over time (tonnes CO₂e)</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>No data available for this period</div>
        )}
      </div>

      {/* Donut Chart - Emissions by Scope */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Emissions by Scope</h2>
          <p className={styles.chartDescription}>Distribution across Scope 1, 2, and 3</p>
        </div>
        {donutSegments.length > 0 && donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>No data available</div>
        )}
      </div>

      {/* Bar Chart - Top Sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Top Emission Sources</h2>
          <p className={styles.chartDescription}>Top 5 sources by emissions (tonnes CO₂e)</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>No emission source data available</div>
        )}
      </div>

      {/* Intensity Cards - Direct 2x2 Grid */}
      <CompactIntensityCards intensity={data.intensity} />
    </div>
  )
}
