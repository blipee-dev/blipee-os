/**
 * Blipee Radio Component
 * Radio button input with label
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Radio group label */
  label?: string;
  /** Radio group name */
  name: string;
  /** Radio options */
  options: RadioOption[];
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Display orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom class name for container */
  className?: string;
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  helpText,
  orientation = 'vertical',
  className = '',
}: RadioGroupProps) {
  const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`form-group ${className}`.trim()} role="radiogroup" aria-labelledby={label ? groupId : undefined}>
      {label && (
        <div id={groupId} className="form-label">
          {label}
        </div>
      )}

      <div className={`radio-group radio-group-${orientation}`}>
        {options.map((option) => {
          const radioId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="radio-wrapper">
              <input
                type="radio"
                id={radioId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                disabled={option.disabled}
                className={`radio ${hasError ? 'error' : ''}`.trim()}
                aria-invalid={hasError}
              />
              <label htmlFor={radioId} className="radio-label">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}

      {helpText && !error && (
        <span className="form-help">
          {helpText}
        </span>
      )}
    </div>
  );
}
