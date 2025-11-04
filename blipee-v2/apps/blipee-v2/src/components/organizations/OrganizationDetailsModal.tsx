'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
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

      toast.success('Organization updated successfully!')
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error('Failed to update organization')
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

      toast.success('Organization deleted successfully!')
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error('Failed to delete organization')
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
                {isEditing ? 'Edit Organization' : 'Organization Details'}
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
                    ? '● Active'
                    : organization.status === 'setup'
                    ? '⚙ Setup'
                    : '✖ Inactive'}
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
                    Super Admin Access
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
                    {organization.is_owner && ' • Owner'}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Basic Information</span>
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
                      <label className={styles.label}>Organization Name</label>
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
                      <label className={styles.label}>Legal Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.input}
                          value={formData.legal_name || ''}
                          onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                          placeholder="Official legal name"
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.legal_name || 'Not specified'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Region</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.region || ''}
                          onChange={(value) => setFormData({ ...formData, region: value })}
                          options={[
                            { value: '', label: 'Select region' },
                            { value: 'North America', label: 'North America' },
                            { value: 'South America', label: 'South America' },
                            { value: 'Europe', label: 'Europe' },
                            { value: 'Asia', label: 'Asia' },
                            { value: 'Africa', label: 'Africa' },
                            { value: 'Oceania', label: 'Oceania' },
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.region || 'Not specified'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.label}>Website</label>
                      {isEditing ? (
                        <input
                          type="url"
                          className={styles.input}
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
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
                            'Not specified'
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Industry & Classification</span>
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
                      <label className={styles.label}>Primary Industry</label>
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
                            { value: '', label: 'Select primary industry' },
                            ...sectors.map((sector) => ({
                              value: sector.sector_name,
                              label: sector.gri_standard
                                ? `${sector.sector_name} (${sector.gri_standard})`
                                : sector.sector_name,
                            })),
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.industry_primary || 'Not specified'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Secondary Industry</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.industry_secondary || ''}
                          onChange={(value) => setFormData({ ...formData, industry_secondary: value })}
                          options={[
                            { value: '', label: 'None (optional)' },
                            ...sectors.map((sector) => ({
                              value: sector.sector_name,
                              label: sector.gri_standard
                                ? `${sector.sector_name} (${sector.gri_standard})`
                                : sector.sector_name,
                            })),
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.industry_secondary || 'Not specified'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Standard</label>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            className={styles.input}
                            value={formData.gri_sector_code || ''}
                            onChange={(e) => setFormData({ ...formData, gri_sector_code: e.target.value })}
                            placeholder="e.g., GRI 11"
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
                            Auto-filled from primary industry selection
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>{organization.gri_sector_code || 'Not specified'}</div>
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Organization Size</span>
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
                      <label className={styles.label}>Number of Employees</label>
                      <div style={readOnlyStyle}>
                        {loadingEmployees ? (
                          <span style={{ color: 'var(--text-tertiary)' }}>Calculating...</span>
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
                              (calculated from sites)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Company Size</label>
                      <div style={readOnlyStyle}>
                        {getCompanySize(totalEmployees) || 'Not specified'}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                            marginLeft: '0.5rem',
                          }}
                        >
                          (auto-calculated)
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Contact Information</span>
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
                      <label className={styles.label}>Primary Contact Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className={styles.input}
                          value={formData.primary_contact_email || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_contact_email: e.target.value })
                          }
                          placeholder="contact@example.com"
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.primary_contact_email || 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Primary Contact Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className={styles.input}
                          value={formData.primary_contact_phone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_contact_phone: e.target.value })
                          }
                          placeholder="+1 (555) 123-4567"
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.primary_contact_phone || 'Not specified'}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Reporting Configuration</span>
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
                      <label className={styles.label}>Base Year</label>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            className={styles.input}
                            value={formData.base_year || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, base_year: parseInt(e.target.value) || null })
                            }
                            placeholder="2024"
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
                            Used for baseline emissions calculations and reduction targets
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>{organization.base_year || 'Not specified'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Consolidation Approach</label>
                      {isEditing ? (
                        <CustomSelect
                          value={formData.consolidation_approach || ''}
                          onChange={(value) => setFormData({ ...formData, consolidation_approach: value })}
                          options={[
                            { value: '', label: 'Select approach' },
                            { value: 'Operational Control', label: 'Operational Control' },
                            { value: 'Financial Control', label: 'Financial Control' },
                            { value: 'Equity Share', label: 'Equity Share' },
                          ]}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.consolidation_approach || 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Annual Operating Hours</label>
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
                            placeholder="8760"
                          />
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.25rem',
                            }}
                          >
                            Default: 8,760 hours (24h × 365 days). Adjust for actual operation schedule.
                          </div>
                        </>
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_operating_hours
                            ? organization.annual_operating_hours.toLocaleString()
                            : 'Not specified'}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Financial Information</span>
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
                      <label className={styles.label}>Annual Revenue</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.annual_revenue || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) || null })
                          }
                          placeholder="Revenue in USD"
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_revenue
                            ? `$${organization.annual_revenue.toLocaleString()}`
                            : 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Annual Customers</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.annual_customers || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, annual_customers: parseInt(e.target.value) || null })
                          }
                          placeholder="Number of customers"
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {organization.annual_customers
                            ? organization.annual_customers.toLocaleString()
                            : 'Not specified'}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Public Company</label>
                      {isEditing ? (
                        <CustomCheckbox
                          checked={formData.public_company || false}
                          onChange={(checked) => setFormData({ ...formData, public_company: checked })}
                          label="Publicly traded"
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.public_company ? 'Yes' : 'No'}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Stock Ticker</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.input}
                          value={formData.stock_ticker || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, stock_ticker: e.target.value.toUpperCase() })
                          }
                          placeholder="e.g., AAPL"
                          disabled={!formData.public_company}
                          style={{ opacity: formData.public_company ? 1 : 0.5 }}
                        />
                      ) : (
                        <div style={readOnlyStyle}>{organization.stock_ticker || 'Not specified'}</div>
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
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Status Management</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                      (Super Admin Only)
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
                        <label className={styles.label}>Organization Status</label>
                        {isEditing ? (
                          <>
                            <CustomSelect
                              value={formData.status || 'setup'}
                              onChange={(value) =>
                                setFormData({ ...formData, status: value as 'setup' | 'active' | 'inactive' })
                              }
                              options={[
                                { value: 'active', label: 'Active' },
                                { value: 'setup', label: 'Setup Required' },
                                { value: 'inactive', label: 'Inactive (Manually Disabled)' },
                              ]}
                            />
                            <div
                              style={{
                                fontSize: '0.813rem',
                                color: 'var(--text-tertiary)',
                                marginTop: '0.5rem',
                              }}
                            >
                              Status is automatically calculated: <strong>Active</strong> = has account owner +
                              sites. Only set to <strong>Inactive</strong> manually if needed.
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
                                ? '● Active'
                                : organization.status === 'setup'
                                ? '⚙ Setup'
                                : '✖ Inactive'}
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
              ℹ️ You can view this organization but cannot edit it.
            </div>
          )}

          {/* Action buttons */}
          {isEditing ? (
            <FormActions
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
              isSaving={isSaving}
              saveButtonText="Save"
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
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleEdit}>
                    Edit
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
        title="Delete Organization"
        message={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
        requireTextConfirmation={true}
        confirmationText="delete_organization"
      />
    </>
  )
}
