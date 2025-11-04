'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'
import CustomSelect from '@/components/CustomSelect'
import ConfirmDialog from '@/components/ConfirmDialog'

interface UserProfile {
  id: string
  email: string
  full_name: string
  job_title: string | null
  department: string | null
  phone: string | null
  mobile_phone: string | null
  avatar_url: string | null
  last_active_at: string | null
  created_at: string
}

interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: string
  is_owner: boolean
  invitation_status: string
  access_all_facilities: boolean
  facility_ids: string[] | null
  joined_at: string | null
}

interface User {
  membership_id: string
  user_id: string
  email: string
  full_name: string
  job_title: string | null
  department: string | null
  phone: string | null
  mobile_phone: string | null
  role: string
  is_owner: boolean
  invitation_status: string
  access_all_facilities: boolean
  facility_ids: string[] | null
  joined_at: string | null
  last_active_at: string | null
}

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  isSuperAdmin: boolean
  isAdmin: boolean
  onUpdate: () => void
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  isSuperAdmin,
  isAdmin,
  onUpdate,
}: UserDetailsModalProps) {
  // Get user organization for creating new users
  const { organization } = useUserOrganization()

  // Determine if we're in create mode (user is null)
  const isCreating = !user

  // Permission to edit: super admin can edit anyone, admin can edit non-owners in their org
  const canEdit = isSuperAdmin || (isAdmin && !user?.is_owner)
  const canDelete = isSuperAdmin || (isAdmin && !user?.is_owner)

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({})

  // Current step for multi-step form
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { number: 1, title: 'Basic Info', icon: '👤' },
    { number: 2, title: 'Organization', icon: '🏢' },
  ]

  const totalSteps = steps.length

  // Effects
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'

      // If creating new user, automatically enter edit mode
      if (isCreating) {
        setIsEditing(true)
        // Initialize with default values
        setFormData({
          role: 'member',
          access_all_facilities: true,
          invitation_status: 'pending'
        })
      }
    } else {
      setIsEditing(false)
      setFormData({})
      setCurrentStep(1)
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isCreating, onClose])

  // Handlers
  const handleEdit = () => {
    if (!user) return

    setFormData({
      email: user.email,
      full_name: user.full_name,
      job_title: user.job_title,
      department: user.department,
      phone: user.phone,
      mobile_phone: user.mobile_phone,
      role: user.role,
      access_all_facilities: user.access_all_facilities,
      facility_ids: user.facility_ids,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
    setCurrentStep(1)
  }

  const handleSave = async () => {
    // Validation
    if (isCreating) {
      if (!formData.email) {
        toast.error('Please enter an email address')
        return
      }
      if (!formData.full_name) {
        toast.error('Please enter a full name')
        return
      }
      if (!organization) {
        toast.error('No organization found')
        return
      }
    }

    setSaving(true)
    try {
      const supabase = createClient()

      if (isCreating) {
        // CREATE new user - this is an invitation
        // 1. Check if user already exists
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', formData.email)
          .single()

        let userId = existingUser?.id

        // 2. If user doesn't exist, create user profile
        if (!userId) {
          const { data: newUser, error: userError } = await supabase
            .from('user_profiles')
            .insert({
              email: formData.email,
              full_name: formData.full_name,
              job_title: formData.job_title,
              department: formData.department,
              phone: formData.phone,
              mobile_phone: formData.mobile_phone,
            })
            .select('id')
            .single()

          if (userError) throw userError
          userId = newUser.id
        }

        // 3. Create organization membership
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: userId,
            organization_id: organization!.id,
            role: formData.role || 'member',
            access_all_facilities: formData.access_all_facilities ?? true,
            facility_ids: formData.facility_ids || null,
            invitation_status: 'pending',
            is_owner: false,
          })

        if (memberError) throw memberError
        toast.success('User invited successfully!')
      } else {
        // UPDATE existing user
        // 1. Update user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            job_title: formData.job_title,
            department: formData.department,
            phone: formData.phone,
            mobile_phone: formData.mobile_phone,
          })
          .eq('id', user!.user_id)

        if (profileError) throw profileError

        // 2. Update organization membership
        const { error: memberError } = await supabase
          .from('organization_members')
          .update({
            role: formData.role,
            access_all_facilities: formData.access_all_facilities,
            facility_ids: formData.facility_ids,
          })
          .eq('id', user!.membership_id)

        if (memberError) throw memberError
        toast.success('User updated successfully!')
      }

      setIsEditing(false)
      onClose()
      onUpdate()
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} user:`, error)
      toast.error(`Failed to ${isCreating ? 'invite' : 'update'} user`)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user) return

    setShowDeleteDialog(false)
    setDeleting(true)
    try {
      const supabase = createClient()

      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('organization_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.membership_id)

      if (error) throw error

      toast.success('User removed from organization!')
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    } finally {
      setDeleting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    const readOnlyStyle = {
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-primary)',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      cursor: 'default',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
    }

    switch (currentStep) {
      case 1:
        // Basic Info
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.full_name}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                {isEditing ? (
                  <input
                    type="email"
                    className={styles.input}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    disabled={!isCreating}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.email}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Job Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="e.g., Energy Manager"
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.job_title || 'Not specified'}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Operations"
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.department || 'Not specified'}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 123 456 789"
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.phone || 'Not specified'}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mobile Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.mobile_phone || ''}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    placeholder="+351 987 654 321"
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.mobile_phone || 'Not specified'}</div>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        // Organization
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              {isEditing && canEdit ? (
                <CustomSelect
                  value={formData.role || 'member'}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  options={[
                    { value: 'member', label: 'Member' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              ) : (
                <div style={readOnlyStyle}>
                  {user?.role || 'member'}
                  {user?.is_owner && ' (Owner)'}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Facility Access</label>
              {isEditing && canEdit ? (
                <CustomSelect
                  value={formData.access_all_facilities ? 'all' : 'specific'}
                  onChange={(value) => setFormData({
                    ...formData,
                    access_all_facilities: value === 'all'
                  })}
                  options={[
                    { value: 'all', label: 'Access to All Facilities' },
                    { value: 'specific', label: 'Specific Facilities Only' },
                  ]}
                />
              ) : (
                <div style={readOnlyStyle}>
                  {user?.access_all_facilities ? 'All Facilities' : 'Specific Facilities'}
                </div>
              )}
            </div>

            {!isCreating && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <div style={readOnlyStyle}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      backgroundColor: user?.invitation_status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: user?.invitation_status === 'accepted' ? '#22c55e' : '#eab308',
                    }}>
                      {user?.invitation_status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Joined</label>
                  <div style={readOnlyStyle}>
                    {user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'Not yet'}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Active</label>
                  <div style={readOnlyStyle}>
                    {user?.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Early return
  if (!isOpen) return null

  // Render
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '2rem',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 className={styles.sectionTitle}>
                {isCreating ? 'Invite New User' : isEditing ? 'Edit User' : 'User Details'}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {!isCreating && user?.is_owner && (
                  <span
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(147, 51, 234, 0.15)',
                      color: '#9333ea',
                    }}
                  >
                    👑 Owner
                  </span>
                )}

                {isSuperAdmin && (
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: '#8b5cf6',
                      color: 'white',
                    }}
                  >
                    Super Admin Access
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '0.5rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Step indicator */}
          <div style={{ padding: '0 2rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {steps.map((step) => (
                <div
                  key={step.number}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: currentStep === step.number
                      ? 'linear-gradient(135deg, var(--green) 0%, #059669 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: currentStep === step.number
                      ? '1px solid var(--green)'
                      : '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    cursor: isEditing ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onClick={() => isEditing && setCurrentStep(step.number)}
                >
                  <span style={{ fontSize: '1.25rem' }}>{step.icon}</span>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: currentStep === step.number ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)',
                      marginBottom: '0.125rem'
                    }}>
                      Step {step.number}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: currentStep === step.number ? 'white' : 'var(--text-secondary)'
                    }}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {currentStep > 1 && isEditing && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
              {canEdit && !isCreating && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'transparent',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '12px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        Cancel
                      </button>
                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving}
                          style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: isSaving ? 'var(--border-primary)' : 'var(--gradient-primary)',
                            border: 'none',
                            color: 'white',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleEdit}
                        style={{
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          background: 'var(--gradient-primary)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={handleDeleteClick}
                          disabled={isDeleting}
                          style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            color: 'white',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                        >
                          {isDeleting ? 'Removing...' : '🗑️ Remove'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {isCreating && (
                <>
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        background: 'var(--gradient-primary)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        background: isSaving ? 'var(--border-primary)' : 'var(--gradient-primary)',
                        border: 'none',
                        color: 'white',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSaving ? 'Inviting...' : 'Send Invitation'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Remove User"
        message={`Are you sure you want to remove "${user?.full_name}" from the organization? This action cannot be undone.`}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
        requireTextConfirmation={true}
        confirmationText="remove_user"
      />
    </>
  )
}
