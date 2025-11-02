/**
 * Blipee Select Component
 * Dropdown select field with glass morphism styling
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Select label */
  label?: string;
  /** Select options */
  options: SelectOption[];
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Placeholder option */
  placeholder?: string;
  /** Custom class name for select */
  className?: string;
  /** Custom class name for container */
  containerClassName?: string;
}

export function Select({
  label,
  options,
  error,
  helpText,
  placeholder,
  className = '',
  containerClassName = '',
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`form-group ${containerClassName}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}

      <select
        id={selectId}
        className={`form-input ${hasError ? 'error' : ''} ${className}`.trim()}
        required={required}
        aria-invalid={hasError}
        aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={`${selectId}-error`} className="form-error">
          {error}
        </span>
      )}

      {helpText && !error && (
        <span id={`${selectId}-help`} className="form-help">
          {helpText}
        </span>
      )}
    </div>
  );
}
