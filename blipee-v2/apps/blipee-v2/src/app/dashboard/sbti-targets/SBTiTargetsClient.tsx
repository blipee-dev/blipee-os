'use client'

import { useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import type { TargetWithProgress, TargetSummary } from '@/lib/types/sbti-targets'
import { SummaryCards } from './SummaryCards'
import { TargetCard } from './TargetCard'
import { CreateTargetModal } from './CreateTargetModal'

interface SBTiTargetsClientProps {
  initialTargets: TargetWithProgress[]
  summary: TargetSummary
}

export function SBTiTargetsClient({ initialTargets, summary }: SBTiTargetsClientProps) {
  const [targets, setTargets] = useState(initialTargets)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter targets
  const filteredTargets = targets.filter((target) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'validated') return target.sbti_validated
    if (filterStatus === 'submitted') return target.sbti_submission_date && !target.sbti_validated
    if (filterStatus === 'draft') return !target.sbti_submission_date
    if (filterStatus === 'net-zero') return target.net_zero_date !== null
    return true
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
              SBTi Targets
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Science-Based Targets aligned with Paris Agreement goals
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Plus size={20} />
            New Target
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ marginBottom: '32px' }}>
        <SummaryCards summary={summary} />
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
            <Filter size={18} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Filter:</span>
          </div>
          {[
            { value: 'all', label: 'All Targets' },
            { value: 'validated', label: 'Validated' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'draft', label: 'Draft' },
            { value: 'net-zero', label: 'Net-Zero' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid var(--glass-border)',
                background: filterStatus === filter.value ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                color: filterStatus === filter.value ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== filter.value) {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Targets List */}
      {filteredTargets.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            No targets found
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {filterStatus === 'all'
              ? 'Get started by creating your first Science-Based Target'
              : `No targets with "${filterStatus}" status`}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '12px 24px',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create First Target
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredTargets.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateTargetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newTarget) => {
          setTargets([newTarget, ...targets])
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
