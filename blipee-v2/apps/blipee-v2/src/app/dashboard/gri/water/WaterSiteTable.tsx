'use client'

import type { WaterDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface WaterSiteTableProps {
  data: WaterDashboardData
}

export function WaterSiteTable({ data }: WaterSiteTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Water Usage by Site</h2>
        <p className={styles.chartDescription}>Detailed water breakdown by site</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Site</th>
            <th>Withdrawal (m³)</th>
            <th>Consumption (m³)</th>
            <th>Discharge (m³)</th>
            <th>Recycled (m³)</th>
            <th>YoY</th>
            <th>Share</th>
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
                No water data available for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
