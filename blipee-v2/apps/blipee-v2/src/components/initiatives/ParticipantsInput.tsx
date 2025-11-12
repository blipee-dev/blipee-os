'use client'

import { useState } from 'react'
import { X, User, Mail, Shield, Edit3 } from 'lucide-react'
import type { OrgUser, AddParticipantInput, ParticipantRole } from '@/lib/types/initiatives'
import styles from '@/styles/settings-layout.module.css'

interface ParticipantsInputProps {
  organizationUsers: OrgUser[]
  participants: AddParticipantInput[]
  onChange: (participants: AddParticipantInput[]) => void
  disabled?: boolean
}

export function ParticipantsInput({
  organizationUsers,
  participants,
  onChange,
  disabled = false,
}: ParticipantsInputProps) {
  const [emailInput, setEmailInput] = useState('')
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>('member')
  const [canEdit, setCanEdit] = useState(false)

  const handleAddParticipant = () => {
    const email = emailInput.trim().toLowerCase()

    if (!email) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
      return
    }

    // Check if already added
    if (participants.some((p) => p.email === email)) {
      alert('This participant has already been added')
      return
    }

    // Check if user exists in organization
    const orgUser = organizationUsers.find((u) => u.email === email)

    const newParticipant: AddParticipantInput = {
      email,
      name: orgUser?.full_name || undefined,
      role: selectedRole,
      can_edit: canEdit,
      can_view_metrics: true,
      can_add_comments: true,
    }

    onChange([...participants, newParticipant])
    setEmailInput('')
    setSelectedRole('member')
    setCanEdit(false)
  }

  const handleRemoveParticipant = (email: string) => {
    onChange(participants.filter((p) => p.email !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddParticipant()
    }
  }

  const isOrgUser = (email: string) => {
    return organizationUsers.some((u) => u.email === email)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Input Area */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            placeholder="participant@example.com"
            disabled={disabled}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label className={styles.label}>Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ParticipantRole)}
            className={styles.select}
            disabled={disabled}
          >
            <option value="member">Member</option>
            <option value="owner">Owner</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label className={styles.label}>Permissions</label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.875rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <input
              type="checkbox"
              checked={canEdit}
              onChange={(e) => setCanEdit(e.target.checked)}
              disabled={disabled}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
            <span>Can Edit</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleAddParticipant}
          disabled={disabled || !emailInput.trim()}
          style={{
            padding: '0.65rem 1rem',
            background: disabled || !emailInput.trim() ? 'rgba(255, 255, 255, 0.05)' : 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: disabled || !emailInput.trim() ? 'not-allowed' : 'pointer',
            opacity: disabled || !emailInput.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
          }}
        >
          {participants.map((participant) => {
            const isRegistered = isOrgUser(participant.email)

            return (
              <div
                key={participant.email}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: isRegistered
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${isRegistered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                }}
              >
                {isRegistered ? (
                  <User size={14} style={{ color: '#10b981' }} />
                ) : (
                  <Mail size={14} style={{ color: '#3b82f6' }} />
                )}

                <span style={{ color: 'var(--text-primary)' }}>
                  {participant.name || participant.email}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Shield size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    {participant.role}
                  </span>
                </div>

                {participant.can_edit && (
                  <Edit3 size={12} style={{ color: 'var(--green)' }} title="Can edit" />
                )}

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(participant.email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Helper text */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}
      >
        <User size={12} style={{ display: 'inline', color: '#10b981' }} /> = Registered user •{' '}
        <Mail size={12} style={{ display: 'inline', color: '#3b82f6' }} /> = External collaborator
      </p>
    </div>
  )
}
