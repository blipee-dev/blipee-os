'use client'

import styles from './Charts.module.css'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  title?: string
  description?: string
}

export function DonutChart({ segments, title, description }: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  let currentAngle = 0

  const createSegmentPath = (value: number, startAngle: number) => {
    const percentage = value / total
    const angle = percentage * 360
    const endAngle = startAngle + angle

    const start = polarToCartesian(50, 50, 40, startAngle)
    const end = polarToCartesian(50, 50, 40, endAngle)
    const largeArc = angle > 180 ? 1 : 0

    return `M ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} L 50 50 Z`
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  return (
    <div className={styles.donutChart}>
      <svg className={styles.donutSvg} viewBox="0 0 100 100">
        {segments.map((segment, index) => {
          const path = createSegmentPath(segment.value, currentAngle)
          const segmentAngle = (segment.value / total) * 360
          currentAngle += segmentAngle

          return (
            <path
              key={index}
              d={path}
              fill={segment.color}
              className={styles.donutSegment}
            />
          )
        })}
        <circle cx="50" cy="50" r="25" fill="var(--bg-primary)" />
      </svg>

      <div className={styles.donutLegend}>
        {segments.map((segment, index) => {
          const percentage = ((segment.value / total) * 100).toFixed(1)
          return (
            <div key={index} className={styles.legendItem}>
              <div className={styles.legendLabel}>
                <div
                  className={styles.legendColor}
                  style={{ background: segment.color }}
                />
                <span>{segment.label}</span>
              </div>
              <span className={styles.legendValue}>
                {segment.value} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ProgressRing {
  label: string
  value: number
  color: string
}

interface ProgressRingsProps {
  rings: ProgressRing[]
}

export function ProgressRings({ rings }: ProgressRingsProps) {
  const radius = 40
  const stroke = 8
  const circumference = 2 * Math.PI * radius

  return (
    <div className={styles.progressRings}>
      {rings.map((ring, index) => {
        const offset = circumference - (ring.value / 100) * circumference

        return (
          <div key={index} className={styles.progressRing}>
            <svg className={styles.ringSvg} viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={styles.ringBackground}
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={styles.ringProgress}
                stroke={ring.color}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dy="7"
                fill="var(--text-primary)"
                fontSize="20"
                fontWeight="700"
                transform="rotate(90 50 50)"
              >
                {ring.value}%
              </text>
            </svg>
            <div className={styles.ringLabel}>{ring.label}</div>
          </div>
        )
      })}
    </div>
  )
}

interface GaugeChartProps {
  value: number
  label?: string
}

export function GaugeChart({ value, label }: GaugeChartProps) {
  const radius = 90
  const strokeWidth = 20
  const circumference = Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={styles.gaugeChart}>
      <svg className={styles.gaugeSvg} viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 90 90 0 0 1 180 100"
          className={styles.gaugeBackground}
        />
        <path
          d="M 20 100 A 90 90 0 0 1 180 100"
          className={styles.gaugeProgress}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className={styles.gaugeValue}
          fill="var(--text-primary)"
        >
          {value}%
        </text>
        {label && (
          <text
            x="100"
            y="105"
            textAnchor="middle"
            className={styles.gaugeLabel}
            fill="var(--text-tertiary)"
            fontSize="12"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  )
}

interface TreemapCell {
  label: string
  value: string
  color: string
  size?: string
}

interface TreemapProps {
  cells: TreemapCell[]
}

export function Treemap({ cells }: TreemapProps) {
  return (
    <div className={styles.treemap}>
      {cells.map((cell, index) => (
        <div
          key={index}
          className={styles.treemapCell}
          style={{
            background: cell.color,
            gridColumn: cell.size || 'auto',
          }}
        >
          <div className={styles.cellLabel}>{cell.label}</div>
          <div className={styles.cellValue}>{cell.value}</div>
        </div>
      ))}
    </div>
  )
}

interface BarItem {
  label: string
  value: number
  gradient: string
}

interface BarChartProps {
  bars: BarItem[]
}

export function BarChart({ bars }: BarChartProps) {
  const maxValue = Math.max(...bars.map((b) => b.value))

  return (
    <div className={styles.barChart}>
      {bars.map((bar, index) => {
        const percentage = (bar.value / maxValue) * 100

        return (
          <div key={index} className={styles.barItem}>
            <div className={styles.barLabel}>{bar.label}</div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${percentage}%`,
                  background: bar.gradient,
                }}
              >
                <span className={styles.barValue}>{bar.value}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface HeatmapCell {
  value: number
  color: string
}

interface HeatmapProps {
  cells: HeatmapCell[]
}

export function Heatmap({ cells }: HeatmapProps) {
  return (
    <div>
      <div className={styles.heatmap}>
        {cells.map((cell, index) => (
          <div
            key={index}
            className={styles.heatmapCell}
            style={{ background: cell.color }}
            data-value={cell.value}
          />
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Low</span>
        <div className={styles.heatmapGradient} />
        <span>High</span>
      </div>
    </div>
  )
}

interface LineChartDataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LineChartDataPoint[]
}

export function LineChart({ data }: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1
  
  const width = 600
  const height = 260
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth
    const y = padding.top + chartHeight - ((point.value - minValue) / range) * chartHeight
    return { x, y, ...point }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  return (
    <div className={styles.lineChart}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChartSvg}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="var(--glass-border)"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--glass-border)"
          strokeWidth="1"
        />
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke="var(--glass-border)"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Area under line */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={index < data.length / 2 ? '#10b981' : '#3b82f6'}
          />
        ))}

        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="12"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

interface DonutChartSimpleProps {
  segments: Array<{
    label: string
    value: number
    color: string
  }>
}

export function DonutChartSimple({ segments }: DonutChartSimpleProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  let offset = 0

  return (
    <div className={styles.donutChartSimple}>
      <svg viewBox="0 0 200 200">
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100
          const dashArray = (percentage * 502.4) / 100
          const currentOffset = -offset

          offset += dashArray

          return (
            <circle
              key={index}
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={segment.color}
              strokeWidth="40"
              strokeDasharray={`${dashArray} 502.4`}
              strokeDashoffset={currentOffset}
              transform="rotate(-90 100 100)"
              className={styles.donutSegment}
            />
          )
        })}
        <circle cx="100" cy="100" r="50" fill="var(--glass-bg)" />
      </svg>
      <div className={styles.donutLegendSimple}>
        {segments.map((segment, index) => {
          const percentage = ((segment.value / total) * 100).toFixed(0)
          return (
            <div key={index} className={styles.legendItemSimple}>
              <div
                className={styles.legendColor}
                style={{ background: segment.color }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {segment.label} {percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
