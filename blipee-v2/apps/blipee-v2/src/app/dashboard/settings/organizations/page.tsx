'use client'

import { useState, useEffect } from 'react'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'

export default function OrganizationsPage() {
  const { organization, loading } = useUserOrganization()

  if (loading) {
    return (
      <div className={styles.section}>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>No Organization</h2>
        <p className={styles.sectionDescription}>
          You are not associated with any organization.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Organization Information</h2>
        <p className={styles.sectionDescription}>
          Details about your organization
        </p>

        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Name</label>
              <input
                type="text"
                className={styles.input}
                value={organization.name}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Industry</label>
              <input
                type="text"
                className={styles.input}
                value={organization.industry || 'Not specified'}
                disabled
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Size</label>
              <input
                type="text"
                className={styles.input}
                value={organization.company_size || 'Not specified'}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Number of Employees</label>
              <input
                type="text"
                className={styles.input}
                value={organization.employees || 'Not specified'}
                disabled
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Your Role</label>
              <input
                type="text"
                className={styles.input}
                value={`${organization.role}${organization.is_owner ? ' (Owner)' : ''}`}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Organization ID</label>
              <input
                type="text"
                className={styles.input}
                value={organization.id}
                disabled
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {organization.is_owner && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Owner Actions</h2>
          <p className={styles.sectionDescription}>
            As owner, you can manage advanced settings
          </p>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              disabled
            >
              Edit Organization (Coming soon)
            </button>
          </div>
        </div>
      )}
    </>
  )
}
