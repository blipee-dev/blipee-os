import { getTranslations } from 'next-intl/server'
import type { EnergyDashboardDataGRI } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { CompactEnergyIntensityCards } from './CompactEnergyIntensityCards'
import styles from '../../dashboard.module.css'

interface EnergyChartsSectionProps {
  data: EnergyDashboardDataGRI
}

export async function EnergyChartsSection({ data }: EnergyChartsSectionProps) {
  const t = await getTranslations('gri')
  const { monthlyTrend, byType, bySource, renewablePercentage } = data

  // Transform monthly trend for LineChart
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.total,
  }))

  // Transform renewable vs non-renewable for DonutChart
  const donutSegments = [
    {
      label: t('energy.charts.renewable'),
      value: data.renewableTotal,
      color: '#10b981',
    },
    {
      label: t('energy.charts.nonRenewable'),
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
          <h2 className={styles.chartTitle}>{t('energy.charts.consumptionTrend')}</h2>
          <p className={styles.chartDescription}>{t('energy.charts.monthlyUsage')}</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>{t('common.noDataPeriod')}</div>
        )}
      </div>

      {/* Donut Chart - Renewable vs Non-Renewable */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('energy.charts.energyMix')}</h2>
          <p className={styles.chartDescription}>{t('energy.charts.renewableVsNonRenewable')}</p>
        </div>
        {donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>{t('common.noData')}</div>
        )}
      </div>

      {/* Bar Chart - Top Sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('energy.charts.topSources')}</h2>
          <p className={styles.chartDescription}>{t('energy.charts.topFiveConsumption')}</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>{t('common.noData')}</div>
        )}
      </div>

      {/* Intensity Cards - 2x2 Grid */}
      <CompactEnergyIntensityCards intensity={data.intensity} />
    </div>
  )
}
