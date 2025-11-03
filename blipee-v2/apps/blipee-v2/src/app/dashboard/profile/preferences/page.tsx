'use client'

import { useState, useEffect } from 'react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'
import CustomSelect from '@/components/CustomSelect'
import CustomCheckbox from '@/components/CustomCheckbox'

export default function PreferencesPage() {
  const { preferences: userPreferences, loading, updating, updatePreferencesAsync } = useUserPreferences()
  const toast = useToast()

  const [formData, setFormData] = useState({
    language: 'pt',
    timezone: 'Europe/Lisbon (WEST)',
    emailNotifications: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    defaultDateRange: 'this-month',
  })

  // Sync form data when preferences load
  useEffect(() => {
    if (userPreferences) {
      setFormData(userPreferences)
    }
  }, [userPreferences])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await updatePreferencesAsync(formData)
      toast.showSuccess('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.showError('Error updating preferences.')
    }
  }

  function handleCancel() {
    if (userPreferences) {
      setFormData(userPreferences)
    }
  }

  if (loading) {
    return (
      <div className={styles.section}>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading preferences...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Language</h2>
        <p className={styles.sectionDescription}>
          Choose your preferred interface language
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Language</label>
          <CustomSelect
            value={formData.language}
            onChange={(value) => setFormData({ ...formData, language: value })}
            options={[
              { value: 'pt', label: 'Português' },
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
            ]}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Timezone</h2>
        <p className={styles.sectionDescription}>
          Set your timezone for accurate time display
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Timezone</label>
          <CustomSelect
            value={formData.timezone}
            onChange={(value) => setFormData({ ...formData, timezone: value })}
            options={[
              { value: 'Europe/Lisbon (WEST)', label: 'Europe/Lisbon (WEST)' },
              { value: 'Europe/London (GMT)', label: 'Europe/London (GMT)' },
              { value: 'America/New_York (EST)', label: 'America/New_York (EST)' },
              { value: 'America/Los_Angeles (PST)', label: 'America/Los_Angeles (PST)' },
            ]}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <p className={styles.sectionDescription}>
          Configure how you receive alerts and updates
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.emailNotifications}
              onChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              label="Email notifications"
              description="Receive notifications via email"
            />
          </div>

          <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className={styles.label}>Alert types to receive:</p>

            <CustomCheckbox
              checked={formData.criticalAlerts}
              onChange={(checked) => setFormData({ ...formData, criticalAlerts: checked })}
              label="Critical alerts (system failures, sensor offline)"
            />

            <CustomCheckbox
              checked={formData.warningAlerts}
              onChange={(checked) => setFormData({ ...formData, warningAlerts: checked })}
              label="Warning alerts (thresholds exceeded)"
            />

            <CustomCheckbox
              checked={formData.infoAlerts}
              onChange={(checked) => setFormData({ ...formData, infoAlerts: checked })}
              label="Info alerts (daily summaries)"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Dashboard Preferences</h2>
        <p className={styles.sectionDescription}>
          Customize your dashboard experience
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Default date range</label>
          <CustomSelect
            value={formData.defaultDateRange}
            onChange={(value) => setFormData({ ...formData, defaultDateRange: value })}
            options={[
              { value: 'this-month', label: 'This month' },
              { value: 'last-month', label: 'Last month' },
              { value: 'last-3-months', label: 'Last 3 months' },
              { value: 'last-6-months', label: 'Last 6 months' },
              { value: 'ytd', label: 'Year to date (YTD)' },
              { value: 'last-12-months', label: 'Last 12 months' },
            ]}
          />
        </div>

        <FormActions
          onCancel={handleCancel}
          isSaving={updating}
          onSave={(e) => {
            e?.preventDefault()
            handleSubmit(e as any)
          }}
          isSubmitButton={false}
        />
      </div>
    </>
  )
}
