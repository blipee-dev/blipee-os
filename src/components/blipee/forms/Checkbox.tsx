/**
 * Blipee Checkbox Component
 * Checkbox input with label
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Checkbox label */
  label: string;
  /** Error message */
  error?: string;
  /** Custom class name for checkbox */
  className?: string;
  /** Custom class name for container */
  containerClassName?: string;
}

export function Checkbox({
  label,
  error,
  className = '',
  containerClassName = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`form-group ${containerClassName}`.trim()}>
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          id={checkboxId}
          className={`checkbox ${hasError ? 'error' : ''} ${className}`.trim()}
          aria-invalid={hasError}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        />
        <label htmlFor={checkboxId} className="checkbox-label">
          {label}
        </label>
      </div>

      {error && (
        <span id={`${checkboxId}-error`} className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
