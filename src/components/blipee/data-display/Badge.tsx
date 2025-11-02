/**
 * Blipee Badge Component
 * Status badge with predefined variants
 * Styled by docs/css .status-badge class
 */

'use client';

import React from 'react';

export type BadgeVariant =
  | 'on-track'
  | 'at-risk'
  | 'critical'
  | 'completed'
  | 'pending'
  | 'default';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantClass = variant !== 'default' ? `status-${variant}` : '';

  return (
    <span className={`status-badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
