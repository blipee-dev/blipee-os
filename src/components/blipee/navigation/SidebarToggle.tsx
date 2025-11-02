/**
 * Blipee Sidebar Toggle Button
 * Button to collapse/expand the sidebar
 * Exact replica from docs/js/components.js
 */

'use client';

import React from 'react';
import { useSidebar } from '../hooks/useSidebar';

export interface SidebarToggleProps {
  /** Custom class name */
  className?: string;
  /** Custom aria label */
  ariaLabel?: string;
}

export function SidebarToggle({
  className = '',
  ariaLabel = 'Toggle sidebar',
}: SidebarToggleProps) {
  const { toggleSidebar, sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  return (
    <button
      className={`sidebar-toggle ${className}`}
      id="sidebarToggle"
      onClick={toggleSidebar}
      aria-label={ariaLabel}
      aria-expanded={!isCollapsed}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
