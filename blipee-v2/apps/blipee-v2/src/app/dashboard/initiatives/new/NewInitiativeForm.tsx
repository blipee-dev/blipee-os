'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { createInitiative } from '@/app/actions/initiatives'
import type { InitiativeStatus, InitiativePriority } from '@/lib/types/initiatives'
import styles from '../../gri/materiality/materiality.module.css'

interface NewInitiativeFormProps {
  organizationId: string
}

export function NewInitiativeForm({ organizationId }: NewInitiativeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as InitiativeStatus,
    priority: 'medium' as InitiativePriority,
    start_date: '',
    target_date: '',
    budget: '',
    budget_currency: 'EUR',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createInitiative({
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        budget_currency: formData.budget_currency || null,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        router.push(`/dashboard/initiatives/${result.data.id}`)
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
          onClick={() => router.push('/dashboard/initiatives')}
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
          Back to Initiatives
        </button>

        <h1 className={styles.sectionTitle}>Create New Initiative</h1>
        <p className={styles.sectionDescription}>
          Define a new sustainability initiative to track progress and manage metrics
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

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Name */}
            <div>
              <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                Initiative Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.filterSelect}
                style={{ width: '100%' }}
                placeholder="e.g., Reduce Carbon Emissions 2024"
              />
            </div>

            {/* Description */}
            <div>
              <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.filterSelect}
                style={{ width: '100%', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Describe the initiative goals and objectives..."
              />
            </div>

            {/* Status and Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InitiativeStatus })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Priority *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as InitiativePriority })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={styles.filterLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Currency
                </label>
                <select
                  value={formData.budget_currency}
                  onChange={(e) => setFormData({ ...formData, budget_currency: e.target.value })}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.exportButton}
                style={{ flex: 1 }}
              >
                <Save size={18} />
                {isSubmitting ? 'Creating...' : 'Create Initiative'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/initiatives')}
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
          </div>
        </form>
      </div>
    </div>
  )
}
