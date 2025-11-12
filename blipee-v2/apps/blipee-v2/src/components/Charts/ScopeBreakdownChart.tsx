'use client'

import { useEffect, useRef, useState } from 'react'

export interface ScopeData {
  scope1: number
  scope2: number
  scope3: number
}

interface ScopeBreakdownChartProps {
  data: ScopeData
  title?: string
  unit?: string
  size?: number
  showPercentages?: boolean
}

export function ScopeBreakdownChart({
  data,
  title = 'Emissions by Scope',
  unit = 'tCO2e',
  size = 300,
  showPercentages = true
}: ScopeBreakdownChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const total = data.scope1 + data.scope2 + data.scope3

  const scopes = [
    {
      name: 'Scope 1',
      value: data.scope1,
      color: '#ef4444',
      description: 'Direct emissions',
    },
    {
      name: 'Scope 2',
      value: data.scope2,
      color: '#f59e0b',
      description: 'Indirect emissions from energy',
    },
    {
      name: 'Scope 3',
      value: data.scope3,
      color: '#3b82f6',
      description: 'Other indirect emissions',
    },
  ]

  const center = size / 2
  const radius = (size / 2) - 20
  const innerRadius = radius * 0.6

  // Calculate angles for each segment
  let currentAngle = -Math.PI / 2 // Start at top
  const segments = scopes.map((scope) => {
    const percentage = (scope.value / total) * 100
    const angleSize = (percentage / 100) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angleSize
    currentAngle = endAngle

    return {
      ...scope,
      percentage,
      startAngle,
      endAngle,
    }
  })

  // Function to create donut path
  const createDonutPath = (startAngle: number, endAngle: number, isHovered: boolean) => {
    const outerRadius = isHovered ? radius + 5 : radius
    const inner = innerRadius

    const x1 = center + outerRadius * Math.cos(startAngle)
    const y1 = center + outerRadius * Math.sin(startAngle)
    const x2 = center + outerRadius * Math.cos(endAngle)
    const y2 = center + outerRadius * Math.sin(endAngle)
    const x3 = center + inner * Math.cos(endAngle)
    const y3 = center + inner * Math.sin(endAngle)
    const x4 = center + inner * Math.cos(startAngle)
    const y4 = center + inner * Math.sin(startAngle)

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    return `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `
  }

  // Calculate label position
  const getLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2
    const labelRadius = (radius + innerRadius) / 2
    return {
      x: center + labelRadius * Math.cos(midAngle),
      y: center + labelRadius * Math.sin(midAngle),
    }
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
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)', textAlign: 'center' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
        {/* Chart */}
        <div style={{ position: 'relative' }}>
          <svg width={size} height={size} style={{ overflow: 'visible' }}>
            {/* Donut segments */}
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createDonutPath(segment.startAngle, segment.endAngle, hoveredSegment === segment.name)}
                fill={segment.color}
                stroke="var(--bg-secondary)"
                strokeWidth="2"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setHoveredSegment(segment.name)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            ))}

            {/* Percentage labels */}
            {showPercentages && segments.map((segment, index) => {
              const labelPos = getLabelPosition(segment.startAngle, segment.endAngle)
              return (
                <text
                  key={index}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="16"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {segment.percentage.toFixed(1)}%
                </text>
              )
            })}

            {/* Center text */}
            <text
              x={center}
              y={center - 10}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="24"
              fontWeight="700"
            >
              {total.toLocaleString()}
            </text>
            <text
              x={center}
              y={center + 15}
              textAnchor="middle"
              fill="var(--text-tertiary)"
              fontSize="13"
            >
              {unit}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {scopes.map((scope, index) => {
            const segment = segments[index]
            const isHovered = hoveredSegment === scope.name

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredSegment(scope.name)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isHovered ? 'var(--glass-bg)' : 'transparent',
                  border: '1px solid',
                  borderColor: isHovered ? 'var(--glass-border)' : 'transparent',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {/* Color indicator */}
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: scope.color,
                    flexShrink: 0,
                  }}
                />

                {/* Scope info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {scope.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {scope.description}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {scope.value.toLocaleString()} {unit}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      ({segment.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total summary */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '16px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Total Emissions
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {total.toLocaleString()} {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
