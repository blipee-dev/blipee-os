'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/v2/client'
import styles from '../settings.module.css'

export default function SecurityPage() {
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('As passwords não coincidem.')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      alert('A password deve ter pelo menos 8 caracteres.')
      return
    }

    try {
      setChangingPassword(true)
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      alert('Password alterada com sucesso!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Erro ao alterar password.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      {/* Change Password */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Alterar Password</h2>
        <p className={styles.sectionDescription}>
          Atualize a sua password regularmente para manter a conta segura
        </p>

        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password Atual</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nova Password</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={8}
            />
            <p className={styles.helpText}>Mínimo de 8 caracteres</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirmar Nova Password</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={changingPassword}
            >
              {changingPassword ? 'Alterando...' : 'Alterar Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Autenticação de Dois Fatores (2FA)</h2>
        <p className={styles.sectionDescription}>
          Adicione uma camada extra de segurança à sua conta
        </p>

        <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                Estado: <span style={{ color: 'var(--color-warning)' }}>Desativado</span>
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Proteja a sua conta com autenticação de dois fatores através de uma aplicação autenticadora
              </p>
            </div>
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              Ativar 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sessões Ativas</h2>
        <p className={styles.sectionDescription}>
          Gerir dispositivos com acesso à sua conta
        </p>

        <div className={styles.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Dispositivo
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Localização
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Último Acesso
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Ações
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--color-success)', marginRight: '0.5rem' }}>●</span>
                        Sessão atual
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Lisboa, Portugal
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Agora
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Esta sessão
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>●</span>
                        Inativo
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Lisboa, Portugal
                </td>
                <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Há 2 dias
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Revogar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className={`${styles.button} ${styles.buttonSecondary}`}>
            Terminar Todas as Outras Sessões
          </button>
        </div>
      </div>
    </>
  )
}
