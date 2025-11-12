'use client'

import { useEffect, useRef, useState } from 'react'

export interface WaterfallItem {
  label: string
  value: number
  isTotal?: boolean
}

interface WaterfallChartProps {
  data: WaterfallItem[]
  title?: string
  unit?: string
  height?: number
}

export function WaterfallChart({
  data,
  title = 'Emission Reductions Breakdown',
  unit = 'tCO2e',
  height = 400
}: WaterfallChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height })

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect()
        setDimensions({ width: width || 800, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [height])

  const { width } = dimensions
  const padding = { top: 80, right: 40, bottom: 100, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate cumulative values
  const items = data.map((item, index) => {
    const previousTotal = data.slice(0, index).reduce((sum, d) => sum + d.value, 0)
    return {
      ...item,
      start: previousTotal,
      end: previousTotal + item.value,
    }
  })

  // Calculate scales
  const maxValue = Math.max(...items.map(item => Math.max(item.start, item.end)))
  const minValue = Math.min(0, ...items.map(item => Math.min(item.start, item.end)))
  const valueRange = maxValue - minValue

  const yScale = (value: number) => {
    return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight
  }

  const barWidth = chartWidth / (data.length + 1)
  const barPadding = barWidth * 0.2

  const xPosition = (index: number) => {
    return padding.left + (index + 0.5) * barWidth
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
          <linearGradient id="positiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="totalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const value = minValue + (valueRange * percent) / 100
          const y = yScale(value)
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
                {Math.round(value).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {items.map((item, index) => {
          const x = xPosition(index)
          const barStartY = yScale(item.start)
          const barEndY = yScale(item.end)
          const barHeight = Math.abs(barEndY - barStartY)
          const isPositive = item.value >= 0
          const isTotal = item.isTotal

          let fillColor = isTotal ? 'url(#totalGradient)' : isPositive ? 'url(#positiveGradient)' : 'url(#negativeGradient)'

          return (
            <g key={index}>
              {/* Connection line from previous bar */}
              {index > 0 && !isTotal && (
                <line
                  x1={xPosition(index - 1)}
                  y1={yScale(items[index - 1].end)}
                  x2={x}
                  y2={yScale(item.start)}
                  stroke="var(--text-tertiary)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              )}

              {/* Bar */}
              <rect
                x={x - (barWidth - barPadding) / 2}
                y={Math.min(barStartY, barEndY)}
                width={barWidth - barPadding}
                height={barHeight}
                fill={fillColor}
                stroke="none"
                rx="4"
                style={{
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              />

              {/* Value label */}
              <text
                x={x}
                y={Math.min(barStartY, barEndY) - 10}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="13"
                fontWeight="600"
              >
                {item.value > 0 ? '+' : ''}{Math.round(item.value).toLocaleString()}
              </text>

              {/* Label */}
              <text
                x={x}
                y={height - padding.bottom + 20}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="12"
                fontWeight={isTotal ? '600' : '400'}
                transform={`rotate(-45, ${x}, ${height - padding.bottom + 20})`}
              >
                {item.label}
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
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: 'linear-gradient(to bottom, #10b981, #059669)', borderRadius: '4px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Reduction</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: 'linear-gradient(to bottom, #ef4444, #dc2626)', borderRadius: '4px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Increase</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', borderRadius: '4px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total</span>
        </div>
      </div>
    </div>
  )
}
