'use client'

import type { EnergyDashboardDataGRI } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart, GaugeChart } from '@/components/Dashboard/Charts'
import styles from '../../dashboard.module.css'

interface EnergyChartsSectionProps {
  data: EnergyDashboardDataGRI
}

export function EnergyChartsSection({ data }: EnergyChartsSectionProps) {
  const { monthlyTrend, byType, bySource, renewablePercentage } = data

  // Transform monthly trend for LineChart
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.total,
  }))

  // Transform renewable vs non-renewable for DonutChart
  const donutSegments = [
    {
      label: 'Renewable',
      value: data.renewableTotal,
      color: '#10b981',
    },
    {
      label: 'Non-Renewable',
      value: data.nonRenewableTotal,
      color: '#6b7280',
    },
  ]

  // Transform sources for BarChart (top 5)
  const barChartData = bySource
    .slice(0, 5)
    .map((source) => ({
      label: source.source,
      value: source.value,
      gradient: source.renewable
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    }))

  return (
    <div className={styles.chartsSection}>
      {/* Line Chart - Monthly Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Energy Consumption Trend</h2>
          <p className={styles.chartDescription}>Monthly energy usage over time (kWh)</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>No data available for this period</div>
        )}
      </div>

      {/* Gauge Chart - Renewable Percentage */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Renewable Energy Share</h2>
          <p className={styles.chartDescription}>Percentage of energy from renewable sources</p>
        </div>
        <GaugeChart
          value={Math.round(renewablePercentage)}
          label={`${renewablePercentage.toFixed(1)}%`}
        />
      </div>

      {/* Donut Chart - Renewable vs Non-Renewable */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Energy Mix</h2>
          <p className={styles.chartDescription}>Renewable vs Non-Renewable energy</p>
        </div>
        {donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>No data available</div>
        )}
      </div>

      {/* Bar Chart - Top Sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Top Energy Sources</h2>
          <p className={styles.chartDescription}>Top 5 sources by consumption (kWh)</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>No energy source data available</div>
        )}
      </div>

      {/* Energy Types Breakdown */}
      {byType.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Energy Types</h2>
            <p className={styles.chartDescription}>Breakdown by energy type (kWh)</p>
          </div>
          <div className={styles.energyTypes}>
            {byType.map((type) => (
              <div key={type.type} className={styles.energyType}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: type.renewable ? '#10b981' : '#6b7280',
                    }}
                  />
                  <span className={styles.energyTypeName}>{type.type}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: type.renewable ? '#10b981' : '#6b7280',
                      fontWeight: 600,
                    }}
                  >
                    {type.renewable ? '🌱' : '⚫'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.energyTypeValue}>
                    {type.value.toLocaleString('en-US')} kWh
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    {type.percentage}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
