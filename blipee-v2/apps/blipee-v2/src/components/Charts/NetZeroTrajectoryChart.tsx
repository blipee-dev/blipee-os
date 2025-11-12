'use client'

import { useEffect, useRef, useState } from 'react'
import type { NetZeroTrajectoryData } from '@/lib/types/sbti-targets'

interface NetZeroTrajectoryChartProps {
  data: NetZeroTrajectoryData
  height?: number
}

export function NetZeroTrajectoryChart({ data, height = 500 }: NetZeroTrajectoryChartProps) {
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

  // Calculate scales
  const minYear = data.baseline.year
  const maxYear = data.netZero.year
  const yearRange = maxYear - minYear

  const xScale = (year: number) => {
    return padding.left + ((year - minYear) / yearRange) * chartWidth
  }

  const maxEmissions = Math.max(
    data.baseline.emissions,
    data.current.emissions,
    data.nearTerm.emissions
  )
  const minEmissions = Math.min(0, data.netZero.residualEmissions)

  const yScale = (emissions: number) => {
    const range = maxEmissions - minEmissions
    return padding.top + chartHeight - ((emissions - minEmissions) / range) * chartHeight
  }

  // Data points
  const points = [
    { year: data.baseline.year, emissions: data.baseline.emissions, label: 'Baseline' },
    { year: data.current.year, emissions: data.current.emissions, label: 'Current' },
    { year: data.nearTerm.year, emissions: data.nearTerm.emissions, label: 'Near-Term Target' },
    { year: data.netZero.year, emissions: data.netZero.residualEmissions, label: 'Net-Zero' },
  ]

  // Create path
  const createPath = () => {
    const pathPoints = points.map((p) => `${xScale(p.year)},${yScale(p.emissions)}`).join(' L')
    return `M${pathPoints}`
  }

  // Create area path
  const createAreaPath = () => {
    const topPath = points.map((p) => `${xScale(p.year)},${yScale(p.emissions)}`).join(' L')
    const bottomPath = points
      .map((p) => `${xScale(p.year)},${yScale(0)}`)
      .reverse()
      .join(' L')
    return `M${topPath} L${bottomPath} Z`
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #10b981 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          {data.targetName}
        </h2>
        {data.sbtiValidated && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ✓ SBTi Validated
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Chart */}
        <div>
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            style={{ overflow: 'visible' }}
          >
            {/* Define gradients */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.1 }} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#60a5fa' }} />
                <stop offset="50%" style={{ stopColor: '#3b82f6' }} />
                <stop offset="100%" style={{ stopColor: '#10b981' }} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => {
              const emissions = (maxEmissions * percent) / 100
              const y = yScale(emissions)
              return (
                <g key={percent}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="rgba(255, 255, 255, 0.6)"
                    fontSize="12"
                  >
                    {Math.round(emissions).toLocaleString()}
                  </text>
                </g>
              )
            })}

            {/* Area */}
            <path
              d={createAreaPath()}
              fill="url(#areaGradient)"
            />

            {/* Line */}
            <path
              d={createPath()}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                {/* Point circle */}
                <circle
                  cx={xScale(point.year)}
                  cy={yScale(point.emissions)}
                  r="6"
                  fill="white"
                  stroke={index === points.length - 1 ? '#10b981' : '#3b82f6'}
                  strokeWidth="3"
                />

                {/* Year label */}
                <text
                  x={xScale(point.year)}
                  y={height - padding.bottom + 30}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="600"
                >
                  {point.year}
                </text>

                {/* Value label */}
                <text
                  x={xScale(point.year)}
                  y={yScale(point.emissions) - 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="500"
                >
                  {Math.round(point.emissions).toLocaleString()}
                </text>
              </g>
            ))}

            {/* Reduction percentages */}
            <g>
              {/* Near-term reduction */}
              <text
                x={xScale(data.nearTerm.year)}
                y={yScale((data.baseline.emissions + data.nearTerm.emissions) / 2)}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="32"
                fontWeight="700"
              >
                {data.nearTerm.reductionPercent.scope1_2}%
              </text>
              <text
                x={xScale(data.nearTerm.year)}
                y={yScale((data.baseline.emissions + data.nearTerm.emissions) / 2) + 25}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                opacity="0.9"
              >
                reduction in Scope 1+2
              </text>
              <text
                x={xScale(data.nearTerm.year)}
                y={yScale((data.baseline.emissions + data.nearTerm.emissions) / 2) + 40}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                opacity="0.9"
              >
                by {data.nearTerm.year}
              </text>
            </g>

            {/* Net-Zero label */}
            <g>
              <text
                x={xScale(data.netZero.year)}
                y={yScale(data.netZero.residualEmissions) + 40}
                textAnchor="middle"
                fill="#10b981"
                fontSize="18"
                fontWeight="700"
              >
                Net-Zero
              </text>
            </g>

            {/* Y-axis label */}
            <text
              x={padding.left - 60}
              y={padding.top + chartHeight / 2}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="13"
              transform={`rotate(-90, ${padding.left - 60}, ${padding.top + chartHeight / 2})`}
            >
              GHG Emissions (tCO2e)
            </text>
          </svg>
        </div>

        {/* Actions & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Actions */}
          {data.actions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Key Actions to Achieve Target
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.actions.map((action, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: '1.5' }}>
                    <span style={{ color: '#10b981', flexShrink: 0 }}>●</span>
                    <span style={{ opacity: 0.9 }}>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Carbon Credits Note */}
          {data.carbonCreditsNote && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#10b981' }}>
                A note on carbon credits
              </h4>
              <p style={{ fontSize: '12px', lineHeight: '1.5', opacity: 0.9, margin: 0 }}>
                {data.carbonCreditsNote}
              </p>
            </div>
          )}

          {/* Scope breakdown */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Baseline Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ opacity: 0.8 }}>Scope 1</span>
                <span style={{ fontWeight: 600 }}>{data.baseline.scope1.toLocaleString()} tCO2e</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ opacity: 0.8 }}>Scope 2</span>
                <span style={{ fontWeight: 600 }}>{data.baseline.scope2.toLocaleString()} tCO2e</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ opacity: 0.8 }}>Scope 3</span>
                <span style={{ fontWeight: 600 }}>{data.baseline.scope3.toLocaleString()} tCO2e</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 700,
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span>Total</span>
                <span>{data.baseline.emissions.toLocaleString()} tCO2e</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
