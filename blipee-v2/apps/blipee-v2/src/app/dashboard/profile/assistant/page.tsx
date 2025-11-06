'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAIPreferences } from '@/hooks/useAIPreferences'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'
import CustomSelect from '@/components/CustomSelect'
import CustomCheckbox from '@/components/CustomCheckbox'

export default function AssistantPage() {
  const t = useTranslations('profile.profile.assistant')
  const { settings, loading, updating, updateSettingsAsync } = useAIPreferences()
  const toast = useToast()

  const [formData, setFormData] = useState({
    tone: 'professional' as 'professional' | 'friendly' | 'casual' | 'formal',
    proactivity: 'medium' as 'low' | 'medium' | 'high',
    detail_level: 'balanced' as 'concise' | 'balanced' | 'detailed',
    response_format: 'mixed' as 'bullets' | 'paragraphs' | 'mixed',
    include_examples: true,
    show_technical_details: false,
    suggest_improvements: true,
  })

  // Sync form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        tone: settings.personality.tone || 'professional',
        proactivity: settings.personality.proactivity || 'medium',
        detail_level: settings.personality.detail_level || 'balanced',
        response_format: settings.preferences.response_format || 'mixed',
        include_examples: settings.preferences.include_examples ?? true,
        show_technical_details: settings.preferences.show_technical_details ?? false,
        suggest_improvements: settings.preferences.suggest_improvements ?? true,
      })
    }
  }, [settings])

  async function handleSave() {
    try {
      await updateSettingsAsync({
        personality: {
          tone: formData.tone,
          proactivity: formData.proactivity,
          detail_level: formData.detail_level,
        },
        preferences: {
          response_format: formData.response_format,
          include_examples: formData.include_examples,
          show_technical_details: formData.show_technical_details,
          suggest_improvements: formData.suggest_improvements,
        },
      })

      toast.showSuccess(t('updateSuccess'))
    } catch (error) {
      console.error('Error updating AI settings:', error)
      toast.showError(t('updateError'))
    }
  }

  function handleCancel() {
    if (settings) {
      setFormData({
        tone: settings.personality.tone || 'professional',
        proactivity: settings.personality.proactivity || 'medium',
        detail_level: settings.personality.detail_level || 'balanced',
        response_format: settings.preferences.response_format || 'mixed',
        include_examples: settings.preferences.include_examples ?? true,
        show_technical_details: settings.preferences.show_technical_details ?? false,
        suggest_improvements: settings.preferences.suggest_improvements ?? true,
      })
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
        <h2 className={styles.sectionTitle}>{t('personalityTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('personalityDescription')}
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('communicationToneLabel')}</label>
            <CustomSelect
              value={formData.tone}
              onChange={(value) => setFormData({ ...formData, tone: value as any })}
              options={[
                { value: 'professional', label: t('toneProfessional') },
                { value: 'friendly', label: t('toneFriendly') },
                { value: 'casual', label: t('toneCasual') },
                { value: 'formal', label: t('toneFormal') },
              ]}
            />
            <p className={styles.helpText}>{t('communicationToneHelpText')}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('proactivityLabel')}</label>
            <CustomSelect
              value={formData.proactivity}
              onChange={(value) => setFormData({ ...formData, proactivity: value as any })}
              options={[
                { value: 'low', label: t('proactivityLow') },
                { value: 'medium', label: t('proactivityMedium') },
                { value: 'high', label: t('proactivityHigh') },
              ]}
            />
            <p className={styles.helpText}>{t('proactivityHelpText')}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('detailLevelLabel')}</label>
            <CustomSelect
              value={formData.detail_level}
              onChange={(value) => setFormData({ ...formData, detail_level: value as any })}
              options={[
                { value: 'concise', label: t('detailConcise') },
                { value: 'balanced', label: t('detailBalanced') },
                { value: 'detailed', label: t('detailDetailed') },
              ]}
            />
            <p className={styles.helpText}>{t('detailLevelHelpText')}</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('responsePreferencesTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('responsePreferencesDescription')}
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('responseFormatLabel')}</label>
            <CustomSelect
              value={formData.response_format}
              onChange={(value) => setFormData({ ...formData, response_format: value as any })}
              options={[
                { value: 'bullets', label: t('formatBullets') },
                { value: 'paragraphs', label: t('formatParagraphs') },
                { value: 'mixed', label: t('formatMixed') },
              ]}
            />
            <p className={styles.helpText}>{t('responseFormatHelpText')}</p>
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.include_examples}
              onChange={(checked) => setFormData({ ...formData, include_examples: checked })}
              label={t('includeExamplesLabel')}
              description={t('includeExamplesDescription')}
            />
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.show_technical_details}
              onChange={(checked) => setFormData({ ...formData, show_technical_details: checked })}
              label={t('showTechnicalDetailsLabel')}
              description={t('showTechnicalDetailsDescription')}
            />
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.suggest_improvements}
              onChange={(checked) => setFormData({ ...formData, suggest_improvements: checked })}
              label={t('suggestImprovementsLabel')}
              description={t('suggestImprovementsDescription')}
            />
          </div>

          <FormActions
            onCancel={handleCancel}
            isSaving={updating}
            onSave={handleSave}
            isSubmitButton={false}
          />
        </div>
      </div>
    </>
  )
}
