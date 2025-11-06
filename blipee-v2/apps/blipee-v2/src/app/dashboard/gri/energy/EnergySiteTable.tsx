import { getTranslations } from 'next-intl/server'
import type { EnergyDashboardDataGRI } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EnergySiteTableProps {
  data: EnergyDashboardDataGRI
}

export async function EnergySiteTable({ data }: EnergySiteTableProps) {
  const t = await getTranslations('gri')

  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>{t('energy.table.title')}</h2>
        <p className={styles.chartDescription}>{t('energy.table.description')}</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('energy.table.site')}</th>
            <th>{t('energy.table.renewable')}</th>
            <th>{t('energy.table.nonRenewable')}</th>
            <th>{t('energy.table.total')}</th>
            <th>{t('energy.table.efficiency')}</th>
            <th>{t('energy.table.yoy')}</th>
            <th>{t('energy.table.renewablePercent')}</th>
            <th>{t('energy.table.shareOfTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.bySite.length > 0 ? (
            data.bySite.map((site) => {
              const renewablePercentage =
                site.total > 0 ? ((site.renewable / site.total) * 100).toFixed(1) : '0.0'
              const totalPercentage =
                data.totalEnergy > 0
                  ? ((site.total / data.totalEnergy) * 100).toFixed(1)
                  : '0.0'

              return (
                <tr key={site.site_id}>
                  <td>
                    <strong>{site.site_name}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#10b981' }}>
                      {site.renewable.toLocaleString('en-US')}
                    </span>
                  </td>
                  <td>
                    {site.nonRenewable.toLocaleString('en-US')}
                  </td>
                  <td>
                    <strong>{site.total.toLocaleString('en-US')}</strong>
                  </td>
                  <td>
                    {site.efficiency !== null && site.efficiencyUnit ? (
                      <>
                        {site.efficiency.toLocaleString('en-US', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        <span style={{ fontSize: '0.8em', marginLeft: '0.25rem', color: '#6b7280' }}>
                          {site.efficiencyUnit}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#6b7280' }}>-</span>
                    )}
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
                  <td>
                    <span
                      style={{
                        color:
                          parseFloat(renewablePercentage) > 50
                            ? '#10b981'
                            : parseFloat(renewablePercentage) > 25
                            ? '#f59e0b'
                            : '#6b7280',
                        fontWeight: 600,
                      }}
                    >
                      {renewablePercentage}%
                    </span>
                  </td>
                  <td>{totalPercentage}%</td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                {t('common.noDataPeriod')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
