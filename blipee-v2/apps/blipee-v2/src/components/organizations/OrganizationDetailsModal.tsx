'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { Organization } from '@/hooks/useUserOrganizations'
import { createClient } from '@/lib/supabase/v2/client'
import { useIndustrySectors } from '@/hooks/useIndustrySectors'
import styles from '@/styles/settings-layout.module.css'
import CustomSelect from '@/components/CustomSelect'
import CustomCheckbox from '@/components/CustomCheckbox'
import FormActions from '@/components/FormActions'
import ConfirmDialog from '@/components/ConfirmDialog'

// Calculate company size based on employee count
function getCompanySize(employees: number | null): string {
  if (!employees) return ''
  if (employees <= 10) return '1-10'
  if (employees <= 50) return '11-50'
  if (employees <= 200) return '51-200'
  if (employees <= 500) return '201-500'
  if (employees <= 1000) return '501-1000'
  if (employees <= 5000) return '1001-5000'
  return '5000+'
}

// Hook to fetch total employees from all sites
function useTotalEmployees(organizationId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['organization-total-employees', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0

      const supabase = createClient()
      const { data, error } = await supabase
        .from('sites')
        .select('total_employees')
        .eq('organization_id', organizationId)

      if (error) throw error

      return data?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}

interface OrganizationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  organization: Organization | null
  isSuperAdmin: boolean
  onUpdate: () => void
}

export function OrganizationDetailsModal({
  isOpen,
  onClose,
  organization,
  isSuperAdmin,
  onUpdate,
}: OrganizationDetailsModalProps) {
  const t = useTranslations('settings.modals.organizationDetails')

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState<Partial<Organization>>({})
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    industry: true,
    size: true,
    contact: false,
    reporting: false,
    financial: false,
    status: false,
  })

  // Hooks
  const { sectors } = useIndustrySectors()
  const { data: totalEmployees = 0, isLoading: loadingEmployees } = useTotalEmployees(
    organization?.id,
    isOpen
  )

  // Effects
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      setIsEditing(false)
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleEdit = () => {
    if (!organization) return

    const primarySector = sectors.find((s) => s.sector_name === organization.industry_primary)
    const autoGriCode = organization.gri_sector_code || primarySector?.gri_standard || ''

    setFormData({
      name: organization.name,
      legal_name: organization.legal_name,
      industry: organization.industry,
      industry_primary: organization.industry_primary,
      industry_secondary: organization.industry_secondary,
      company_size: getCompanySize(totalEmployees),
      employees: totalEmployees,
      website: organization.website,
      public_company: organization.public_company,
      stock_ticker: organization.stock_ticker,
      primary_contact_email: organization.primary_contact_email,
      primary_contact_phone: organization.primary_contact_phone,
      region: organization.region,
      base_year: organization.base_year || new Date().getFullYear(),
      consolidation_approach: organization.consolidation_approach,
      annual_revenue: organization.annual_revenue,
      annual_customers: organization.annual_customers,
      annual_operating_hours: organization.annual_operating_hours || 8760,
      gri_sector_code: autoGriCode,
      status: organization.status,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!organization) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update(formData)
        .eq('id', organization.id)

      if (error) throw error

      toast.success(t('toastUpdateSuccess'))
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error(t('toastUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!organization) return

    setShowDeleteDialog(false)
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', organization.id)

      if (error) throw error

      toast.success(t('toastDeleteSuccess'))
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error(t('toastDeleteError'))
    } finally {
      setDeleting(false)
    }
  }

  // Computed values
  const canEdit = isSuperAdmin || organization?.is_owner || organization?.role === 'platform_admin'

  const readOnlyStyle: React.CSSProperties = {
    padding: '0.65rem 0.875rem',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'default',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
  }

  // Early return
  if (!isOpen || !organization) return null

  // Render
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '2rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div
          className={styles.section}
          style={{
            maxHeight: '100%',
            overflowY: 'auto',
            width: '100%',
            maxWidth: '1400px',
            padding: '2.25rem',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 className={styles.sectionTitle}>
                {isEditing ? t('titleEdit') : t('titleView')}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '0.375rem 0.875rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.813rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    backgroundColor:
                      organization.status === 'active'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : organization.status === 'setup'
                        ? 'rgba(251, 146, 60, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      organization.status === 'active'
                        ? '#22c55e'
                        : organization.status === 'setup'
                        ? '#fb923c'
                        : '#ef4444',
                    border: `1px solid ${
                      organization.status === 'active'
                        ? 'rgba(34, 197, 94, 0.3)'
                        : organization.status === 'setup'
                        ? 'rgba(251, 146, 60, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`,
                  }}
                >
                  {organization.status === 'active'
                    ? t('statusBadgeActive')
                    : organization.status === 'setup'
                    ? t('statusBadgeSetup')
                    : t('statusBadgeInactive')}
                </span>

                {(isSuperAdmin || organization.role === 'platform_admin') && (
                  <span
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
                )}
                {organization.role && organization.role !== 'platform_admin' && (
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      backgroundColor: organization.is_owner ? 'var(--green)' : '#3b82f6',
                      color: 'white',
                    }}
                  >
                    {organization.role}
                    {organization.is_owner && t('ownerIndicator')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                lineHeight: 1,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              ×
            </button>
          </div>

          {/* Form sections */}
          <div className={styles.form}>
            {/* Basic Information Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1.5rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionBasic')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.basic ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.basic && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.label}>{t('labelOrgName')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.input}
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.name}</div>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                      <label className={styles.label}>{t('labelLegalName')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.input}
                          value={formData.legal_name || ''}
                          onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                          placeholder={t('placeholderLegalName')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.legal_name || t('notSpecified')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelRegion')}</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.region || ''}
                          onChange={(value) => setFormData({ ...formData, region: value })}
                          options={[
                            { value: '', label: t('selectRegion') },
                            { value: 'North America', label: t('regionNorthAmerica') },
                            { value: 'South America', label: t('regionSouthAmerica') },
                            { value: 'Europe', label: t('regionEurope') },
                            { value: 'Asia', label: t('regionAsia') },
                            { value: 'Africa', label: t('regionAfrica') },
                            { value: 'Oceania', label: t('regionOceania') },
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.region || t('notSpecified')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.label}>{t('labelWebsite')}</label>
                      {isEditing ? (
                        <input
                          type="url"
                          className={styles.input}
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder={t('placeholderWebsite')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.website ? (
                            <a
                              href={organization.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--green)' }}
                            >
                              {organization.website}
                            </a>
                          ) : (
                            t('notSpecified')
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Industry & Classification Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('industry')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionIndustry')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.industry ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.industry && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelPrimaryIndustry')}</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.industry_primary || ''}
                          onChange={(value) => {
                            const selectedSector = sectors.find((s) => s.sector_name === value)
                            setFormData({
                              ...formData,
                              industry_primary: value,
                              gri_sector_code: selectedSector?.gri_standard || '',
                            })
                          }}
                          options={[
                            { value: '', label: t('placeholderPrimaryIndustry') },
                            ...sectors.map((sector) => ({
                              value: sector.sector_name,
                              label: sector.gri_standard
                                ? `${sector.sector_name} (${sector.gri_standard})`
                                : sector.sector_name,
                            })),
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.industry_primary || t('notSpecified')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelSecondaryIndustry')}</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.industry_secondary || ''}
                          onChange={(value) => setFormData({ ...formData, industry_secondary: value })}
                          options={[
                            { value: '', label: t('placeholderSecondaryIndustry') },
                            ...sectors.map((sector) => ({
                              value: sector.sector_name,
                              label: sector.gri_standard
                                ? `${sector.sector_name} (${sector.gri_standard})`
                                : sector.sector_name,
                            })),
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.industry_secondary || t('notSpecified')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelStandard')}</label>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            className={styles.input}
                            value={formData.gri_sector_code || ''}
                            onChange={(e) => setFormData({ ...formData, gri_sector_code: e.target.value })}
                            placeholder={t('placeholderStandard')}
                            disabled
                            style={{ opacity: 0.7 }}
                          />
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.25rem',
                            }}
                          >
                            {t('helpStandard')}
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>{organization.gri_sector_code || t('notSpecified')}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Organization Size Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('size')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionSize')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.size ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.size && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelEmployees')}</label>
                      <div style={readOnlyStyle}>
                        {loadingEmployees ? (
                          <span style={{ color: 'var(--text-tertiary)' }}>{t('calculating')}</span>
                        ) : (
                          <>
                            {totalEmployees?.toLocaleString() || '0'}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-tertiary)',
                                marginLeft: '0.5rem',
                              }}
                            >
                              {t('calculatedFromSites')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelCompanySize')}</label>
                      <div style={readOnlyStyle}>
                        {getCompanySize(totalEmployees) || t('notSpecified')}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                            marginLeft: '0.5rem',
                          }}
                        >
                          {t('autoCalculated')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('contact')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionContact')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.contact ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.contact && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelContactEmail')}</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className={styles.input}
                          value={formData.primary_contact_email || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_contact_email: e.target.value })
                          }
                          placeholder={t('placeholderContactEmail')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.primary_contact_email || t('notSpecified')}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelContactPhone')}</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className={styles.input}
                          value={formData.primary_contact_phone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_contact_phone: e.target.value })
                          }
                          placeholder={t('placeholderContactPhone')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.primary_contact_phone || t('notSpecified')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reporting Configuration Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('reporting')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionReporting')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.reporting ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.reporting && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelBaseYear')}</label>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            className={styles.input}
                            value={formData.base_year || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, base_year: parseInt(e.target.value) || null })
                            }
                            placeholder={t('placeholderBaseYear')}
                            min="1900"
                            max="2100"
                          />
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.25rem',
                            }}
                          >
                            {t('helpBaseYear')}
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>{organization.base_year || t('notSpecified')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelConsolidation')}</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.consolidation_approach || ''}
                          onChange={(value) => setFormData({ ...formData, consolidation_approach: value })}
                          options={[
                            { value: '', label: t('selectConsolidation') },
                            { value: 'Operational Control', label: t('consolidationOperational') },
                            { value: 'Financial Control', label: t('consolidationFinancial') },
                            { value: 'Equity Share', label: t('consolidationEquity') },
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.consolidation_approach || t('notSpecified')}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelOperatingHours')}</label>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            className={styles.input}
                            value={formData.annual_operating_hours || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                annual_operating_hours: parseInt(e.target.value) || null,
                              })
                            }
                            placeholder={t('placeholderOperatingHours')}
                          />
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.25rem',
                            }}
                          >
                            {t('helpOperatingHours')}
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_operating_hours
                            ? organization.annual_operating_hours.toLocaleString()
                            : t('notSpecified')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Information Section */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginTop: '1rem',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection('financial')}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionFinancial')}</span>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: expandedSections.financial ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSections.financial && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1.5rem 1rem',
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelRevenue')}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.annual_revenue || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) || null })
                          }
                          placeholder={t('placeholderRevenue')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_revenue
                            ? `$${organization.annual_revenue.toLocaleString()}`
                            : t('notSpecified')}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelCustomers')}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.annual_customers || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, annual_customers: parseInt(e.target.value) || null })
                          }
                          placeholder={t('placeholderCustomers')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_customers
                            ? organization.annual_customers.toLocaleString()
                            : t('notSpecified')}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelPublicCompany')}</label>
                      {isEditing ? (
                        <CustomCheckbox
                          checked={formData.public_company || false}
                          onChange={(checked) => setFormData({ ...formData, public_company: checked })}
                          label={t('checkboxPubliclyTraded')}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.public_company ? t('yes') : t('no')}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{t('labelStockTicker')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.input}
                          value={formData.stock_ticker || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, stock_ticker: e.target.value.toUpperCase() })
                          }
                          placeholder={t('placeholderStockTicker')}
                          disabled={!formData.public_company}
                          style={{ opacity: formData.public_company ? 1 : 0.5 }}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.stock_ticker || t('notSpecified')}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Management Section - Super Admin Only */}
            {isSuperAdmin && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  marginTop: '1rem',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection('status')}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m9-9h-6M7 12H1m16.24-7.76l-4.24 4.24M11 11L6.76 6.76m10.48 10.48l-4.24-4.24M11 13l-4.24 4.24" />
                    </svg>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('sectionStatus')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                      {t('sectionStatusSubtitle')}
                    </span>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: expandedSections.status ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {expandedSections.status && (
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '1.5rem',
                      }}
                    >
                      <div className={styles.formGroup}>
                        <label className={styles.label}>{t('labelStatus')}</label>
                        {isEditing ? (
                          <>
                            <CustomSelect
                              value={formData.status || 'setup'}
                              onChange={(value) =>
                                setFormData({ ...formData, status: value as 'setup' | 'active' | 'inactive' })
                              }
                              options={[
                                { value: 'active', label: t('statusActive') },
                                { value: 'setup', label: t('statusSetup') },
                                { value: 'inactive', label: t('statusInactive') },
                              ]}
                            />
                            <div
                              style={{
                                fontSize: '0.813rem',
                                color: 'var(--text-tertiary)',
                                marginTop: '0.5rem',
                              }}
                            >
                              {t('helpStatus')}
                            </div>
                          </>
                        ) : (
                          <div style={readOnlyStyle}>
                            <span
                              style={{
                                padding: '0.375rem 0.875rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.813rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em',
                                backgroundColor:
                                  organization.status === 'active'
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : organization.status === 'setup'
                                    ? 'rgba(251, 146, 60, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  organization.status === 'active'
                                    ? '#22c55e'
                                    : organization.status === 'setup'
                                    ? '#fb923c'
                                    : '#ef4444',
                                border: `1px solid ${
                                  organization.status === 'active'
                                    ? 'rgba(34, 197, 94, 0.3)'
                                    : organization.status === 'setup'
                                    ? 'rgba(251, 146, 60, 0.3)'
                                    : 'rgba(239, 68, 68, 0.3)'
                                }`,
                              }}
                            >
                              {organization.status === 'active'
                                ? t('statusBadgeActive')
                                : organization.status === 'setup'
                                ? t('statusBadgeSetup')
                                : t('statusBadgeInactive')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Non-editable notice */}
          {!canEdit && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              {t('noticeViewOnly')}
            </div>
          )}

          {/* Action buttons */}
          {isEditing ? (
            <FormActions
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
              isSaving={isSaving}
              saveButtonText={t('buttonSave')}
              isSubmitButton={false}
              confirmCancel={false}
            />
          ) : (
            <div className={styles.buttonGroup}>
              {canEdit && (
                <>
                  <button
                    className={styles.button}
                    style={{
                      background: 'var(--red)',
                      color: 'white',
                      marginRight: 'auto',
                    }}
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    {isDeleting ? t('buttonDeleting') : t('buttonDelete')}
                  </button>
                  <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleEdit}>
                    {t('buttonEdit')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={t('dialogDeleteTitle')}
        message={t('dialogDeleteMessage').replace('{name}', organization?.name || '')}
        confirmText={t('dialogDeleteConfirm')}
        cancelText={t('dialogDeleteCancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
        requireTextConfirmation={true}
        confirmationText={t('dialogDeleteConfirmText')}
      />
    </>
  )
}
