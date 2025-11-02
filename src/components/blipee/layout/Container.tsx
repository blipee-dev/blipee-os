/**
 * Blipee Container Component
 * Provides consistent max-width and responsive padding for content
 */

'use client';

import React from 'react';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps {
  size?: ContainerSize;
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const sizeMap: Record<ContainerSize, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};

export function Container({
  size = 'xl',
  children,
  className = '',
  padding = true,
}: ContainerProps) {
  return (
    <div
      className={className}
      style={{
        maxWidth: sizeMap[size],
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: padding ? '1rem' : '0',
        paddingRight: padding ? '1rem' : '0',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
