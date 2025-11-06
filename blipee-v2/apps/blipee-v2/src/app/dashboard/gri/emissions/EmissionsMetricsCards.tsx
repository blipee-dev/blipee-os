import { getTranslations } from 'next-intl/server'
import { EmissionsDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EmissionsMetricsCardsProps {
  data: EmissionsDashboardData
}

export async function EmissionsMetricsCards({ data }: EmissionsMetricsCardsProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.kpiGrid}>
      {/* Total Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('emissions.metrics.totalEmissions')}</span>
          <span className={styles.kpiStandard}>GRI 305</span>
        </div>
        <div className={styles.kpiValue}>
          {data.totalEmissions.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tCO₂e</div>
        <div className={styles.kpiTrend}>
          {data.totalEmissionsYoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.totalEmissionsYoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.totalEmissionsYoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.totalEmissionsYoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.totalEmissionsYoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🌍</span>
              <span>{t('emissions.metrics.targetProgress')}</span>
            </>
          )}
        </div>
      </div>

      {/* Scope 1 Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('emissions.metrics.scope1')}</span>
          <span className={styles.kpiStandard}>GRI 305-1</span>
        </div>
        <div className={styles.kpiValue}>
          {data.scope1Total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tCO₂e</div>
        <div className={styles.kpiTrend}>
          {data.scope1YoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.scope1YoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.scope1YoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.scope1YoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.scope1YoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🏭</span>
              <span>{t('emissions.metrics.directEmissions')}</span>
            </>
          )}
        </div>
      </div>

      {/* Scope 2 Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('emissions.metrics.scope2')}</span>
          <span className={styles.kpiStandard}>GRI 305-2</span>
        </div>
        <div className={styles.kpiValue}>
          {data.scope2Total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tCO₂e</div>
        <div className={styles.kpiTrend}>
          {data.scope2YoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.scope2YoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.scope2YoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.scope2YoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.scope2YoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>⚡</span>
              <span>{t('emissions.metrics.indirectEnergy')}</span>
            </>
          )}
        </div>
      </div>

      {/* Scope 3 Emissions */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{t('emissions.metrics.scope3')}</span>
          <span className={styles.kpiStandard}>GRI 305-3</span>
        </div>
        <div className={styles.kpiValue}>
          {data.scope3Total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className={styles.kpiUnit}>tCO₂e</div>
        <div className={styles.kpiTrend}>
          {data.scope3YoY !== null ? (
            <>
              <span className={styles.trendIcon} style={{ color: data.scope3YoY < 0 ? '#10b981' : '#ef4444' }}>
                {data.scope3YoY < 0 ? '↓' : '↑'}
              </span>
              <span style={{ color: data.scope3YoY < 0 ? '#10b981' : '#ef4444' }}>
                {Math.abs(data.scope3YoY).toFixed(1)}% {t('common.vsLastYear')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.trendIcon}>🔗</span>
              <span>{t('emissions.metrics.valueChain')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
