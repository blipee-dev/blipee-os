import { getTranslations } from 'next-intl/server'
import { WaterDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface WaterMetricsCardsProps {
  data: WaterDashboardData
}

export async function WaterMetricsCards({ data }: WaterMetricsCardsProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.kpiGrid}>
      {/* Total Water Withdrawal */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('water.metrics.totalWithdrawal')}</span>
          <span className={styles.kpiStandard}>GRI 303-3</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalWithdrawal.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>m³</div>
        <div className={styles.kpiTrend}>
          {data.totalWithdrawalYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalWithdrawalYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalWithdrawalYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalWithdrawalYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalWithdrawalYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>💧</span>
              <span>{t('water.metrics.allWaterSources')}</span>
            </>
          )}
        </div>
      </div>

      {/* Water Consumption */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('water.metrics.totalConsumption')}</span>
          <span className={styles.kpiStandard}>GRI 303-5</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalConsumption.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>m³</div>
        <div className={styles.kpiTrend}>
          {data.totalConsumptionYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalConsumptionYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalConsumptionYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalConsumptionYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalConsumptionYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🚰</span>
              <span>{t('water.metrics.waterManagement')}</span>
            </>
          )}
        </div>
      </div>

      {/* Water Discharge */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('water.metrics.totalDischarge')}</span>
          <span className={styles.kpiStandard}>GRI 303-4</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalDischarge.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>m³</div>
        <div className={styles.kpiTrend}>
          {data.totalDischargeYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalDischargeYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalDischargeYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalDischargeYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalDischargeYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🌊</span>
              <span>{t('water.metrics.waterManagement')}</span>
            </>
          )}
        </div>
      </div>

      {/* Water Recycled */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('water.metrics.totalRecycled')}</span>
          <span className={styles.kpiStandard}>GRI 303-3</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalRecycled.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className={styles.kpiUnit}>m³</div>
        <div className={styles.kpiTrend}>
          {data.totalRecycledYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalRecycledYoY > 0 ? '#10b981' : '#ef4444' }}>
                {data.totalRecycledYoY > 0 ? '↑' : '↓'}
              </span>
              <span style={{ color: data.totalRecycledYoY > 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalRecycledYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>♻️</span>
              <span>{t('water.metrics.waterReused')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
