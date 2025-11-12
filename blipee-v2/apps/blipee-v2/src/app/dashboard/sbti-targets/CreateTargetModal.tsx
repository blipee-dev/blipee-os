'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTarget } from '@/app/actions/sbti-targets'
import type { SustainabilityTarget } from '@/lib/types/sbti-targets'
import { BlipeeModal } from '@/components/ui/BlipeeModal'
import { BlipeeModalFooter, type FooterButton } from '@/components/ui/BlipeeModalFooter'
import styles from '@/styles/settings-layout.module.css'

interface CreateTargetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (target: SustainabilityTarget) => void
}

export function CreateTargetModal({ isOpen, onClose, onSuccess }: CreateTargetModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'baseline' | 'target' | 'sbti'>('basic')

  const [formData, setFormData] = useState({
    // Basic
    name: '',
    description: '',
    target_type: 'emissions',

    // Baseline
    baseline_year: new Date().getFullYear() - 1,
    baseline_value: '',
    baseline_unit: 'tCO2e',
    baseline_emissions: '',
    baseline_scope_1: '',
    baseline_scope_2: '',
    baseline_scope_3: '',

    // Target
    target_year: 2030,
    target_value: '',
    target_unit: 'tCO2e',
    target_reduction_percent: '',
    annual_reduction_rate: '',

    // SBTi
    is_science_based: true,
    sbti_ambition: '1.5C',
    scope_1_2_coverage_percent: '95',
    scope_3_coverage_percent: '',
    ghg_inventory_complete: false,
    board_approval: false,
    public_commitment: false,
    net_zero_date: '',
  })

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const result = await createTarget({
        name: formData.name,
        description: formData.description || null,
        target_type: formData.target_type,

        // Baseline
        baseline_year: formData.baseline_year,
        baseline_value: parseFloat(formData.baseline_value),
        baseline_unit: formData.baseline_unit,
        baseline_emissions: formData.baseline_emissions ? parseFloat(formData.baseline_emissions) : null,
        baseline_scope_1: formData.baseline_scope_1 ? parseFloat(formData.baseline_scope_1) : null,
        baseline_scope_2: formData.baseline_scope_2 ? parseFloat(formData.baseline_scope_2) : null,
        baseline_scope_3: formData.baseline_scope_3 ? parseFloat(formData.baseline_scope_3) : null,

        // Target
        target_year: formData.target_year,
        target_value: parseFloat(formData.target_value),
        target_unit: formData.target_unit,
        target_reduction_percent: formData.target_reduction_percent
          ? parseFloat(formData.target_reduction_percent)
          : null,
        annual_reduction_rate: formData.annual_reduction_rate
          ? parseFloat(formData.annual_reduction_rate)
          : null,

        // SBTi
        is_science_based: formData.is_science_based,
        sbti_ambition: formData.sbti_ambition,
        scope_1_2_coverage_percent: formData.scope_1_2_coverage_percent
          ? parseFloat(formData.scope_1_2_coverage_percent)
          : null,
        scope_3_coverage_percent: formData.scope_3_coverage_percent
          ? parseFloat(formData.scope_3_coverage_percent)
          : null,
        ghg_inventory_complete: formData.ghg_inventory_complete,
        board_approval: formData.board_approval,
        public_commitment: formData.public_commitment,
        net_zero_date: formData.net_zero_date ? parseInt(formData.net_zero_date) : null,
        target_status: 'draft',
      })

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          target_type: 'emissions',
          baseline_year: new Date().getFullYear() - 1,
          baseline_value: '',
          baseline_unit: 'tCO2e',
          baseline_emissions: '',
          baseline_scope_1: '',
          baseline_scope_2: '',
          baseline_scope_3: '',
          target_year: 2030,
          target_value: '',
          target_unit: 'tCO2e',
          target_reduction_percent: '',
          annual_reduction_rate: '',
          is_science_based: true,
          sbti_ambition: '1.5C',
          scope_1_2_coverage_percent: '95',
          scope_3_coverage_percent: '',
          ghg_inventory_complete: false,
          board_approval: false,
          public_commitment: false,
          net_zero_date: '',
        })
        onSuccess?.(result.data)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  const rightButtons: FooterButton[] = [
    {
      label: 'Cancel',
      onClick: handleCancel,
      variant: 'secondary',
      disabled: isSaving,
    },
    {
      label: 'Create Target',
      onClick: handleSave,
      variant: 'primary',
      disabled: !formData.name.trim() || !formData.baseline_value || !formData.target_value || isSaving,
      loading: isSaving,
    },
  ]

  return (
    <BlipeeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create SBTi Target"
      subtitle="Define a new Science-Based Target aligned with Paris Agreement"
      maxWidth="800px"
      footer={<BlipeeModalFooter rightButtons={rightButtons} />}
    >
      <div className={styles.section}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              marginBottom: '1.5rem',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'baseline', label: 'Baseline' },
            { id: 'target', label: 'Target' },
            { id: 'sbti', label: 'SBTi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--green)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.form}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Target Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  placeholder="e.g., Scope 1+2 Near-Term (2030)"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Describe the target scope and objectives..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Target Type</label>
                <select
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                  className={styles.select}
                >
                  <option value="emissions">GHG Emissions</option>
                  <option value="energy">Energy</option>
                  <option value="renewable">Renewable Energy</option>
                  <option value="intensity">Emissions Intensity</option>
                </select>
              </div>
            </>
          )}

          {/* Baseline Tab */}
          {activeTab === 'baseline' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Baseline Year <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.baseline_year}
                    onChange={(e) => setFormData({ ...formData, baseline_year: parseInt(e.target.value) })}
                    className={styles.input}
                    min="2000"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Baseline Value <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.baseline_value}
                    onChange={(e) => setFormData({ ...formData, baseline_value: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., 10000"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Unit</label>
                <select
                  value={formData.baseline_unit}
                  onChange={(e) => setFormData({ ...formData, baseline_unit: e.target.value })}
                  className={styles.select}
                >
                  <option value="tCO2e">tCO2e</option>
                  <option value="MWh">MWh</option>
                  <option value="GJ">GJ</option>
                  <option value="tCO2e/revenue">tCO2e/revenue</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Scope 1 (tCO2e)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_scope_1}
                    onChange={(e) => setFormData({ ...formData, baseline_scope_1: e.target.value })}
                    className={styles.input}
                    placeholder="Optional"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Scope 2 (tCO2e)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_scope_2}
                    onChange={(e) => setFormData({ ...formData, baseline_scope_2: e.target.value })}
                    className={styles.input}
                    placeholder="Optional"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Scope 3 (tCO2e)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_scope_3}
                    onChange={(e) => setFormData({ ...formData, baseline_scope_3: e.target.value })}
                    className={styles.input}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          )}

          {/* Target Tab */}
          {activeTab === 'target' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Target Year <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.target_year}
                    onChange={(e) => setFormData({ ...formData, target_year: parseInt(e.target.value) })}
                    className={styles.input}
                    min={new Date().getFullYear()}
                    max="2100"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Target Value <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., 4200"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Reduction (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.target_reduction_percent}
                    onChange={(e) => setFormData({ ...formData, target_reduction_percent: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., 50"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Percentage reduction from baseline
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Annual Reduction Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.annual_reduction_rate}
                    onChange={(e) => setFormData({ ...formData, annual_reduction_rate: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., 4.2"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Annual linear reduction rate
                  </p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Net-Zero Target Year (Optional)</label>
                <input
                  type="number"
                  value={formData.net_zero_date}
                  onChange={(e) => setFormData({ ...formData, net_zero_date: e.target.value })}
                  className={styles.input}
                  min={formData.target_year}
                  max="2100"
                  placeholder="e.g., 2050"
                />
              </div>
            </>
          )}

          {/* SBTi Tab */}
          {activeTab === 'sbti' && (
            <>
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_science_based}
                    onChange={(e) => setFormData({ ...formData, is_science_based: e.target.checked })}
                  />
                  <span className={styles.label}>Science-Based Target</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>SBTi Ambition Level</label>
                <select
                  value={formData.sbti_ambition}
                  onChange={(e) => setFormData({ ...formData, sbti_ambition: e.target.value })}
                  className={styles.select}
                >
                  <option value="1.5C">1.5°C</option>
                  <option value="well-below-2C">Well-Below 2°C</option>
                  <option value="net-zero">Net-Zero</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Scope 1+2 Coverage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.scope_1_2_coverage_percent}
                    onChange={(e) => setFormData({ ...formData, scope_1_2_coverage_percent: e.target.value })}
                    className={styles.input}
                    min="0"
                    max="100"
                    placeholder="e.g., 95"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Scope 3 Coverage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.scope_3_coverage_percent}
                    onChange={(e) => setFormData({ ...formData, scope_3_coverage_percent: e.target.value })}
                    className={styles.input}
                    min="0"
                    max="100"
                    placeholder="e.g., 67"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.ghg_inventory_complete}
                    onChange={(e) => setFormData({ ...formData, ghg_inventory_complete: e.target.checked })}
                  />
                  <span className={styles.label}>GHG Inventory Complete</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.board_approval}
                    onChange={(e) => setFormData({ ...formData, board_approval: e.target.checked })}
                  />
                  <span className={styles.label}>Board Approval Obtained</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.public_commitment}
                    onChange={(e) => setFormData({ ...formData, public_commitment: e.target.checked })}
                  />
                  <span className={styles.label}>Public Commitment Made</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </BlipeeModal>
  )
}
