'use client'

import type { WasteDashboardData } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { WasteIntensityCards } from './WasteIntensityCards'
import styles from '../../dashboard.module.css'

interface WasteChartsSectionProps {
  data: WasteDashboardData
}

export function WasteChartsSection({ data }: WasteChartsSectionProps) {
  const { monthlyTrend, byType, byTreatment } = data

  // Transform monthly trend for LineChart - show total waste generated
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.generated,
  }))

  // Transform waste types for DonutChart (hazardous vs non-hazardous)
  const donutSegments = byType.map((type) => ({
    label: type.type,
    value: type.value,
    color: type.hazardous ? '#ef4444' : '#10b981', // red for hazardous, green for non-hazardous
  }))

  // Transform treatment methods for BarChart (top 5)
  const barChartData = byTreatment
    .slice(0, 5)
    .map((treatment) => ({
      label: treatment.treatment,
      value: treatment.value,
      gradient: treatment.treatment.toLowerCase().includes('recycle') || treatment.treatment.toLowerCase().includes('compost')
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // green for recycling
        : treatment.treatment.toLowerCase().includes('landfill')
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' // red for landfill
        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // amber for other
    }))

  return (
    <div className={styles.chartsSection}>
      {/* Line Chart - Monthly Trend */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Waste Generation Trend</h2>
          <p className={styles.chartDescription}>Monthly waste generated over time (kg)</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>No data available for this period</div>
        )}
      </div>

      {/* Donut Chart - Waste by Type */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Waste by Type</h2>
          <p className={styles.chartDescription}>Hazardous vs non-hazardous breakdown</p>
        </div>
        {donutSegments.length > 0 && donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>No data available</div>
        )}
      </div>

      {/* Bar Chart - Top Treatment Methods */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Top Treatment Methods</h2>
          <p className={styles.chartDescription}>Top 5 waste treatment methods (kg)</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>No treatment data available</div>
        )}
      </div>

      {/* Intensity Cards - Direct 2x2 Grid */}
      <WasteIntensityCards intensity={data.intensity} />
    </div>
  )
}
