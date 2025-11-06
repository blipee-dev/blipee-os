'use client'

import type { EnergyDashboardData } from '@/lib/data/energy'
import { LineChart, DonutChartSimple, BarChart, GaugeChart } from '@/components/Dashboard/Charts'
import styles from '../dashboard.module.css'

interface EnergyChartsSectionProps {
  data: EnergyDashboardData
}

export function EnergyChartsSection({ data }: EnergyChartsSectionProps) {
  const { monthlyTrend, sources, energyTypes, renewablePercentage } = data

  // Transform monthly trend for LineChart
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.consumption,
  }))

  // Transform sources for DonutChart
  const donutSegments = sources.map((source) => ({
    label: source.name,
    value: source.percentage || 0,
    color: source.renewable ? '#10b981' : source.type === 'grid_electricity' ? '#3b82f6' : '#f59e0b',
  }))

  // Transform sources for cost BarChart
  const barChartData = sources
    .filter((s) => s.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map((source) => ({
      label: source.name,
      value: source.cost,
      gradient: source.renewable
        ? 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)'
        : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    }))

  return (
    <div className={styles.chartsSection}>
      {/* Line Chart - Monthly Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Energy Consumption Trend</h2>
          <p className={styles.chartDescription}>Monthly energy usage over time (MWh)</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>No data available for this period</div>
        )}
      </div>

      {/* Gauge Chart - Renewable Energy */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Renewable Energy</h2>
          <p className={styles.chartDescription}>Percentage of renewable energy sources</p>
        </div>
        <GaugeChart
          value={renewablePercentage}
          label={`${renewablePercentage.toFixed(1)}%`}
        />
      </div>

      {/* Donut Chart - Energy by Source */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Energy by Source</h2>
          <p className={styles.chartDescription}>Distribution of energy sources</p>
        </div>
        {donutSegments.length > 0 ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>No data available</div>
        )}
      </div>

      {/* Bar Chart - Cost Breakdown */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Cost Breakdown</h2>
          <p className={styles.chartDescription}>Top 5 energy costs by source (€)</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>No cost data available</div>
        )}
      </div>

      {/* Energy Types Breakdown */}
      {energyTypes.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Energy Types</h2>
            <p className={styles.chartDescription}>Breakdown by energy type (MWh)</p>
          </div>
          <div className={styles.energyTypes}>
            {energyTypes.map((type) => (
              <div key={type.type} className={styles.energyType}>
                <span className={styles.energyTypeName}>{type.name}</span>
                <span className={styles.energyTypeValue}>
                  {type.value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
