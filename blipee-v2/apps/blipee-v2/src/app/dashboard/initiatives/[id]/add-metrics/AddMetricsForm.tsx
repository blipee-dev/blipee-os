/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, CheckCircle2, Target } from 'lucide-react'
import { addMetricToInitiative } from '@/app/actions/initiatives'
import type { InitiativeWithDetails } from '@/lib/types/initiatives'
import styles from '../../../gri/materiality/materiality.module.css'
import initiativesStyles from '../../initiatives.module.css'

interface AddMetricsFormProps {
  initiative: InitiativeWithDetails
  availableMetrics: Array<{
    code: string
    name: string
    description: string | null
    unit: string | null
    category: string | null
    subcategory: string | null
    gri_disclosure: string | null
    gri_disclosure_title: string | null
  }>
}

interface MetricFormData {
  metric_code: string
  target_value: string
  baseline_value: string
  baseline_date: string
  notes: string
}

export function AddMetricsForm({ initiative, availableMetrics }: AddMetricsFormProps) {
  const router = useRouter()
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set())
  const [metricData, setMetricData] = useState<Record<string, MetricFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out metrics already added to this initiative
  const existingMetricCodes = new Set(initiative.metrics?.map((m) => m.metric_code) || [])
  const filteredMetrics = availableMetrics.filter((m) => !existingMetricCodes.has(m.code))

  const handleMetricToggle = (code: string) => {
    const newSelected = new Set(selectedMetrics)
    if (newSelected.has(code)) {
      newSelected.delete(code)
      const newData = { ...metricData }
      delete newData[code]
      setMetricData(newData)
    } else {
      newSelected.add(code)
      setMetricData({
        ...metricData,
        [code]: {
          metric_code: code,
          target_value: '',
          baseline_value: '',
          baseline_date: '',
          notes: '',
        },
      })
    }
    setSelectedMetrics(newSelected)
  }

  const handleMetricDataChange = (code: string, field: keyof MetricFormData, value: string) => {
    setMetricData({
      ...metricData,
      [code]: {
        ...metricData[code],
        [field]: value,
      },
    })
  }

  const handleSubmit = async () => {
    if (selectedMetrics.size === 0) {
      setError('Please select at least one metric')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const promises = Array.from(selectedMetrics).map((code) => {
        const data = metricData[code]
        const metric = filteredMetrics.find((m) => m.code === code)

        return addMetricToInitiative(initiative.id, {
          metric_code: code,
          target_value: data.target_value ? parseFloat(data.target_value) : null,
          target_unit: metric?.unit || null,
          baseline_value: data.baseline_value ? parseFloat(data.baseline_value) : null,
          baseline_date: data.baseline_date || null,
          notes: data.notes || null,
        })
      })

      const results = await Promise.all(promises)
      const failed = results.filter((r) => !r.success)

      if (failed.length > 0) {
        setError(`Failed to add ${failed.length} metric(s)`)
      } else {
        router.push(`/dashboard/initiatives/${initiative.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionCard}>
        <button
          onClick={() => router.push(`/dashboard/initiatives/${initiative.id}`)}
          className={styles.backButton}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={16} />
          Back to {initiative.name}
        </button>

        <h1 className={styles.sectionTitle}>Add Metrics from Gap Analysis</h1>
        <p className={styles.sectionDescription}>
          Select metrics you marked as "Add to Tracking" in the Gap Analysis and define targets and baselines
        </p>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              marginTop: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {filteredMetrics.length === 0 ? (
          <div className={styles.emptyState} style={{ marginTop: '2rem' }}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No metrics available for tracking</p>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>
              Go to the Gap Analysis page and mark metrics as "Add to Tracking"
            </p>
            <button
              onClick={() => router.push('/dashboard/gri/materiality')}
              style={{ marginTop: '1rem' }}
              className={styles.exportButton}
            >
              Go to Gap Analysis
            </button>
          </div>
        ) : (
          <>
            {/* Selection Info */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={18} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                {selectedMetrics.size} metric(s) selected • {filteredMetrics.length} available
              </span>
            </div>

            {/* Metrics List */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMetrics.map((metric) => {
                const isSelected = selectedMetrics.has(metric.code)

                return (
                  <div
                    key={metric.code}
                    className={initiativesStyles.initiativeCard}
                    style={{
                      marginBottom: 0,
                      border: isSelected
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.05)' : undefined,
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      onClick={() => handleMetricToggle(metric.code)}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
                          background: isSelected ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <CheckCircle2 size={14} color="white" />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'rgba(255, 255, 255, 0.9)',
                            marginBottom: '4px',
                          }}
                        >
                          {metric.code} - {metric.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {metric.gri_disclosure && (
                            <span>
                              GRI {metric.gri_disclosure} •{' '}
                            </span>
                          )}
                          {metric.category && <span>{metric.category}</span>}
                          {metric.unit && <span> • Unit: {metric.unit}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Form */}
                    {isSelected && metricData[metric.code] && (
                      <div
                        style={{
                          padding: '16px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <label
                              className={styles.filterLabel}
                              style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
                            >
                              Target Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={metricData[metric.code].target_value}
                              onChange={(e) => handleMetricDataChange(metric.code, 'target_value', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={styles.filterSelect}
                              style={{ width: '100%', fontSize: '13px' }}
                              placeholder="e.g., 1000"
                            />
                          </div>

                          <div>
                            <label
                              className={styles.filterLabel}
                              style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
                            >
                              Baseline Value
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={metricData[metric.code].baseline_value}
                              onChange={(e) => handleMetricDataChange(metric.code, 'baseline_value', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={styles.filterSelect}
                              style={{ width: '100%', fontSize: '13px' }}
                              placeholder="e.g., 1500"
                            />
                          </div>

                          <div>
                            <label
                              className={styles.filterLabel}
                              style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
                            >
                              Baseline Date
                            </label>
                            <input
                              type="date"
                              value={metricData[metric.code].baseline_date}
                              onChange={(e) => handleMetricDataChange(metric.code, 'baseline_date', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={styles.filterSelect}
                              style={{ width: '100%', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          <label
                            className={styles.filterLabel}
                            style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
                          >
                            Notes
                          </label>
                          <textarea
                            value={metricData[metric.code].notes}
                            onChange={(e) => handleMetricDataChange(metric.code, 'notes', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={styles.filterSelect}
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              fontSize: '13px',
                            }}
                            placeholder="Additional notes or context for this metric..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedMetrics.size === 0}
                className={styles.exportButton}
                style={{ flex: 1 }}
              >
                <Plus size={18} />
                {isSubmitting ? 'Adding...' : `Add ${selectedMetrics.size} Metric(s)`}
              </button>
              <button
                onClick={() => router.push(`/dashboard/initiatives/${initiative.id}`)}
                className={styles.exportButton}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
