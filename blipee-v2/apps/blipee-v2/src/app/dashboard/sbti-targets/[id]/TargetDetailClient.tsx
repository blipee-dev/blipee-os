'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, CheckCircle, Calendar, TrendingDown, Target as TargetIcon } from 'lucide-react'
import type { TargetWithProgress, NetZeroTrajectoryData } from '@/lib/types/sbti-targets'
import { NetZeroTrajectoryChart } from '@/components/Charts/NetZeroTrajectoryChart'
import { WaterfallChart, type WaterfallItem } from '@/components/Charts/WaterfallChart'
import { ProgressTimelineChart, type TimelineDataPoint } from '@/components/Charts/ProgressTimelineChart'
import { ScopeBreakdownChart, type ScopeData } from '@/components/Charts/ScopeBreakdownChart'

interface TargetDetailClientProps {
  target: TargetWithProgress
}

export function TargetDetailClient({ target }: TargetDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'trajectory' | 'analytics' | 'validation' | 'governance'>('trajectory')

  // Prepare trajectory data
  const trajectoryData: NetZeroTrajectoryData = {
    baseline: {
      year: target.baseline_year,
      emissions: target.baseline_emissions || target.baseline_value,
      scope1: target.baseline_scope_1 || 0,
      scope2: target.baseline_scope_2 || 0,
      scope3: target.baseline_scope_3 || 0,
    },
    current: {
      year: target.current_emissions_date
        ? new Date(target.current_emissions_date).getFullYear()
        : new Date().getFullYear(),
      emissions: target.current_emissions || target.baseline_emissions || target.baseline_value,
    },
    nearTerm: {
      year: target.target_year,
      emissions: target.target_emissions || target.target_value,
      reductionPercent: {
        scope1_2: target.target_reduction_percent || 50,
        scope3: target.scope_3_coverage_percent || undefined,
      },
    },
    netZero: {
      year: target.net_zero_date || target.target_year + 20,
      residualEmissions: 0,
    },
    actions: [
      'Improving energy efficiency',
      'Transitioning to renewable electricity',
      'Decarbonizing thermal energy in manufacturing',
      'Deploying low-carbon fleet solutions',
      'Sourcing ingredients in accordance with guidelines',
      'Reducing packaging and enhancing circularity',
    ],
    carbonCreditsNote: target.bvcm_commitment ||
      'We plan to achieve net-zero by 2050 by working towards significant emissions reduction across our value chain first. Any residual emissions will be addressed through limited use of carbon credits at the end of our net-zero journey generated beyond our value chain.',
    targetName: target.name,
    sbtiValidated: target.sbti_validated || false,
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Targets
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
              {target.name}
            </h1>
            {target.description && (
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '800px' }}>
                {target.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          {target.sbti_validated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#10b981',
              }}
            >
              <CheckCircle size={16} />
              SBTi Validated
            </div>
          )}
          {target.sbti_ambition && (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#6366f1',
              }}
            >
              🌡️ {target.sbti_ambition}
            </div>
          )}
          {target.net_zero_date && (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#10b981',
              }}
            >
              ♻️ Net-Zero {target.net_zero_date}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Calendar size={20} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Baseline ({target.baseline_year})</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {(target.baseline_emissions || target.baseline_value).toLocaleString()}{' '}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {target.baseline_unit}
            </span>
          </div>
        </div>

        {target.current_emissions && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <TargetIcon size={20} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                Current ({new Date().getFullYear()})
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {target.current_emissions.toLocaleString()}{' '}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {target.baseline_unit}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingDown size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Target ({target.target_year})</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            {(target.target_emissions || target.target_value).toLocaleString()}{' '}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {target.target_unit}
            </span>
          </div>
          {target.target_reduction_percent && (
            <div style={{ fontSize: '14px', color: '#10b981', marginTop: '4px' }}>
              {target.target_reduction_percent}% reduction
            </div>
          )}
        </div>

        {target.progress_percent !== null && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
              Progress
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(target.progress_percent)}%
            </div>
            {target.progress_status && (
              <div
                style={{
                  fontSize: '13px',
                  color:
                    target.progress_status === 'on_track'
                      ? '#10b981'
                      : target.progress_status === 'at_risk'
                        ? '#f59e0b'
                        : '#ef4444',
                  marginTop: '4px',
                  textTransform: 'capitalize',
                }}
              >
                {target.progress_status.replace('_', ' ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'trajectory', label: 'Net-Zero Trajectory' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'overview', label: 'Overview' },
            { id: 'validation', label: 'SBTi Validation' },
            { id: 'governance', label: 'Governance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--green)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'trajectory' && (
          <div>
            <NetZeroTrajectoryChart data={trajectoryData} height={500} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Scope Breakdown */}
            <ScopeBreakdownChart
              data={{
                scope1: target.baseline_scope_1 || 0,
                scope2: target.baseline_scope_2 || 0,
                scope3: target.baseline_scope_3 || 0,
              }}
              title="Baseline Emissions by Scope"
              unit="tCO2e"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
              {/* Waterfall Chart */}
              <WaterfallChart
                data={[
                  {
                    label: 'Baseline',
                    value: target.baseline_emissions || target.baseline_value,
                    isTotal: true,
                  },
                  {
                    label: 'Energy Efficiency',
                    value: -((target.baseline_emissions || target.baseline_value) * 0.15),
                  },
                  {
                    label: 'Renewable Energy',
                    value: -((target.baseline_emissions || target.baseline_value) * 0.2),
                  },
                  {
                    label: 'Process Optimization',
                    value: -((target.baseline_emissions || target.baseline_value) * 0.1),
                  },
                  {
                    label: 'Supply Chain',
                    value: -((target.baseline_emissions || target.baseline_value) * 0.05),
                  },
                  {
                    label: 'Target',
                    value: (target.target_emissions || target.target_value) - (target.baseline_emissions || target.baseline_value),
                    isTotal: true,
                  },
                ]}
                title="Emission Reduction Breakdown"
                unit="tCO2e"
                height={400}
              />

              {/* Progress Timeline */}
              <ProgressTimelineChart
                data={[
                  {
                    year: target.baseline_year + Math.floor((target.target_year - target.baseline_year) * 0.33),
                    emissions: target.baseline_emissions
                      ? target.baseline_emissions - (target.baseline_emissions - (target.target_emissions || target.target_value)) * 0.2
                      : target.baseline_value - (target.baseline_value - target.target_value) * 0.2,
                    actual: true,
                  },
                  {
                    year: target.baseline_year + Math.floor((target.target_year - target.baseline_year) * 0.66),
                    emissions: target.baseline_emissions
                      ? target.baseline_emissions - (target.baseline_emissions - (target.target_emissions || target.target_value)) * 0.5
                      : target.baseline_value - (target.baseline_value - target.target_value) * 0.5,
                    actual: true,
                    milestone: 'Mid-term checkpoint',
                  },
                  {
                    year: target.target_year,
                    emissions: target.target_emissions || target.target_value,
                    actual: false,
                    milestone: 'Target achieved',
                  },
                ]}
                baseline={{
                  year: target.baseline_year,
                  emissions: target.baseline_emissions || target.baseline_value,
                }}
                target={{
                  year: target.target_year,
                  emissions: target.target_emissions || target.target_value,
                }}
                title="Emissions Progress Timeline"
                unit="tCO2e"
                height={400}
              />
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              Target Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  Target Type
                </div>
                <div style={{ fontSize: '16px', fontWeight: 500, textTransform: 'capitalize' }}>
                  {target.target_type}
                </div>
              </div>

              {target.methodology && (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Methodology
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>
                    {target.methodology}
                  </div>
                </div>
              )}

              {target.scopes && target.scopes.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Scopes Covered
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {target.scopes.map((scope) => (
                      <span
                        key={scope}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#3b82f6',
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {target.categories && target.categories.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Categories
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {target.categories.map((category) => (
                      <span
                        key={category}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#10b981',
                          textTransform: 'capitalize',
                        }}
                      >
                        {category.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {target.assumptions && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Assumptions
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {target.assumptions}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              SBTi Validation Status
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>SBTi Validated</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.sbti_validated ? '#10b981' : '#6b7280' }}>
                  {target.sbti_validated ? '✓ Yes' : '✗ No'}
                </span>
              </div>

              {target.sbti_validation_date && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '15px' }}>Validation Date</span>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>
                    {new Date(target.sbti_validation_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>Submitted to SBTi</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.sbti_submission_date ? '#3b82f6' : '#6b7280' }}>
                  {target.sbti_submission_date ? '✓ Yes' : '✗ No'}
                </span>
              </div>

              {target.sbti_submission_date && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '15px' }}>Submission Date</span>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>
                    {new Date(target.sbti_submission_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>Ready for Submission</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.sbti_submission_ready ? '#10b981' : '#6b7280' }}>
                  {target.sbti_submission_ready ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'governance' && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              Governance & Approvals
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>Board Approval</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.board_approval ? '#10b981' : '#6b7280' }}>
                  {target.board_approval ? '✓ Approved' : '✗ Pending'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>Public Commitment</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.public_commitment ? '#10b981' : '#6b7280' }}>
                  {target.public_commitment ? '✓ Made' : '✗ Not Made'}
                </span>
              </div>

              {target.commitment_url && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '15px' }}>Commitment URL</span>
                  <a
                    href={target.commitment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none' }}
                  >
                    View Commitment
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '15px' }}>GHG Inventory Complete</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: target.ghg_inventory_complete ? '#10b981' : '#6b7280' }}>
                  {target.ghg_inventory_complete ? '✓ Complete' : '✗ Incomplete'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
