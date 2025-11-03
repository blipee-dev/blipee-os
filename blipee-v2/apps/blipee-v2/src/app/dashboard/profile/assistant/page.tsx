'use client'

import { useState, useEffect } from 'react'
import { useAIPreferences } from '@/hooks/useAIPreferences'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'
import CustomSelect from '@/components/CustomSelect'
import CustomCheckbox from '@/components/CustomCheckbox'

export default function AssistantPage() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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

      toast.showSuccess('AI Assistant settings updated successfully!')
    } catch (error) {
      console.error('Error updating AI settings:', error)
      toast.showError('Error updating AI settings.')
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
          Loading AI settings...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Personality</h2>
        <p className={styles.sectionDescription}>
          Customize how the blipee AI Assistant interacts with you
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Communication Tone</label>
            <CustomSelect
              value={formData.tone}
              onChange={(value) => setFormData({ ...formData, tone: value as any })}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'friendly', label: 'Friendly' },
                { value: 'casual', label: 'Casual' },
                { value: 'formal', label: 'Formal' },
              ]}
            />
            <p className={styles.helpText}>How the AI should communicate with you</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Proactivity Level</label>
            <CustomSelect
              value={formData.proactivity}
              onChange={(value) => setFormData({ ...formData, proactivity: value as any })}
              options={[
                { value: 'low', label: 'Low - Wait for my requests' },
                { value: 'medium', label: 'Medium - Balanced approach' },
                { value: 'high', label: 'High - Proactive suggestions' },
              ]}
            />
            <p className={styles.helpText}>How proactive the AI should be in offering help</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Detail Level</label>
            <CustomSelect
              value={formData.detail_level}
              onChange={(value) => setFormData({ ...formData, detail_level: value as any })}
              options={[
                { value: 'concise', label: 'Concise - Brief and to the point' },
                { value: 'balanced', label: 'Balanced - Moderate detail' },
                { value: 'detailed', label: 'Detailed - Comprehensive explanations' },
              ]}
            />
            <p className={styles.helpText}>Level of detail in AI responses</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Response Preferences</h2>
        <p className={styles.sectionDescription}>
          Configure how you want to receive information from the AI
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Response Format</label>
            <CustomSelect
              value={formData.response_format}
              onChange={(value) => setFormData({ ...formData, response_format: value as any })}
              options={[
                { value: 'bullets', label: 'Bullet Points - Easy to scan' },
                { value: 'paragraphs', label: 'Paragraphs - Narrative format' },
                { value: 'mixed', label: 'Mixed - Combination of both' },
              ]}
            />
            <p className={styles.helpText}>Preferred format for AI responses</p>
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.include_examples}
              onChange={(checked) => setFormData({ ...formData, include_examples: checked })}
              label="Include Examples"
              description="Include practical examples in responses"
            />
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.show_technical_details}
              onChange={(checked) => setFormData({ ...formData, show_technical_details: checked })}
              label="Show Technical Details"
              description="Include technical implementation details"
            />
          </div>

          <div className={styles.formGroup}>
            <CustomCheckbox
              checked={formData.suggest_improvements}
              onChange={(checked) => setFormData({ ...formData, suggest_improvements: checked })}
              label="Suggest Improvements"
              description="AI can proactively suggest improvements"
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
      </div>
    </>
  )
}
