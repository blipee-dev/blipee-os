'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'
import FormWithConfirm from '@/components/FormWithConfirm'
import {
  User, Briefcase, Rocket, Zap, Target, Heart, Star,
  TrendingUp, Award, Shield, Leaf, Sparkles
} from 'lucide-react'

type AvatarType = 'icon' | 'initials'
type GradientColor = 'blipee' | 'blue' | 'purple' | 'pink' | 'orange' | 'teal' | 'cyan' | 'red' | 'indigo' | 'lime'
type AvatarIcon = 'user' | 'briefcase' | 'rocket' | 'zap' | 'target' | 'heart' | 'star' | 'trending-up' | 'award' | 'shield' | 'leaf' | 'sparkles'

const gradients: Record<GradientColor, string> = {
  blipee: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  purple: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  teal: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  indigo: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  lime: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
}

const iconComponents: Record<AvatarIcon, React.ComponentType<any>> = {
  user: User,
  briefcase: Briefcase,
  rocket: Rocket,
  zap: Zap,
  target: Target,
  heart: Heart,
  star: Star,
  'trending-up': TrendingUp,
  award: Award,
  shield: Shield,
  leaf: Leaf,
  sparkles: Sparkles,
}

const availableIcons: AvatarIcon[] = [
  'user', 'briefcase', 'rocket', 'zap', 'target', 'heart',
  'star', 'trending-up', 'award', 'shield', 'leaf', 'sparkles'
]

export default function ProfilePage() {
  const router = useRouter()
  const { organization } = useUserOrganization()
  const { profile: userProfile, loading, updating, updateProfileAsync } = useUserProfile()
  const toast = useToast()

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    job_title: '',
    department: '',
    employee_id: '',
    phone: '',
    mobile_phone: '',
    avatar_url: '',
  })

  const [avatarSettings, setAvatarSettings] = useState<{
    type: AvatarType
    gradient: GradientColor
    icon: AvatarIcon
  }>({
    type: 'initials',
    gradient: 'blipee',
    icon: 'user',
  })

  // Sync form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        display_name: userProfile.display_name || '',
        job_title: userProfile.job_title || '',
        department: userProfile.department || '',
        employee_id: userProfile.employee_id || '',
        phone: userProfile.phone || '',
        mobile_phone: userProfile.mobile_phone || '',
        avatar_url: userProfile.avatar_url || '',
      })

      // Load avatar settings from preferences
      if (userProfile.preferences?.avatarSettings) {
        setAvatarSettings({
          type: userProfile.preferences.avatarSettings.type || 'initials',
          gradient: userProfile.preferences.avatarSettings.gradient || 'blipee',
          icon: userProfile.preferences.avatarSettings.icon || 'user',
        })
      }
    }
  }, [userProfile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userProfile) return

    try {
      await updateProfileAsync({
        ...formData,
        preferences: {
          avatarSettings: {
            type: avatarSettings.type,
            gradient: avatarSettings.gradient,
            icon: avatarSettings.icon,
          },
        },
      })

      toast.showSuccess('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.showError('Error updating profile. Please try again.')
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function getInitials() {
    if (formData.full_name) {
      const names = formData.full_name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return names[0].substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className={styles.section}>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <>
      {/* Avatar Customization */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Avatar Customization</h2>
        <p className={styles.sectionDescription}>
          Choose how your avatar appears in the navigation bar
        </p>

        {/* Avatar Preview */}
        <div className={styles.avatarPreviewSection}>
          <div className={styles.avatarPreviewLabel}>Preview:</div>
          <div
            className={styles.avatarPreviewLarge}
            style={{ background: gradients[avatarSettings.gradient] }}
          >
            {avatarSettings.type === 'initials' ? (
              getInitials()
            ) : (
              (() => {
                const IconComponent = iconComponents[avatarSettings.icon]
                return <IconComponent size={40} strokeWidth={2} />
              })()
            )}
          </div>
        </div>

        {/* Avatar Type Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Display Type</label>
          <div className={styles.avatarTypeButtons}>
            <button
              type="button"
              className={`${styles.avatarTypeButton} ${avatarSettings.type === 'icon' ? styles.active : ''}`}
              onClick={() => setAvatarSettings({ ...avatarSettings, type: 'icon' })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Icon
            </button>
            <button
              type="button"
              className={`${styles.avatarTypeButton} ${avatarSettings.type === 'initials' ? styles.active : ''}`}
              onClick={() => setAvatarSettings({ ...avatarSettings, type: 'initials' })}
            >
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Aa</span>
              Initials
            </button>
          </div>
          <p className={styles.helpText}>Choose how your avatar appears in the navigation bar</p>
        </div>

        {/* Icon Selection (only when type is 'icon') */}
        {avatarSettings.type === 'icon' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Choose Icon</label>
            <div className={styles.gradientGrid}>
              {availableIcons.map((icon) => {
                const IconComponent = iconComponents[icon]
                return (
                  <div
                    key={icon}
                    role="button"
                    tabIndex={0}
                    className={`${styles.gradientOption} ${avatarSettings.icon === icon ? styles.active : ''}`}
                    onClick={() => setAvatarSettings({ ...avatarSettings, icon })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setAvatarSettings({ ...avatarSettings, icon })
                      }
                    }}
                    style={{ background: gradients[avatarSettings.gradient] }}
                  >
                    <IconComponent size={28} strokeWidth={2.5} color="white" />
                  </div>
                )
              })}
            </div>
            <p className={styles.helpText}>Select an icon for your avatar</p>
          </div>
        )}

        {/* Gradient Color Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Gradient Color</label>
          <div className={styles.gradientGrid}>
            {(Object.keys(gradients) as GradientColor[]).map((color) => (
              <div
                key={color}
                role="button"
                tabIndex={0}
                className={`${styles.gradientOption} ${avatarSettings.gradient === color ? styles.active : ''}`}
                onClick={() => setAvatarSettings({ ...avatarSettings, gradient: color })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setAvatarSettings({ ...avatarSettings, gradient: color })
                  }
                }}
                style={{ background: gradients[color] }}
              >
                {avatarSettings.gradient === color && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <p className={styles.helpText}>Select a color gradient for your avatar background</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <p className={styles.sectionDescription}>
          Manage your personal details and contact information
        </p>

        <FormWithConfirm onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Full Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
                placeholder="José Pinto"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Display Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="José"
              />
              <p className={styles.helpText}>How you prefer to be addressed</p>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                className={styles.input}
                value={userProfile.email}
                disabled
              />
              <p className={styles.helpText}>Email cannot be changed</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Employee ID</label>
              <input
                type="text"
                className={styles.input}
                value={formData.employee_id}
                onChange={(e) => handleChange('employee_id', e.target.value)}
                placeholder="EMP-12345"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Job Title</label>
              <input
                type="text"
                className={styles.input}
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="Platform Admin"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Department</label>
              <input
                type="text"
                className={styles.input}
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="IT"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                className={styles.input}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+351 123 456 789"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Mobile Phone</label>
              <input
                type="tel"
                className={styles.input}
                value={formData.mobile_phone}
                onChange={(e) => handleChange('mobile_phone', e.target.value)}
                placeholder="+351 912 345 678"
              />
            </div>
          </div>

          {/* Organization & Account Info (Read-only) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization</label>
              <input
                type="text"
                className={styles.input}
                value={organization?.name || 'Loading...'}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Access Level</label>
              <input
                type="text"
                className={styles.input}
                value={organization?.role ? `${organization.role}${organization.is_owner ? ' (Owner)' : ''}` : 'Loading...'}
                disabled
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Member Since</label>
              <input
                type="text"
                className={styles.input}
                value={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US') : ''}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Last Access</label>
              <input
                type="text"
                className={styles.input}
                value={new Date().toLocaleDateString('en-US')}
                disabled
              />
            </div>
          </div>

          {/* Save Button */}
          <FormActions
            onCancel={() => {
              if (userProfile) {
                setFormData({
                  full_name: userProfile.full_name || '',
                  display_name: userProfile.display_name || '',
                  job_title: userProfile.job_title || '',
                  department: userProfile.department || '',
                  employee_id: userProfile.employee_id || '',
                  phone: userProfile.phone || '',
                  mobile_phone: userProfile.mobile_phone || '',
                  avatar_url: userProfile.avatar_url || '',
                })
                if (userProfile.preferences?.avatarSettings) {
                  setAvatarSettings({
                    type: userProfile.preferences.avatarSettings.type || 'initials',
                    gradient: userProfile.preferences.avatarSettings.gradient || 'blipee',
                    icon: userProfile.preferences.avatarSettings.icon || 'user',
                  })
                }
              }
            }}
            isSaving={updating}
            isSubmitButton={true}
          />
        </FormWithConfirm>
      </div>
    </>
  )
}
