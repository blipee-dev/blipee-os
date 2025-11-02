export const dynamic = 'force-dynamic'

/**
 * Carbon Dashboard Page
 *
 * Main dashboard showing carbon emissions tracking and analytics
 * Protected route - requires authentication
 */

import { DonutChart, ProgressRings, GaugeChart, Treemap, BarChart, Heatmap } from '@/components/Dashboard/Charts'
import styles from './dashboard.module.css'

export default async function DashboardPage() {
  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v12M6 12h12" />
            </svg>
            <h1>Carbon Dashboard</h1>
          </div>
          <p className={styles.subtitle}>Track and reduce carbon emissions across your organization</p>
        </div>
        <div className={styles.filters}>
          <select className={styles.filterSelect}>
            <option>All Sites</option>
            <option>Headquarters</option>
            <option>Manufacturing Plant A</option>
            <option>Warehouse B</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Current Year</option>
            <option>Last 12 Months</option>
            <option>Last Quarter</option>
            <option>Last Month</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Emissions</span>
            <svg className={`${styles.kpiIcon} ${styles.iconAmber}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <div className={styles.kpiValue}>1,247 tCO₂</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↓ 8.2%</span>
            <span className={styles.trendNeutral}>vs last year</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Scope 1 Emissions</span>
            <svg className={`${styles.kpiIcon} ${styles.iconGreen}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className={styles.kpiValue}>342 tCO₂</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↓ 12.4%</span>
            <span className={styles.trendNeutral}>vs last year</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Scope 2 Emissions</span>
            <svg className={`${styles.kpiIcon} ${styles.iconBlue}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <div className={styles.kpiValue}>621 tCO₂</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↓ 5.8%</span>
            <span className={styles.trendNeutral}>vs last year</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Target Achievement</span>
            <svg className={`${styles.kpiIcon} ${styles.iconPurple}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className={styles.kpiValue}>73%</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↑ 8.1%</span>
            <span className={styles.trendNeutral}>vs target</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Donut Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Emissions by Scope</h2>
            <p className={styles.chartDescription}>Distribution across emission categories</p>
          </div>
          <DonutChart
            segments={[
              { label: 'Scope 1', value: 342, color: '#10b981' },
              { label: 'Scope 2', value: 621, color: '#3b82f6' },
              { label: 'Scope 3', value: 284, color: '#8b5cf6' },
            ]}
          />
        </div>

        {/* Progress Rings */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Reduction Progress</h2>
            <p className={styles.chartDescription}>Target achievement by emission category</p>
          </div>
          <ProgressRings
            rings={[
              { label: 'Transport', value: 85, color: '#10b981' },
              { label: 'Energy', value: 62, color: '#3b82f6' },
              { label: 'Supply', value: 45, color: '#8b5cf6' },
            ]}
          />
        </div>

        {/* Gauge Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Annual Target Achievement</h2>
            <p className={styles.chartDescription}>Progress towards 2024 reduction goals</p>
          </div>
          <GaugeChart value={73} label="of annual target" />
        </div>

        {/* Treemap */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Emissions Distribution</h2>
            <p className={styles.chartDescription}>By source and category</p>
          </div>
          <Treemap
            cells={[
              { label: 'Transportation', value: '342 tCO₂', color: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', size: '1 / span 2' },
              { label: 'Electricity', value: '287 tCO₂', color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', size: '3 / span 2' },
              { label: 'Heating', value: '156 tCO₂', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', size: 'auto' },
              { label: 'Cooling', value: '98 tCO₂', color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', size: 'auto' },
              { label: 'Manufacturing', value: '234 tCO₂', color: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', size: '1 / span 2' },
              { label: 'Supply Chain', value: '130 tCO₂', color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', size: 'auto' },
            ]}
          />
        </div>

        {/* Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Monthly Emissions</h2>
            <p className={styles.chartDescription}>Carbon emissions by month (tCO₂)</p>
          </div>
          <BarChart
            bars={[
              { label: 'Jan', value: 120, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
              { label: 'Feb', value: 105, gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
              { label: 'Mar', value: 98, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
              { label: 'Apr', value: 92, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
              { label: 'May', value: 87, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
            ]}
          />
        </div>

        {/* Heatmap */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Emission Intensity</h2>
            <p className={styles.chartDescription}>Hourly patterns throughout the week</p>
          </div>
          <Heatmap
            cells={[
              // Week 1
              { value: 22, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 28, color: 'rgba(16, 185, 129, 0.4)' },
              { value: 35, color: 'rgba(16, 185, 129, 0.5)' },
              { value: 42, color: 'rgba(245, 158, 11, 0.5)' },
              { value: 51, color: 'rgba(245, 158, 11, 0.6)' },
              { value: 58, color: 'rgba(245, 158, 11, 0.7)' },
              { value: 65, color: 'rgba(245, 158, 11, 0.8)' },
              // Week 2
              { value: 72, color: 'rgba(245, 158, 11, 0.9)' },
              { value: 78, color: 'rgba(239, 68, 68, 0.7)' },
              { value: 85, color: 'rgba(239, 68, 68, 0.8)' },
              { value: 92, color: 'rgba(239, 68, 68, 0.9)' },
              { value: 95, color: 'rgba(239, 68, 68, 1)' },
              { value: 98, color: 'rgba(239, 68, 68, 1)' },
              { value: 100, color: 'rgba(239, 68, 68, 1)' },
              // Week 3
              { value: 96, color: 'rgba(239, 68, 68, 0.9)' },
              { value: 88, color: 'rgba(239, 68, 68, 0.8)' },
              { value: 75, color: 'rgba(245, 158, 11, 0.9)' },
              { value: 68, color: 'rgba(245, 158, 11, 0.8)' },
              { value: 62, color: 'rgba(245, 158, 11, 0.7)' },
              { value: 55, color: 'rgba(245, 158, 11, 0.6)' },
              { value: 48, color: 'rgba(245, 158, 11, 0.5)' },
              // Week 4
              { value: 42, color: 'rgba(16, 185, 129, 0.6)' },
              { value: 38, color: 'rgba(16, 185, 129, 0.5)' },
              { value: 32, color: 'rgba(16, 185, 129, 0.4)' },
              { value: 28, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 25, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 20, color: 'rgba(16, 185, 129, 0.2)' },
              { value: 18, color: 'rgba(16, 185, 129, 0.2)' },
              // Week 5
              { value: 16, color: 'rgba(16, 185, 129, 0.2)' },
              { value: 15, color: 'rgba(16, 185, 129, 0.2)' },
              { value: 18, color: 'rgba(16, 185, 129, 0.2)' },
              { value: 22, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 28, color: 'rgba(16, 185, 129, 0.4)' },
              { value: 35, color: 'rgba(16, 185, 129, 0.5)' },
              { value: 42, color: 'rgba(245, 158, 11, 0.5)' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Emissions by Category</h2>
          <p className={styles.chartDescription}>Detailed breakdown of carbon emissions</p>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Emissions (tCO₂)</th>
              <th>% of Total</th>
              <th>Trend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Transportation</strong></td>
              <td>342</td>
              <td>27.4%</td>
              <td className={styles.trendPositive}>↓ 12.3%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>On Track</span></td>
            </tr>
            <tr>
              <td><strong>Electricity</strong></td>
              <td>287</td>
              <td>23.0%</td>
              <td className={styles.trendPositive}>↓ 8.1%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>On Track</span></td>
            </tr>
            <tr>
              <td><strong>Heating</strong></td>
              <td>156</td>
              <td>12.5%</td>
              <td className={styles.trendPositive}>↓ 5.2%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>On Track</span></td>
            </tr>
            <tr>
              <td><strong>Cooling</strong></td>
              <td>98</td>
              <td>7.9%</td>
              <td className={styles.trendNegative}>↑ 2.1%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusAtRisk}`}>At Risk</span></td>
            </tr>
            <tr>
              <td><strong>Manufacturing</strong></td>
              <td>234</td>
              <td>18.8%</td>
              <td className={styles.trendPositive}>↓ 6.4%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>On Track</span></td>
            </tr>
            <tr>
              <td><strong>Supply Chain</strong></td>
              <td>130</td>
              <td>10.4%</td>
              <td className={styles.trendPositive}>↓ 3.7%</td>
              <td><span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>On Track</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
