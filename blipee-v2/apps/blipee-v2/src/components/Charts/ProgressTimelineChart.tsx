'use client'

import { useEffect, useRef, useState } from 'react'

export interface TimelineDataPoint {
  year: number
  emissions: number
  actual?: boolean // true for historical, false for projected
  milestone?: string
}

interface ProgressTimelineChartProps {
  data: TimelineDataPoint[]
  baseline: { year: number; emissions: number }
  target: { year: number; emissions: number }
  title?: string
  unit?: string
  height?: number
}

export function ProgressTimelineChart({
  data,
  baseline,
  target,
  title = 'Progress Timeline',
  unit = 'tCO2e',
  height = 400
}: ProgressTimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1000, height })

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect()
        setDimensions({ width: width || 1000, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [height])

  const { width } = dimensions
  const padding = { top: 60, right: 60, bottom: 80, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Combine all data points
  const allPoints = [
    { ...baseline, actual: true },
    ...data,
    { ...target, actual: false }
  ].sort((a, b) => a.year - b.year)

  // Calculate scales
  const minYear = Math.min(...allPoints.map(d => d.year))
  const maxYear = Math.max(...allPoints.map(d => d.year))
  const yearRange = maxYear - minYear

  const xScale = (year: number) => {
    return padding.left + ((year - minYear) / yearRange) * chartWidth
  }

  const maxEmissions = Math.max(...allPoints.map(d => d.emissions))
  const minEmissions = Math.min(0, ...allPoints.map(d => d.emissions))
  const emissionRange = maxEmissions - minEmissions

  const yScale = (emissions: number) => {
    return padding.top + chartHeight - ((emissions - minEmissions) / emissionRange) * chartHeight
  }

  // Split into actual and projected
  const actualData = allPoints.filter(d => d.actual)
  const projectedData = allPoints.filter(d => !d.actual)

  // Create paths
  const createPath = (points: typeof allPoints) => {
    if (points.length === 0) return ''
    const pathPoints = points.map(p => `${xScale(p.year)},${yScale(p.emissions)}`).join(' L')
    return `M${pathPoints}`
  }

  const createAreaPath = (points: typeof allPoints) => {
    if (points.length === 0) return ''
    const topPath = points.map(p => `${xScale(p.year)},${yScale(p.emissions)}`).join(' L')
    const bottomPath = points.map(p => `${xScale(p.year)},${yScale(0)}`).reverse().join(' L')
    return `M${topPath} L${bottomPath} Z`
  }

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      {/* Title */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ overflow: 'visible' }}
      >
        {/* Define gradients */}
        <defs>
          <linearGradient id="actualAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id="projectedAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const emissions = minEmissions + (emissionRange * percent) / 100
          const y = yScale(emissions)
          return (
            <g key={percent}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--glass-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-tertiary)"
                fontSize="12"
              >
                {Math.round(emissions).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Actual area */}
        {actualData.length > 0 && (
          <path
            d={createAreaPath(actualData)}
            fill="url(#actualAreaGradient)"
          />
        )}

        {/* Projected area */}
        {projectedData.length > 0 && (
          <path
            d={createAreaPath(projectedData)}
            fill="url(#projectedAreaGradient)"
          />
        )}

        {/* Actual line */}
        {actualData.length > 0 && (
          <path
            d={createPath(actualData)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Projected line */}
        {projectedData.length > 0 && (
          <path
            d={createPath(projectedData)}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="8 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {allPoints.map((point, index) => {
          const hasMilestone = point.milestone !== undefined

          return (
            <g key={index}>
              {/* Point circle */}
              <circle
                cx={xScale(point.year)}
                cy={yScale(point.emissions)}
                r={hasMilestone ? 8 : 5}
                fill="white"
                stroke={point.actual ? '#3b82f6' : '#10b981'}
                strokeWidth={hasMilestone ? 4 : 3}
              />

              {/* Year label */}
              <text
                x={xScale(point.year)}
                y={height - padding.bottom + 25}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="13"
                fontWeight={hasMilestone ? '600' : '400'}
              >
                {point.year}
              </text>

              {/* Milestone label */}
              {hasMilestone && (
                <>
                  <line
                    x1={xScale(point.year)}
                    y1={yScale(point.emissions) - 15}
                    x2={xScale(point.year)}
                    y2={yScale(point.emissions) - 35}
                    stroke={point.actual ? '#3b82f6' : '#10b981'}
                    strokeWidth="2"
                  />
                  <rect
                    x={xScale(point.year) - 60}
                    y={yScale(point.emissions) - 65}
                    width="120"
                    height="24"
                    fill={point.actual ? '#3b82f6' : '#10b981'}
                    rx="6"
                  />
                  <text
                    x={xScale(point.year)}
                    y={yScale(point.emissions) - 47}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {point.milestone}
                  </text>
                </>
              )}

              {/* Value label */}
              <text
                x={xScale(point.year)}
                y={yScale(point.emissions) + (hasMilestone ? 25 : 20)}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight="500"
              >
                {Math.round(point.emissions).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Y-axis label */}
        <text
          x={padding.left - 60}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="13"
          transform={`rotate(-90, ${padding.left - 60}, ${padding.top + chartHeight / 2})`}
        >
          Emissions ({unit})
        </text>

        {/* Title labels */}
        <text
          x={padding.left}
          y={padding.top - 30}
          fill="var(--text-tertiary)"
          fontSize="13"
          fontWeight="500"
        >
          Baseline: {baseline.year} ({Math.round(baseline.emissions).toLocaleString()} {unit})
        </text>
        <text
          x={width - padding.right}
          y={padding.top - 30}
          textAnchor="end"
          fill="var(--text-tertiary)"
          fontSize="13"
          fontWeight="500"
        >
          Target: {target.year} ({Math.round(target.emissions).toLocaleString()} {unit})
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '3px', background: '#3b82f6' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '3px', background: '#10b981', backgroundImage: 'repeating-linear-gradient(90deg, #10b981 0, #10b981 8px, transparent 8px, transparent 12px)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Projected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', border: '3px solid #3b82f6', borderRadius: '50%', background: 'white' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Milestone</span>
        </div>
      </div>
    </div>
  )
}
