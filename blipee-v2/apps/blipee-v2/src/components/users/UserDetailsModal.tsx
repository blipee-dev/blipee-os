'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'
import CustomSelect from '@/components/CustomSelect'
import ConfirmDialog from '@/components/ConfirmDialog'
import { BlipeeMultiStepModal } from '@/components/ui'
import { inviteUser, updateUser, deleteUser } from '@/app/actions/v2/users'

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
  const t = useTranslations('settings.modals.userDetails')

  // Get user organization for creating new users
  const { organization } = useUserOrganization()

  // Determine if we're in create mode (user is null)
  const isCreating = !user

  // Permission to edit: allow all authenticated users (matches sites modal behavior)
  const canEdit = true
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
    { number: 1, title: t('step1Title'), icon: t('step1Icon') },
    { number: 2, title: t('step2Title'), icon: t('step2Icon') },
  ]

  const totalSteps = steps.length

  // Effects
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, isCreating])

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
    if (isCreating) {
      onClose()
    } else {
      setIsEditing(false)
      setFormData({})
      setCurrentStep(1)
    }
  }

  const handleSave = async () => {
    // Validation
    if (isCreating) {
      if (!formData.email) {
        toast.error(t('toastErrorEmail'))
        return
      }
      if (!formData.full_name) {
        toast.error(t('toastErrorName'))
        return
      }
      if (!organization) {
        toast.error(t('toastErrorOrg'))
        return
      }
    }

    setSaving(true)
    try {
      if (isCreating) {
        // CREATE new user - send invitation via server action
        const result = await inviteUser({
          email: formData.email!,
          full_name: formData.full_name!,
          job_title: formData.job_title,
          department: formData.department,
          phone: formData.phone,
          mobile_phone: formData.mobile_phone,
          organization_id: organization!.id,
          role: formData.role || 'member',
          access_all_facilities: formData.access_all_facilities ?? true,
          facility_ids: formData.facility_ids || [],
        })

        if (result.error) {
          throw new Error(result.error)
        }

        toast.success(t('toastInviteSuccess'))
      } else {
        // UPDATE existing user via server action
        const result = await updateUser({
          user_id: user!.user_id,
          email: formData.email,
          full_name: formData.full_name,
          job_title: formData.job_title,
          department: formData.department,
          phone: formData.phone,
          mobile_phone: formData.mobile_phone,
          organization_id: organization!.id,
          role: formData.role || 'member',
          access_all_facilities: formData.access_all_facilities ?? true,
          facility_ids: formData.facility_ids || [],
        })

        if (result.error) {
          throw new Error(result.error)
        }

        toast.success(t('toastUpdateSuccess'))
      }

      setIsEditing(false)
      onUpdate() // This will trigger refetch and close modal
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} user:`, error)
      toast.error(
        error instanceof Error ? error.message : t(isCreating ? 'toastInviteError' : 'toastUpdateError')
      )
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
    if (!user || !organization) return

    setShowDeleteDialog(false)
    setDeleting(true)
    try {
      // Delete user via server action
      const result = await deleteUser(user.user_id, organization.id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success(t('toastRemoveSuccess'))
      onUpdate() // This will trigger refetch and close modal
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error(error instanceof Error ? error.message : t('toastRemoveError'))
    } finally {
      setDeleting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    const readOnlyStyle: React.CSSProperties = {
      padding: '0.65rem 0.875rem',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      borderRadius: '12px',
      color: 'var(--text-primary)',
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
                <label className={styles.label}>{t('labelFullName')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={t('placeholderFullName')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.full_name}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelEmail')}</label>
                {isEditing ? (
                  <input
                    type="email"
                    className={styles.input}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('placeholderEmail')}
                    disabled={!isCreating}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.email}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelJobTitle')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder={t('placeholderJobTitle')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.job_title || t('notSpecified')}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelDepartment')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder={t('placeholderDepartment')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.department || t('notSpecified')}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelPhone')}</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('placeholderPhone')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.phone || t('notSpecified')}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelMobilePhone')}</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.mobile_phone || ''}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    placeholder={t('placeholderMobilePhone')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{user?.mobile_phone || t('notSpecified')}</div>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        // Role & Access
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('labelRole')}</label>
              {isEditing && canEdit ? (
                <CustomSelect
                  value={formData.role || 'member'}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  options={[
                    { value: 'member', label: t('roleMember') },
                    { value: 'admin', label: t('roleAdmin') },
                  ]}
                />
              ) : (
                <div style={readOnlyStyle}>
                  {user?.role || 'member'}
                  {user?.is_owner && t('roleOwnerIndicator')}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('labelFacilityAccess')}</label>
              {isEditing && canEdit ? (
                <CustomSelect
                  value={formData.access_all_facilities ? 'all' : 'specific'}
                  onChange={(value) => setFormData({
                    ...formData,
                    access_all_facilities: value === 'all'
                  })}
                  options={[
                    { value: 'all', label: t('accessAll') },
                    { value: 'specific', label: t('accessSpecific') },
                  ]}
                />
              ) : (
                <div style={readOnlyStyle}>
                  {user?.access_all_facilities ? t('accessAllDisplay') : t('accessSpecificDisplay')}
                </div>
              )}
            </div>

            {!isCreating && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelStatus')}</label>
                  <div style={readOnlyStyle}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      backgroundColor: user?.invitation_status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: user?.invitation_status === 'accepted' ? '#22c55e' : '#eab308',
                    }}>
                      {user?.invitation_status || t('statusPending')}
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelJoined')}</label>
                  <div style={readOnlyStyle}>
                    {user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : t('dateNotYet')}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelLastActive')}</label>
                  <div style={readOnlyStyle}>
                    {user?.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : t('dateNever')}
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

  // Prepare badges
  const badges = []
  if (!isCreating && user?.is_owner) {
    badges.push(
      <span
        key="owner"
        style={{
          padding: '0.375rem 0.875rem',
          borderRadius: '0.5rem',
          fontSize: '0.813rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          backgroundColor: 'rgba(147, 51, 234, 0.15)',
          color: '#9333ea',
          border: '1px solid rgba(147, 51, 234, 0.3)',
        }}
      >
        {t('badgeOwner')}
      </span>
    )
  }

  if (isSuperAdmin) {
    badges.push(
      <span
        key="superadmin"
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          background: '#8b5cf6',
          color: 'white',
        }}
      >
        {t('superAdminAccess')}
      </span>
    )
  }

  // Render
  return (
    <>
      <BlipeeMultiStepModal
        isOpen={isOpen}
        onClose={onClose}
        title={isCreating ? t('titleInvite') : isEditing ? t('titleEdit') : t('titleView')}
        badges={badges}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        isEditing={isEditing}
        canEdit={canEdit && !isCreating}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
        onDelete={canDelete ? handleDeleteClick : undefined}
        isSaving={isSaving}
        isDeleting={isDeleting}
        saveLabel={isCreating ? t('buttonSendInvitation') : t('buttonSaveChanges')}
        deleteLabel={t('buttonDelete')}
      >
        {renderStepContent()}
      </BlipeeMultiStepModal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={t('dialogRemoveTitle')}
        message={t('dialogRemoveMessage').replace('{name}', user?.full_name || '')}
        confirmText={t('dialogRemoveConfirm')}
        cancelText={t('dialogRemoveCancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
        requireTextConfirmation={true}
        confirmationText={t('dialogRemoveConfirmText')}
      />
    </>
  )
}
