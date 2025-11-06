'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'
import CustomSelect from '@/components/CustomSelect'
import CustomCheckbox from '@/components/CustomCheckbox'

export default function PreferencesPage() {
  const t = useTranslations('profile.profile.preferences')
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
      toast.showSuccess(t('updateSuccess'))
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.showError(t('updateError'))
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
          {t('loading')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('languageTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('languageDescription')}
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('languageLabel')}</label>
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
        <h2 className={styles.sectionTitle}>{t('timezoneTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('timezoneDescription')}
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('timezoneLabel')}</label>
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
        <h2 className={styles.sectionTitle}>{t('notificationsTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('notificationsDescription')}
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.emailNotifications}
              onChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              label={t('emailNotificationsLabel')}
              description={t('emailNotificationsDescription')}
            />
          </div>

          <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className={styles.label}>{t('alertTypesLabel')}</p>

            <CustomCheckbox
              checked={formData.criticalAlerts}
              onChange={(checked) => setFormData({ ...formData, criticalAlerts: checked })}
              label={t('criticalAlertsLabel')}
            />

            <CustomCheckbox
              checked={formData.warningAlerts}
              onChange={(checked) => setFormData({ ...formData, warningAlerts: checked })}
              label={t('warningAlertsLabel')}
            />

            <CustomCheckbox
              checked={formData.infoAlerts}
              onChange={(checked) => setFormData({ ...formData, infoAlerts: checked })}
              label={t('infoAlertsLabel')}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('dashboardPreferencesTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('dashboardPreferencesDescription')}
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('defaultDateRangeLabel')}</label>
          <CustomSelect
            value={formData.defaultDateRange}
            onChange={(value) => setFormData({ ...formData, defaultDateRange: value })}
            options={[
              { value: 'this-month', label: t('dateRangeThisMonth') },
              { value: 'last-month', label: t('dateRangeLastMonth') },
              { value: 'last-3-months', label: t('dateRangeLast3Months') },
              { value: 'last-6-months', label: t('dateRangeLast6Months') },
              { value: 'ytd', label: t('dateRangeYTD') },
              { value: 'last-12-months', label: t('dateRangeLast12Months') },
            ]}
          />
        </div>

        <FormActions
          onCancel={handleCancel}
          isSaving={updating}
          onSave={() => {
            handleSubmit({} as any)
          }}
          isSubmitButton={false}
        />
      </div>
    </>
  )
}
