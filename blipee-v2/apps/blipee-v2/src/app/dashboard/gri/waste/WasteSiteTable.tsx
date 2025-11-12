'use client'

import { useTranslations } from 'next-intl'
import type { WasteDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface WasteSiteTableProps {
  data: WasteDashboardData
}

export function WasteSiteTable({ data }: WasteSiteTableProps) {
  const t = useTranslations('gri.waste.table')

  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>{t('title')}</h2>
        <p className={styles.chartDescription}>{t('description')}</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('site')}</th>
            <th>{t('generated')}</th>
            <th>{t('diverted')}</th>
            <th>{t('disposed')}</th>
            <th>{t('recyclingRate')}</th>
            <th>{t('yoy')}</th>
            <th>{t('share')}</th>
          </tr>
        </thead>
        <tbody>
          {data.bySite.length > 0 ? (
            data.bySite.map((site) => {
              const percentage =
                data.totalGenerated > 0
                  ? ((site.generated / data.totalGenerated) * 100).toFixed(1)
                  : '0.0'

              return (
                <tr key={site.site_id}>
                  <td>
                    <strong>{site.site_name}</strong>
                  </td>
                  <td>
                    {site.generated.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.diverted.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.disposed.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    <span style={{
                      color: site.recyclingRate >= 50 ? '#10b981' : site.recyclingRate >= 25 ? '#f59e0b' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {site.recyclingRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    {site.generatedYoY !== null ? (
                      <span style={{
                        color: site.generatedYoY < 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {site.generatedYoY < 0 ? '↓' : '↑'} {Math.abs(site.generatedYoY).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>-</span>
                    )}
                  </td>
                  <td>{percentage}%</td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                {t('noData')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
