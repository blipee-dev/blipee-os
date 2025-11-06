import { IntensityMetrics } from '@/lib/data/gri'
import dashboardStyles from '../../dashboard.module.css'

interface CompactIntensityCardsProps {
  intensity: IntensityMetrics
}

export function CompactIntensityCards({ intensity }: CompactIntensityCardsProps) {
  const hasData = intensity.perEmployee !== null || intensity.perRevenueMillion !== null || intensity.perFloorAreaM2 !== null || intensity.perCustomer !== null

  if (!hasData) {
    return null
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.75rem'
    }}>
      {/* Per Employee */}
      {intensity.perEmployee !== null && (
        <div className={dashboardStyles.kpiCard}>
          <div className={dashboardStyles.kpiHeader}>
            <span className={dashboardStyles.kpiLabel}>Per Employee</span>
            <span className={dashboardStyles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={dashboardStyles.kpiValue}>
            {intensity.perEmployee.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={dashboardStyles.kpiUnit}>tonnes CO₂e / employee</div>
          <div className={dashboardStyles.kpiTrend}>
            {intensity.perEmployeeYoY !== null ? (
              <>
                <span className={dashboardStyles.trendIcon} style={{ color: intensity.perEmployeeYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perEmployeeYoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perEmployeeYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perEmployeeYoY).toFixed(1)}% YoY
                </span>
              </>
            ) : (
              <>
                <span className={dashboardStyles.trendIcon}>👥</span>
                <span>No YoY data</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per Revenue */}
      {intensity.perRevenueMillion !== null && (
        <div className={dashboardStyles.kpiCard}>
          <div className={dashboardStyles.kpiHeader}>
            <span className={dashboardStyles.kpiLabel}>Per Revenue</span>
            <span className={dashboardStyles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={dashboardStyles.kpiValue}>
            {intensity.perRevenueMillion.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={dashboardStyles.kpiUnit}>tonnes CO₂e / $M revenue</div>
          <div className={dashboardStyles.kpiTrend}>
            {intensity.perRevenueMillionYoY !== null ? (
              <>
                <span className={dashboardStyles.trendIcon} style={{ color: intensity.perRevenueMillionYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perRevenueMillionYoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perRevenueMillionYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perRevenueMillionYoY).toFixed(1)}% YoY
                </span>
              </>
            ) : (
              <>
                <span className={dashboardStyles.trendIcon}>💰</span>
                <span>No YoY data</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per Floor Area */}
      {intensity.perFloorAreaM2 !== null && (
        <div className={dashboardStyles.kpiCard}>
          <div className={dashboardStyles.kpiHeader}>
            <span className={dashboardStyles.kpiLabel}>Per Floor Area</span>
            <span className={dashboardStyles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={dashboardStyles.kpiValue}>
            {intensity.perFloorAreaM2.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={dashboardStyles.kpiUnit}>kg CO₂e / m²</div>
          <div className={dashboardStyles.kpiTrend}>
            {intensity.perFloorAreaM2YoY !== null ? (
              <>
                <span className={dashboardStyles.trendIcon} style={{ color: intensity.perFloorAreaM2YoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perFloorAreaM2YoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perFloorAreaM2YoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perFloorAreaM2YoY).toFixed(1)}% YoY
                </span>
              </>
            ) : (
              <>
                <span className={dashboardStyles.trendIcon}>🏢</span>
                <span>No YoY data</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Per Customer */}
      {intensity.perCustomer !== null && (
        <div className={dashboardStyles.kpiCard}>
          <div className={dashboardStyles.kpiHeader}>
            <span className={dashboardStyles.kpiLabel}>Per Customer</span>
            <span className={dashboardStyles.kpiStandard}>GRI 305-4</span>
          </div>
          <div className={dashboardStyles.kpiValue}>
            {intensity.perCustomer.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={dashboardStyles.kpiUnit}>kg CO₂e / customer</div>
          <div className={dashboardStyles.kpiTrend}>
            {intensity.perCustomerYoY !== null ? (
              <>
                <span className={dashboardStyles.trendIcon} style={{ color: intensity.perCustomerYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {intensity.perCustomerYoY < 0 ? '↓' : '↑'}
                </span>
                <span style={{ color: intensity.perCustomerYoY < 0 ? '#10b981' : '#ef4444' }}>
                  {Math.abs(intensity.perCustomerYoY).toFixed(1)}% YoY
                </span>
              </>
            ) : (
              <>
                <span className={dashboardStyles.trendIcon}>👤</span>
                <span>No YoY data</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
