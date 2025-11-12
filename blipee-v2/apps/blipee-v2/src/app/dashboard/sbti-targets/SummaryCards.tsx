'use client'

import { CheckCircle, FileText, Send, Target, TrendingUp, AlertTriangle, XCircle } from 'lucide-react'
import type { TargetSummary } from '@/lib/types/sbti-targets'

interface SummaryCardsProps {
  summary: TargetSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      icon: CheckCircle,
      label: 'SBTi Validated',
      value: summary.validated_targets,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: Send,
      label: 'Submitted',
      value: summary.submitted_targets,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: FileText,
      label: 'In Draft',
      value: summary.draft_targets,
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
    },
    {
      icon: Target,
      label: 'Active Targets',
      value: summary.active_targets,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ]

  const progressCards = [
    {
      icon: TrendingUp,
      label: 'On Track',
      value: summary.on_track_count,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: AlertTriangle,
      label: 'At Risk',
      value: summary.at_risk_count,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      icon: XCircle,
      label: 'Off Track',
      value: summary.off_track_count,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
  ]

  return (
    <div>
      {/* Main Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: card.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <card.icon size={24} style={{ color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {progressCards.map((card, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <card.icon size={20} style={{ color: card.color }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}

        {/* Coverage Stats */}
        {(summary.scope_1_2_coverage !== null || summary.scope_3_coverage !== null) && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '16px',
              gridColumn: 'span 1',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
              Coverage
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {summary.scope_1_2_coverage !== null && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Scope 1+2</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#10b981' }}>
                    {summary.scope_1_2_coverage}%
                  </div>
                </div>
              )}
              {summary.scope_3_coverage !== null && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Scope 3</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b82f6' }}>
                    {summary.scope_3_coverage}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
