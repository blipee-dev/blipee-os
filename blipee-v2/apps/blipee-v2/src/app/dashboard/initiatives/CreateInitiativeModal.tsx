'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInitiative } from '@/app/actions/initiatives'
import type {
 InitiativeStatus,
  InitiativePriority,
  AddParticipantInput,
} from '@/lib/types/initiatives'
import { BlipeeModal } from '@/components/ui/BlipeeModal'
import { BlipeeModalFooter, type FooterButton } from '@/components/ui/BlipeeModalFooter'
import { ParticipantsInput } from '@/components/initiatives/ParticipantsInput'
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers'
import styles from '@/styles/settings-layout.module.css'

interface CreateInitiativeModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
}

export function CreateInitiativeModal({ isOpen, onClose, organizationId }: CreateInitiativeModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch organization users
  const { users: orgUsers, loading: loadingUsers } = useOrganizationUsers(organizationId)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as InitiativeStatus,
    priority: 'medium' as InitiativePriority,
    start_date: '',
    target_date: '',
    budget: '',
    budget_currency: 'EUR',
    owner_id: '', // Will be set to current user by default in handleSave
  })

  const [participants, setParticipants] = useState<AddParticipantInput[]>([])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

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
        owner_id: formData.owner_id || undefined,
        participants: participants.length > 0 ? participants : undefined,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        // Reset form and close modal
        setFormData({
          name: '',
          description: '',
          status: 'planning',
          priority: 'medium',
          start_date: '',
          target_date: '',
          budget: '',
          budget_currency: 'EUR',
          owner_id: '',
        })
        setParticipants([])
        onClose()

        // Navigate to the new initiative detail page
        router.push(`/dashboard/initiatives/${result.data.id}`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form and close
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      start_date: '',
      target_date: '',
      budget: '',
      budget_currency: 'EUR',
      owner_id: '',
    })
    setParticipants([])
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
      label: 'Create Initiative',
      onClick: handleSave,
      variant: 'primary',
      disabled: !formData.name.trim() || isSaving,
      loading: isSaving,
    },
  ]

  return (
    <BlipeeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Initiative"
      subtitle="Define a new sustainability initiative to track progress and manage metrics"
      maxWidth="900px"
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

        <div className={styles.form}>
          {/* Name - Full width */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem 1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Initiative Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                placeholder="e.g., Reduce Carbon Emissions 2024"
              />
            </div>
          </div>

          {/* Description - Full width */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem 1rem', marginTop: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.textarea}
                rows={4}
                placeholder="Describe the initiative goals and objectives..."
              />
            </div>
          </div>

          {/* Owner - Full width */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.5rem 1rem',
              marginTop: '1rem',
            }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>Owner</label>
              <select
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className={styles.select}
                disabled={loadingUsers}
              >
                <option value="">Myself (default)</option>
                {orgUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} {user.email && `(${user.email})`}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                The owner will be automatically added as a participant with edit permissions
              </p>
            </div>
          </div>

          {/* Status and Priority - 2 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem 1rem',
              marginTop: '1rem',
            }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InitiativeStatus })}
                className={styles.select}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Priority <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as InitiativePriority })}
                className={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Dates - 2 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem 1rem',
              marginTop: '1rem',
            }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Target Date</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          {/* Budget - 2fr + 1fr columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1.5rem 1rem',
              marginTop: '1rem',
            }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>Budget</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={styles.input}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <select
                value={formData.budget_currency}
                onChange={(e) => setFormData({ ...formData, budget_currency: e.target.value })}
                className={styles.select}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Team Members / Participants */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.5rem 1rem',
              marginTop: '1.5rem',
            }}
          >
            <div className={styles.formGroup}>
              <label className={styles.label}>Team Members (Optional)</label>
              <ParticipantsInput
                organizationUsers={orgUsers}
                participants={participants}
                onChange={setParticipants}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      </div>
    </BlipeeModal>
  )
}
