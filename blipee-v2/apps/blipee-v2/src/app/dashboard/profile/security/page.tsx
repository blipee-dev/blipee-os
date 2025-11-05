'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/v2/client'
import { useToast } from '@/components/Toast'
import styles from '@/styles/settings-layout.module.css'
import FormActions from '@/components/FormActions'

export default function SecurityPage() {
  const t = useTranslations('profile.profile.security')
  const toast = useToast()
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.showError(t('passwordsDoNotMatch'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.showError(t('passwordTooShort'))
      return
    }

    try {
      setChangingPassword(true)
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      toast.showSuccess(t('passwordChangeSuccess'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.showError(t('passwordChangeError'))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      {/* Change Password */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('changePasswordTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('changePasswordDescription')}
        </p>

        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('currentPasswordLabel')}</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('newPasswordLabel')}</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={8}
            />
            <p className={styles.helpText}>{t('newPasswordHelpText')}</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('confirmPasswordLabel')}</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <FormActions
            onCancel={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            isSaving={changingPassword}
            saveButtonText={t('changePasswordButton')}
            confirmMessage={t('changePasswordConfirm')}
            isSubmitButton={true}
          />
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('twoFactorTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('twoFactorDescription')}
        </p>

        <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                {t('twoFactorStatusLabel')} <span style={{ color: 'var(--color-warning)' }}>{t('twoFactorStatusDisabled')}</span>
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {t('twoFactorProtectionText')}
              </p>
            </div>
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              {t('enable2FAButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('activeSessionsTitle')}</h2>
        <p className={styles.sectionDescription}>
          {t('activeSessionsDescription')}
        </p>

        <div className={styles.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {t('deviceHeader')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {t('locationHeader')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {t('lastAccessHeader')}
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {t('actionsHeader')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Chrome on macOS</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <span className={`${styles.sessionIndicator} ${styles.sessionIndicatorActive}`}></span>
                        {t('currentSession')}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Lisbon, Portugal
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {t('now')}
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {t('thisSession')}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Safari on iPhone</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        <span className={`${styles.sessionIndicator} ${styles.sessionIndicatorInactive}`}></span>
                        {t('inactive')}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Lisbon, Portugal
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  2 days ago
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    {t('revokeButton')}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className={`${styles.button} ${styles.buttonSecondary}`}>
            {t('endAllSessionsButton')}
          </button>
        </div>
      </div>
    </>
  )
}
