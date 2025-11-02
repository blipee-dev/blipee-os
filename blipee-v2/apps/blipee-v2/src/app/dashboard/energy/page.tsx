export const dynamic = 'force-dynamic'

/**
 * Energy Dashboard Page
 *
 * Main dashboard showing energy consumption tracking and analytics
 * Protected route - requires authentication
 */

import { LineChart, DonutChartSimple, BarChart, Heatmap } from '@/components/Dashboard/Charts'
import styles from '../dashboard.module.css'

export default async function EnergyDashboardPage() {
  return (
    <>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <svg className={styles.carbonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <h1>Energy Dashboard</h1>
          </div>
          <p className={styles.subtitle}>Monitor and analyze energy consumption across your organization</p>
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
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Consumption</span>
            <svg className={`${styles.kpiIcon} ${styles.iconAmber}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className={styles.kpiValue}>1,247 MWh</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↓ 8.2%</span>
            <span className={styles.trendNeutral}>vs last period</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Cost Savings</span>
            <svg className={`${styles.kpiIcon} ${styles.iconGreen}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.kpiValue}>€24,850</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↑ 12.4%</span>
            <span className={styles.trendNeutral}>vs last period</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Carbon Reduced</span>
            <svg className={`${styles.kpiIcon} ${styles.iconBlue}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <div className={styles.kpiValue}>542 tCO₂</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↑ 15.7%</span>
            <span className={styles.trendNeutral}>vs last period</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Efficiency Score</span>
            <svg className={`${styles.kpiIcon} ${styles.iconPurple}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className={styles.kpiValue}>87.3%</div>
          <div className={`${styles.kpiTrend} ${styles.trendPositive}`}>
            <span>↑ 3.1%</span>
            <span className={styles.trendNeutral}>vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Line Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Energy Consumption Trend</h2>
            <p className={styles.chartDescription}>Monthly energy usage over time (MWh)</p>
          </div>
          <LineChart
            data={[
              { label: 'Jan', value: 120 },
              { label: 'Feb', value: 105 },
              { label: 'Mar', value: 98 },
              { label: 'Apr', value: 110 },
              { label: 'May', value: 92 },
              { label: 'Jun', value: 85 },
              { label: 'Jul', value: 78 },
              { label: 'Aug', value: 82 },
              { label: 'Sep', value: 75 },
              { label: 'Oct', value: 70 },
            ]}
          />
        </div>

        {/* Donut Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Energy by Source</h2>
            <p className={styles.chartDescription}>Distribution of energy sources</p>
          </div>
          <DonutChartSimple
            segments={[
              { label: 'Solar', value: 40, color: '#f59e0b' },
              { label: 'Wind', value: 30, color: '#10b981' },
              { label: 'Grid', value: 20, color: '#3b82f6' },
              { label: 'Hydro', value: 10, color: '#8b5cf6' },
            ]}
          />
        </div>

        {/* Heatmap */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Peak Demand Analysis</h2>
            <p className={styles.chartDescription}>Hourly demand patterns</p>
          </div>
          <Heatmap
            cells={[
              // 6am-10am: Low usage
              { value: 22, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 28, color: 'rgba(16, 185, 129, 0.4)' },
              { value: 35, color: 'rgba(16, 185, 129, 0.5)' },
              { value: 42, color: 'rgba(245, 158, 11, 0.5)' },
              { value: 51, color: 'rgba(245, 158, 11, 0.6)' },
              // 10am-2pm: Medium usage
              { value: 58, color: 'rgba(245, 158, 11, 0.7)' },
              { value: 65, color: 'rgba(245, 158, 11, 0.8)' },
              { value: 72, color: 'rgba(245, 158, 11, 0.9)' },
              { value: 78, color: 'rgba(239, 68, 68, 0.7)' },
              { value: 85, color: 'rgba(239, 68, 68, 0.8)' },
              // 2pm-6pm: Peak usage
              { value: 92, color: 'rgba(239, 68, 68, 0.9)' },
              { value: 95, color: 'rgba(239, 68, 68, 1)' },
              { value: 98, color: 'rgba(239, 68, 68, 1)' },
              { value: 100, color: 'rgba(239, 68, 68, 1)' },
              { value: 96, color: 'rgba(239, 68, 68, 0.9)' },
              // 6pm-10pm: High usage
              { value: 88, color: 'rgba(239, 68, 68, 0.8)' },
              { value: 75, color: 'rgba(245, 158, 11, 0.9)' },
              { value: 68, color: 'rgba(245, 158, 11, 0.8)' },
              { value: 62, color: 'rgba(245, 158, 11, 0.7)' },
              { value: 55, color: 'rgba(245, 158, 11, 0.6)' },
              // 10pm-2am: Medium-low usage
              { value: 48, color: 'rgba(245, 158, 11, 0.5)' },
              { value: 42, color: 'rgba(16, 185, 129, 0.6)' },
              { value: 38, color: 'rgba(16, 185, 129, 0.5)' },
              { value: 32, color: 'rgba(16, 185, 129, 0.4)' },
              { value: 28, color: 'rgba(16, 185, 129, 0.3)' },
              // 2am-6am: Lowest usage
              { value: 25, color: 'rgba(16, 185, 129, 0.3)' },
              { value: 20, color: 'rgba(16, 185, 129, 0.2)' },
              { value: 18, color: 'rgba(16, 185, 129, 0.2)' },
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

        {/* Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Cost Breakdown</h2>
            <p className={styles.chartDescription}>Energy costs by category (€)</p>
          </div>
          <BarChart
            bars={[
              { label: 'Demand', value: 8200, gradient: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' },
              { label: 'Supply', value: 6500, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
              { label: 'Peak', value: 4900, gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
              { label: 'Off-Peak', value: 3800, gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' },
              { label: 'Renewable', value: 2700, gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Site Performance Overview</h2>
          <p className={styles.chartDescription}>Detailed energy metrics by location</p>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Site</th>
              <th>Consumption (MWh)</th>
              <th>Cost (€)</th>
              <th>Carbon (tCO₂)</th>
              <th>Efficiency</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Headquarters</strong></td>
              <td>342.5</td>
              <td>€8,240</td>
              <td>147.2</td>
              <td>91.2%</td>
              <td className={styles.trendPositive}>↓ 12.3%</td>
            </tr>
            <tr>
              <td><strong>Manufacturing Plant A</strong></td>
              <td>621.8</td>
              <td>€14,920</td>
              <td>267.4</td>
              <td>85.7%</td>
              <td className={styles.trendPositive}>↓ 5.8%</td>
            </tr>
            <tr>
              <td><strong>Warehouse B</strong></td>
              <td>182.3</td>
              <td>€4,380</td>
              <td>78.4</td>
              <td>88.9%</td>
              <td className={styles.trendPositive}>↓ 8.1%</td>
            </tr>
            <tr>
              <td><strong>Distribution Center</strong></td>
              <td>100.4</td>
              <td>€2,410</td>
              <td>43.2</td>
              <td>82.3%</td>
              <td className={styles.trendNegative}>↑ 2.4%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
