/**
 * Blipee Button Component
 * Simple button matching HTML implementation exactly
 */

'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'icon';

export interface ButtonProps {
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  badge?: string | number;
}

export function Button({
  variant = 'primary',
  disabled = false,
  icon,
  children,
  className = '',
  onClick,
  type = 'button',
  ariaLabel,
  badge,
}: ButtonProps) {
  // Icon button with badge
  if (variant === 'icon') {
    return (
      <>
        <style jsx>{`
          .icon-btn {
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .icon-btn:hover {
            background: var(--glass-border);
            border-color: var(--green);
          }

          .icon-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--gradient-primary);
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
          }
        `}</style>

        <button
          type={type}
          className={`icon-btn ${className}`.trim()}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {icon}
          {badge !== undefined && (
            <span className="notification-badge">{badge}</span>
          )}
        </button>
      </>
    );
  }

  // Regular button (primary or ghost)
  return (
    <>
      <style jsx>{`
        .btn {
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 40px;
        }

        @media (min-width: 640px) {
          .btn {
            padding: 0.875rem 1.5rem;
            font-size: 0.95rem;
            min-height: 44px;
          }
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: #ffffff;
          box-shadow: 0 4px 15px 0 rgba(16, 185, 129, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.4);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
        }

        .btn-ghost:hover:not(:disabled) {
          background: var(--glass-bg);
          border-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <button
        type={type}
        className={`btn btn-${variant} ${className}`.trim()}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {icon && icon}
        {children}
      </button>
    </>
  );
}
