'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, Calendar, TrendingDown, Target as TargetIcon, ArrowRight } from 'lucide-react'
import type { TargetWithProgress } from '@/lib/types/sbti-targets'

interface TargetCardProps {
  target: TargetWithProgress
}

export function TargetCard({ target }: TargetCardProps) {
  const router = useRouter()

  // Status badge
  const getStatusBadge = () => {
    if (target.sbti_validated) {
      return {
        label: 'SBTi Validated',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        icon: '✓',
      }
    } else if (target.sbti_submission_date) {
      return {
        label: 'Submitted',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        icon: '📝',
      }
    } else if (target.sbti_submission_ready) {
      return {
        label: 'Ready to Submit',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        icon: '⏳',
      }
    } else {
      return {
        label: 'In Development',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.15)',
        icon: '💡',
      }
    }
  }

  const statusBadge = getStatusBadge()

  // Progress status
  const getProgressColor = () => {
    if (!target.progress_status) return '#6b7280'
    switch (target.progress_status) {
      case 'on_track':
        return '#10b981'
      case 'at_risk':
        return '#f59e0b'
      case 'off_track':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const progressColor = getProgressColor()

  return (
    <div
      onClick={() => router.push(`/dashboard/sbti-targets/${target.id}`)}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {target.name}
            </h3>
            {target.description && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {target.description.length > 100
                  ? target.description.substring(0, 100) + '...'
                  : target.description}
              </p>
            )}
          </div>
          <ArrowRight size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginLeft: '12px' }} />
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: statusBadge.bgColor,
              color: statusBadge.color,
            }}
          >
            <span>{statusBadge.icon}</span>
            {statusBadge.label}
          </span>

          {target.sbti_ambition && (
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
              }}
            >
              🌡️ {target.sbti_ambition}
            </span>
          )}

          {target.net_zero_date && (
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              ♻️ Net-Zero {target.net_zero_date}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          paddingTop: '20px',
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        {/* Baseline */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Baseline ({target.baseline_year})</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {target.baseline_emissions?.toLocaleString() || target.baseline_value.toLocaleString()}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {target.baseline_unit}
            </span>
          </div>
        </div>

        {/* Current */}
        {target.current_emissions !== null && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <TargetIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Current ({new Date().getFullYear()})
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {target.current_emissions.toLocaleString()}{' '}
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {target.baseline_unit}
              </span>
            </div>
          </div>
        )}

        {/* Target */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <TrendingDown size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Target ({target.target_year})</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>
            {target.target_emissions?.toLocaleString() || target.target_value.toLocaleString()}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {target.target_unit}
            </span>
          </div>
          {target.target_reduction_percent && (
            <div style={{ fontSize: '13px', color: '#10b981', marginTop: '2px' }}>
              {target.target_reduction_percent}% reduction
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {target.progress_percent !== null && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Progress</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: progressColor }}>
              {Math.round(target.progress_percent)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(target.progress_percent, 100)}%`,
                height: '100%',
                background: progressColor,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {target.progress_status && (
            <div style={{ fontSize: '12px', color: progressColor, marginTop: '6px', textTransform: 'capitalize' }}>
              {target.progress_status.replace('_', ' ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
