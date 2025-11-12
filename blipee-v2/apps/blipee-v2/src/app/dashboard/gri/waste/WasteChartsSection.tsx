'use client'

import { useTranslations } from 'next-intl'
import type { WasteDashboardData } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { WasteIntensityCards } from './WasteIntensityCards'
import styles from '../../dashboard.module.css'

interface WasteChartsSectionProps {
  data: WasteDashboardData
}

export function WasteChartsSection({ data }: WasteChartsSectionProps) {
  const t = useTranslations('gri.waste.charts')
  const { monthlyTrend, byType, byTreatment } = data

  // Transform monthly trend for LineChart - show total waste generated
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.generated,
  }))

  // Transform waste types for DonutChart with distinct colors
  const getWasteTypeColor = (typeName: string, isHazardous: boolean): string => {
    if (isHazardous) return '#ef4444' // red for hazardous

    // Assign distinct colors based on waste type
    const typeColors: Record<string, string> = {
      'Paper': '#10b981',           // green
      'Plastic': '#3b82f6',         // blue
      'Metal': '#f59e0b',           // amber
      'Glass': '#06b6d4',           // cyan
      'Mixed Recycling': '#8b5cf6', // violet
      'Food Waste': '#ec4899',      // pink
      'Garden Waste': '#14b8a6',    // teal
      'Incineration': '#ef4444',    // red
      'Landfill': '#dc2626',        // dark red
      'E-Waste': '#6366f1',         // indigo
    }

    return typeColors[typeName] || '#64748b' // slate gray as fallback
  }

  const donutSegments = byType.map((type) => ({
    label: type.type,
    value: type.value,
    color: getWasteTypeColor(type.type, type.hazardous),
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
          <h2 className={styles.chartTitle}>{t('generationTrend')}</h2>
          <p className={styles.chartDescription}>{t('monthlyGeneration')}</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} unit="kg" />
        ) : (
          <div className={styles.noData}>{t('noDataPeriod')}</div>
        )}
      </div>

      {/* Donut Chart - Waste by Type */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('wasteComposition')}</h2>
          <p className={styles.chartDescription}>{t('hazardousVsNonHazardous')}</p>
        </div>
        {donutSegments.length > 0 && donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} unit="kg" />
        ) : (
          <div className={styles.noData}>{t('noData')}</div>
        )}
      </div>

      {/* Bar Chart - Top Treatment Methods */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('disposalMethods')}</h2>
          <p className={styles.chartDescription}>{t('breakdownByMethod')}</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>{t('noTreatmentData')}</div>
        )}
      </div>

      {/* Intensity Cards - Direct 2x2 Grid */}
      <WasteIntensityCards intensity={data.intensity} />
    </div>
  )
}
