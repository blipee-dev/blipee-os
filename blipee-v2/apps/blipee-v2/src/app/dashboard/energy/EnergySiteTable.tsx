'use client'

import type { EnergyDashboardData } from '@/lib/data/energy'
import styles from '../dashboard.module.css'

interface EnergySiteTableProps {
  data: EnergyDashboardData
}

export function EnergySiteTable({ data }: EnergySiteTableProps) {

  return (
    <div className={styles.tableCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Energy Sources Performance</h2>
        <p className={styles.chartDescription}>Detailed energy metrics by source</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Source</th>
            <th>Consumption (MWh)</th>
            <th>Cost (€)</th>
            <th>Carbon (tCO₂e)</th>
            <th>Type</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {data.sources.length > 0 ? (
            data.sources
              .sort((a, b) => b.consumption - a.consumption)
              .map((source) => (
                <tr key={source.type}>
                  <td>
                    <strong>{source.name}</strong>
                  </td>
                  <td>{(source.consumption / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td>€{source.cost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td>{source.emissions.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td>
                    <span
                      className={source.renewable ? styles.badgeGreen : styles.badgeAmber}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {source.renewable ? '🌱 Renewable' : '⚡ Non-Renewable'}
                    </span>
                  </td>
                  <td>{(source.percentage || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                No energy data available for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
