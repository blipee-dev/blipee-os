'use client'

import styles from './CustomCheckbox.module.css'

interface CustomCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export default function CustomCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false
}: CustomCheckboxProps) {
  return (
    <label className={`${styles.checkboxContainer} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.hiddenCheckbox}
        />
        <div className={`${styles.customCheckbox} ${checked ? styles.checked : ''}`}>
          {checked && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
      {(label || description) && (
        <div className={styles.labelWrapper}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </label>
  )
}
