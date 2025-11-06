import { getTranslations } from 'next-intl/server'
import type { WaterDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface WaterSiteTableProps {
  data: WaterDashboardData
}

export async function WaterSiteTable({ data }: WaterSiteTableProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>{t('water.table.title')}</h2>
        <p className={styles.chartDescription}>{t('water.table.description')}</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('water.table.site')}</th>
            <th>{t('water.table.withdrawal')}</th>
            <th>{t('water.table.consumption')}</th>
            <th>{t('water.table.discharge')}</th>
            <th>{t('water.table.recycled')}</th>
            <th>{t('water.table.yoy')}</th>
            <th>{t('water.table.shareOfTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.bySite.length > 0 ? (
            data.bySite.map((site) => {
              const percentage =
                data.totalWithdrawal > 0
                  ? ((site.withdrawal / data.totalWithdrawal) * 100).toFixed(1)
                  : '0.0'

              return (
                <tr key={site.site_id}>
                  <td>
                    <strong>{site.site_name}</strong>
                  </td>
                  <td>
                    {site.withdrawal.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.consumption.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.discharge.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.recycled.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {site.withdrawalYoY !== null ? (
                      <span style={{
                        color: site.withdrawalYoY < 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {site.withdrawalYoY < 0 ? '↓' : '↑'} {Math.abs(site.withdrawalYoY).toFixed(1)}%
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
