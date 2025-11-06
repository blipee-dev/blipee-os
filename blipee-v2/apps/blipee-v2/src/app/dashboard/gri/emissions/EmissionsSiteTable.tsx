import { getTranslations } from 'next-intl/server'
import type { EmissionsDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EmissionsSiteTableProps {
  data: EmissionsDashboardData
}

export async function EmissionsSiteTable({ data }: EmissionsSiteTableProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>{t('emissions.table.title')}</h2>
        <p className={styles.chartDescription}>{t('emissions.table.description')}</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('emissions.table.site')}</th>
            <th>{t('emissions.table.scope1')}</th>
            <th>{t('emissions.table.scope2')}</th>
            <th>{t('emissions.table.scope3')}</th>
            <th>{t('emissions.table.total')}</th>
            <th>{t('emissions.table.yoy')}</th>
            <th>{t('emissions.table.shareOfTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.bySite.length > 0 ? (
            data.bySite.map((site) => {
              const percentage =
                data.totalEmissions > 0
                  ? ((site.total / data.totalEmissions) * 100).toFixed(1)
                  : '0.0'

              return (
                <tr key={site.site_id}>
                  <td>
                    <strong>{site.site_name}</strong>
                  </td>
                  <td>
                    {site.scope1.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {site.scope2.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {site.scope3.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <strong>
                      {site.total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                  <td>
                    {site.totalYoY !== null ? (
                      <span style={{
                        color: site.totalYoY < 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {site.totalYoY < 0 ? '↓' : '↑'} {Math.abs(site.totalYoY).toFixed(1)}%
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
                {t('common.noDataPeriod')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
