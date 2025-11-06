import { getTranslations } from 'next-intl/server'
import { EnergyDashboardDataGRI } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EnergyMetricsCardsProps {
  data: EnergyDashboardDataGRI
}

export async function EnergyMetricsCards({ data }: EnergyMetricsCardsProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.kpiGrid}>
      {/* Total Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('energy.metrics.totalEnergy')}</span>
          <span className={styles.kpiStandard}>GRI 302</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalEnergy.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          {data.totalEnergyYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalEnergyYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalEnergyYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalEnergyYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalEnergyYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>⚡</span>
              <span>{t('energy.metrics.allEnergySources')}</span>
            </>
          )}
        </div>
      </div>

      {/* Renewable Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('energy.metrics.renewableEnergy')}</span>
          <span className={styles.kpiStandard}>GRI 302-1</span>
        </div>
        <div className={styles.kpiValue}>
          {data.renewableTotal.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>🌱</span>
          <span>{data.renewablePercentage.toFixed(1)}% {t('common.ofTotal')}</span>
        </div>
      </div>

      {/* Non-Renewable Energy */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('energy.metrics.nonRenewableEnergy')}</span>
          <span className={styles.kpiStandard}>GRI 302-1</span>
        </div>
        <div className={styles.kpiValue}>
          {data.nonRenewableTotal.toLocaleString('en-US')}
        </div>
        <div className={styles.kpiUnit}>kWh</div>
        <div className={styles.kpiTrend}>
          <span className={styles.trendIcon}>⚫</span>
          <span>{(100 - data.renewablePercentage).toFixed(1)}% {t('common.ofTotal')}</span>
        </div>
      </div>

      {/* Renewable Percentage */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('energy.metrics.renewableShare')}</span>
          <span className={styles.kpiStandard}>{t('energy.metrics.targetHundred')}</span>
        </div>
        <div className={styles.kpiValue}>
          {data.renewablePercentage.toFixed(1)}
        </div>
        <div className={styles.kpiUnit}>%</div>
        <div className={styles.kpiTrend}>
          {data.renewablePercentageYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.renewablePercentageYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.renewablePercentageYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.renewablePercentageYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.renewablePercentageYoY > 0 ? '+' : ''}{data.renewablePercentageYoY.toFixed(1)}{t('energy.metrics.ppVsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🎯</span>
              <span>{t('energy.metrics.cleanEnergyRatio')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
