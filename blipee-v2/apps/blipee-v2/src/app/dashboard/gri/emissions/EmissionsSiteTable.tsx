'use client'

import type { EmissionsDashboardData } from '@/lib/data/gri'
import styles from '../../dashboard.module.css'

interface EmissionsSiteTableProps {
  data: EmissionsDashboardData
}

export function EmissionsSiteTable({ data }: EmissionsSiteTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Emissions by Site</h2>
        <p className={styles.chartDescription}>Detailed emissions breakdown by site and scope</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Site</th>
            <th>Scope 1 (tCO₂e)</th>
            <th>Scope 2 (tCO₂e)</th>
            <th>Scope 3 (tCO₂e)</th>
            <th>Total (tCO₂e)</th>
            <th>YoY</th>
            <th>Share</th>
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
                No emissions data available for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
