/**
 * Blipee Input Component
 * Text input field with glass morphism styling
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Custom class name for input */
  className?: string;
  /** Custom class name for container */
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helpText,
  className = '',
  containerClassName = '',
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`form-group ${containerClassName}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}

      <input
        id={inputId}
        className={`form-input ${hasError ? 'error' : ''} ${className}`.trim()}
        required={required}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />

      {error && (
        <span id={`${inputId}-error`} className="form-error">
          {error}
        </span>
      )}

      {helpText && !error && (
        <span id={`${inputId}-help`} className="form-help">
          {helpText}
        </span>
      )}
    </div>
  );
}
