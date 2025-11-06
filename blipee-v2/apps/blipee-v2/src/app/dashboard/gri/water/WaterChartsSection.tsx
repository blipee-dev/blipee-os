import { getTranslations } from 'next-intl/server'
import type { WaterDashboardData } from '@/lib/data/gri'
import { LineChart, DonutChartSimple, BarChart } from '@/components/Dashboard/Charts'
import { WaterIntensityCards } from './WaterIntensityCards'
import styles from '../../dashboard.module.css'

interface WaterChartsSectionProps {
  data: WaterDashboardData
}

export async function WaterChartsSection({ data }: WaterChartsSectionProps) {
  const t = await getTranslations('gri')
  const { monthlyTrend, bySource } = data

  // Transform monthly trend for LineChart - show withdrawal vs consumption
  const lineChartData = monthlyTrend.map((item) => ({
    label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: item.withdrawal,
  }))

  // Calculate water balance for donut chart
  const donutSegments = [
    {
      label: t('water.charts.withdrawal'),
      value: data.totalWithdrawal,
      color: '#3b82f6', // blue
    },
    {
      label: t('water.charts.consumption'),
      value: data.totalConsumption,
      color: '#ef4444', // red
    },
    {
      label: t('water.charts.discharge'),
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
          <h2 className={styles.chartTitle}>{t('water.charts.withdrawalTrend')}</h2>
          <p className={styles.chartDescription}>{t('water.charts.monthlyWithdrawal')}</p>
        </div>
        {lineChartData.length > 0 ? (
          <LineChart data={lineChartData} />
        ) : (
          <div className={styles.noData}>{t('common.noDataPeriod')}</div>
        )}
      </div>

      {/* Donut Chart - Water Balance */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('water.charts.waterBalance')}</h2>
          <p className={styles.chartDescription}>{t('water.charts.withdrawalVsConsumption')}</p>
        </div>
        {donutSegments.length > 0 && donutSegments.some((s) => s.value > 0) ? (
          <DonutChartSimple segments={donutSegments} />
        ) : (
          <div className={styles.noData}>{t('common.noData')}</div>
        )}
      </div>

      {/* Bar Chart - Top Water Sources */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>{t('water.charts.topSources')}</h2>
          <p className={styles.chartDescription}>{t('water.charts.topFiveSources')}</p>
        </div>
        {barChartData.length > 0 ? (
          <BarChart bars={barChartData} />
        ) : (
          <div className={styles.noData}>{t('common.noData')}</div>
        )}
      </div>

      {/* Intensity Cards - Direct 2x2 Grid */}
      <WaterIntensityCards intensity={data.intensity} />
    </div>
  )
}
