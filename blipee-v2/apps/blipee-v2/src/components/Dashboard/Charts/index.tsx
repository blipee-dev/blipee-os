'use client'

import React from 'react'
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
        // Show value inside bar if percentage > 15%, otherwise outside
        const showValueInside = percentage > 15

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
                {showValueInside && (
                  <span className={styles.barValue}>{bar.value.toLocaleString('en-US')}</span>
                )}
              </div>
              {!showValueInside && (
                <span
                  className={styles.barValueOutside}
                  style={{ left: `calc(${percentage}% + 0.5rem)` }}
                >
                  {bar.value.toLocaleString('en-US')}
                </span>
              )}
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
  unit?: string
}

export function LineChart({ data, unit = 'tonnes' }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 350 })
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 200)
        })
      }
    }

    // Initial measurement
    updateDimensions()

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // Helper function to format numbers with thousand separators
  const formatNumber = (value: number): string => {
    return value.toLocaleString('en-US')
  }

  // Helper function to calculate nice Y-axis ticks
  const getNiceYAxisTicks = (maxDataValue: number): number[] => {
    if (maxDataValue === 0) return [0, 10, 20, 30, 40, 50]

    // Calculate the order of magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxDataValue)))
    const normalized = maxDataValue / magnitude

    // Determine nice interval (1, 2, 5, 10, 20, 50, 100, etc.)
    let interval: number
    if (normalized <= 1) interval = magnitude * 0.2
    else if (normalized <= 2) interval = magnitude * 0.5
    else if (normalized <= 5) interval = magnitude * 1
    else interval = magnitude * 2

    // Calculate max value rounded up to nearest interval
    const niceMax = Math.ceil(maxDataValue / interval) * interval

    // Generate 5-6 ticks from 0 to niceMax
    const ticks: number[] = []
    for (let i = 0; i <= niceMax; i += interval) {
      ticks.push(i)
      if (ticks.length >= 6) break // Limit to 6 ticks max
    }

    return ticks
  }

  const maxDataValue = Math.max(...data.map((d) => d.value))
  const yAxisTicks = getNiceYAxisTicks(maxDataValue)
  const maxValue = yAxisTicks[yAxisTicks.length - 1]
  const minValue = 0
  const range = maxValue || 1

  const width = dimensions.width
  const height = dimensions.height
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
    <div ref={containerRef} className={styles.lineChart} style={{ position: 'relative' }}>
      {/* HTML Tooltip - rendered outside SVG to avoid clipping */}
      {hoveredPoint !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hoveredPoint].x / width) * 100}%`,
            top: `${(points[hoveredPoint].y / height) * 100}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-12px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none',
            zIndex: 10,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', whiteSpace: 'nowrap' }}>
            {points[hoveredPoint].label}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {formatNumber(Math.round(points[hoveredPoint].value))} {unit}
          </div>
        </div>
      )}
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
        
        {/* Horizontal grid lines with Y-axis labels */}
        {yAxisTicks.map((tickValue, i) => {
          const yPosition = padding.top + chartHeight * (1 - tickValue / range)
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={yPosition}
                x2={width - padding.right}
                y2={yPosition}
                stroke="var(--glass-border)"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={padding.left - 8}
                y={yPosition + 4}
                textAnchor="end"
                fill="var(--text-tertiary)"
                fontSize="11"
              >
                {formatNumber(tickValue)}
              </text>
            </g>
          )
        })}

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

        {/* Data points with hover */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Invisible larger circle for easier hover */}
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {/* Visible data point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredPoint === index ? 6 : 4}
              fill={index < data.length / 2 ? '#10b981' : '#3b82f6'}
              style={{
                cursor: 'pointer',
                transition: 'r 0.2s ease'
              }}
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
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
  unit?: string
}

export function DonutChartSimple({ segments, unit = 'tonnes' }: DonutChartSimpleProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null)
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  let offset = 0

  return (
    <div className={styles.donutChartSimple}>
      <div style={{ position: 'relative' }}>
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
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  cursor: 'pointer',
                  opacity: hoveredSegment === null || hoveredSegment === index ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}
              />
            )
          })}
          <circle cx="100" cy="100" r="50" fill="var(--glass-bg)" />
        </svg>

        {/* Tooltip */}
        {hoveredSegment !== null && (
          <div className={styles.donutTooltip}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              {segments[hoveredSegment].label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {segments[hoveredSegment].value.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {unit}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {((segments[hoveredSegment].value / total) * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Simplified Legend - Just color + label */}
      <div className={styles.donutLegendCompact}>
        {segments.map((segment, index) => (
          <div
            key={index}
            className={styles.legendItemCompact}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{
              opacity: hoveredSegment === null || hoveredSegment === index ? 1 : 0.5,
              cursor: 'pointer'
            }}
          >
            <div
              className={styles.legendColor}
              style={{ background: segment.color }}
            />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {segment.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
