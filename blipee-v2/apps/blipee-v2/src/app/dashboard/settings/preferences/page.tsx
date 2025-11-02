'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/v2/client'
import styles from '../settings.module.css'

export default function PreferencesPage() {
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    language: 'pt',
    timezone: 'Europe/Lisbon (WEST)',
    emailNotifications: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    defaultDateRange: 'last-7-days',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setSaving(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const updateData = {
        preferred_language: preferences.language,
        timezone: preferences.timezone,
        notification_settings: {
          email: preferences.emailNotifications,
          critical: preferences.criticalAlerts,
          warning: preferences.warningAlerts,
          info: preferences.infoAlerts,
        },
        preferences: {
          defaultDateRange: preferences.defaultDateRange,
        },
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData as any)
        .eq('id', user.id)

      if (error) throw error

      alert('Preferências atualizadas com sucesso!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      alert('Erro ao atualizar preferências.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Language */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Idioma</h2>
        <p className={styles.sectionDescription}>
          Escolha o seu idioma preferido para a interface
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Idioma</label>
            <select
              className={styles.select}
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </form>
      </div>

      {/* Timezone */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Fuso Horário</h2>
        <p className={styles.sectionDescription}>
          Defina o seu fuso horário para exibição precisa da hora
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Fuso Horário</label>
          <select
            className={styles.select}
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
          >
            <option value="Europe/Lisbon (WEST)">Europe/Lisbon (WEST)</option>
            <option value="Europe/London (GMT)">Europe/London (GMT)</option>
            <option value="America/New_York (EST)">America/New_York (EST)</option>
            <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notificações</h2>
        <p className={styles.sectionDescription}>
          Configure como recebe alertas e atualizações
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div>
                <div className={styles.label} style={{ marginBottom: '0.25rem' }}>
                  Notificações por email
                </div>
                <p className={styles.helpText}>Receber notificações por email</p>
              </div>
            </label>
          </div>

          <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className={styles.label}>Tipos de alerta a receber:</p>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.criticalAlerts}
                onChange={(e) => setPreferences({ ...preferences, criticalAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Alertas críticos (falhas do sistema, sensor offline)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.warningAlerts}
                onChange={(e) => setPreferences({ ...preferences, warningAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Alertas de aviso (limites excedidos)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.infoAlerts}
                onChange={(e) => setPreferences({ ...preferences, infoAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Alertas informativos (resumos diários)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Preferências do Dashboard</h2>
        <p className={styles.sectionDescription}>
          Personalize a sua experiência no dashboard
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Intervalo de datas padrão</label>
          <select
            className={styles.select}
            value={preferences.defaultDateRange}
            onChange={(e) => setPreferences({ ...preferences, defaultDateRange: e.target.value })}
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="last-90-days">Last 90 days</option>
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Alterações'}
          </button>
        </div>
      </div>
    </>
  )
}
