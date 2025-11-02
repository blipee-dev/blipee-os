'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/v2/client'
import { useRouter } from 'next/navigation'
import styles from './profile.module.css'

type AvatarType = 'icon' | 'initials'
type GradientColor = 'blipee' | 'blue' | 'purple' | 'pink' | 'orange' | 'teal' | 'cyan' | 'red' | 'indigo' | 'lime'

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

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    display_name: '',
    job_title: '',
    department: '',
    phone: '',
    avatar_url: '',
  })
  const [avatarSettings, setAvatarSettings] = useState<{
    type: AvatarType
    gradient: GradientColor
  }>({
    type: 'initials',
    gradient: 'blipee',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // Redirect to signin if not authenticated
        router.push('/signin')
        return
      }

      setUser(user)

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: any, error: any }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError)
      }

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || '',
          display_name: profileData.display_name || '',
          job_title: profileData.job_title || '',
          department: profileData.department || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || '',
        })

        // Load avatar settings from preferences
        if (profileData.preferences && typeof profileData.preferences === 'object') {
          const prefs = profileData.preferences as any
          if (prefs.avatarSettings) {
            setAvatarSettings({
              type: prefs.avatarSettings.type || 'initials',
              gradient: prefs.avatarSettings.gradient || 'blipee',
            })
          }
        }
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.name || '',
          preferences: {
            avatarSettings: {
              type: 'initials',
              gradient: 'blipee',
            }
          }
        }

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(newProfile as any)

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          setProfile({
            full_name: newProfile.full_name,
            email: newProfile.email,
            display_name: '',
            job_title: '',
            department: '',
            phone: '',
            avatar_url: '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const supabase = createClient()

      // Get existing preferences
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', user.id)
        .single() as { data: any }

      const existingPreferences = (currentProfile?.preferences as any) || {}

      const updateData = {
        full_name: profile.full_name,
        display_name: profile.display_name,
        job_title: profile.job_title,
        department: profile.department,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        preferences: {
          ...existingPreferences,
          avatarSettings: {
            type: avatarSettings.type,
            gradient: avatarSettings.gradient,
          },
        },
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData as any)
        .eq('id', user.id)

      if (error) throw error

      alert('Perfil atualizado com sucesso!')
      
      // Trigger a custom event to notify Navbar to reload avatar settings
      window.dispatchEvent(new Event('avatarSettingsUpdated'))
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field: string, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  function getInitials() {
    if (profile.full_name) {
      const names = profile.full_name.trim().split(' ')
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
          Carregando...
        </p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* Avatar Customization */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Personalização do Avatar</h2>
        <p className={styles.sectionDescription}>
          Choose how your avatar appears in the navigation bar
        </p>

        {/* Avatar Preview */}
        <div className={styles.avatarPreviewSection}>
          <div className={styles.avatarPreviewLabel}>Pré-visualização:</div>
          <div 
            className={styles.avatarPreviewLarge}
            style={{ background: gradients[avatarSettings.gradient] }}
          >
            {avatarSettings.type === 'initials' ? getInitials() : '👤'}
          </div>
        </div>

        {/* Avatar Type Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Tipo de Exibição</label>
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
              Ícone
            </button>
            <button
              type="button"
              className={`${styles.avatarTypeButton} ${avatarSettings.type === 'initials' ? styles.active : ''}`}
              onClick={() => setAvatarSettings({ ...avatarSettings, type: 'initials' })}
            >
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Aa</span>
              Iniciais
            </button>
          </div>
          <p className={styles.helpText}>Choose how your avatar appears in the navigation bar</p>
        </div>

        {/* Gradient Color Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Cor do Gradiente</label>
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
        <h2 className={styles.sectionTitle}>Informações Pessoais</h2>
        <p className={styles.sectionDescription}>
          This name will appear in your profile and throughout the application
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name Fields */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nome Completo<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Endereço de Email</label>
              <input
                type="email"
                className={styles.input}
                value={profile.email}
                disabled
              />
              <p className={styles.helpText}>O email não pode ser alterado</p>
            </div>
          </div>

          {/* Account Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Função</label>
              <input
                type="text"
                className={styles.input}
                value={profile.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="Admin da Plataforma"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Organização</label>
              <input
                type="text"
                className={styles.input}
                value="blipee"
                disabled
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Membro Desde</label>
              <input
                type="text"
                className={styles.input}
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT') : ''}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Último Acesso</label>
              <input
                type="text"
                className={styles.input}
                value={new Date().toLocaleDateString('pt-PT')}
                disabled
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nível de Acesso</label>
            <input
              type="text"
              className={styles.input}
              value="Full platform access - All organizations and stores"
              disabled
            />
          </div>

          {/* Save Button */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={loadProfile}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
