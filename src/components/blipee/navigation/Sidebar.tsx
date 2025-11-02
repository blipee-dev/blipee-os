/**
 * Blipee Sidebar Component
 * Collapsible sidebar navigation with sections and items
 * Exact replica from docs/js/components.js
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebar } from '../hooks/useSidebar';

export type SidebarItemKey =
  | 'dashboard'
  | 'analytics'
  | 'reports'
  | 'consumption'
  | 'cost-analysis'
  | 'efficiency'
  | 'goals'
  | 'billing'
  | 'integrations'
  | 'preferences';

export interface SidebarItemProps {
  /** Unique key for the item */
  key: SidebarItemKey;
  /** Display label */
  label: string;
  /** SVG icon paths/elements */
  icon: React.ReactNode;
  /** Link href */
  href?: string;
}

export interface SidebarSectionProps {
  /** Section title */
  title: string;
  /** Section items */
  items: SidebarItemProps[];
}

export interface SidebarProps {
  /** Active item key */
  activeItem?: SidebarItemKey;
  /** Custom sections (optional, uses default if not provided) */
  sections?: SidebarSectionProps[];
  /** Custom class name */
  className?: string;
}

// Default sidebar configuration from docs/js/components.js
const defaultSections: SidebarSectionProps[] = [
  {
    title: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </>
        ),
      },
      {
        key: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: (
          <>
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </>
        ),
      },
      {
        key: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: (
          <>
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </>
        ),
      },
    ],
  },
  {
    title: 'Energy',
    items: [
      {
        key: 'consumption',
        label: 'Consumption',
        href: '/consumption',
        icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
      },
      {
        key: 'cost-analysis',
        label: 'Cost Analysis',
        href: '/cost-analysis',
        icon: (
          <>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        ),
      },
      {
        key: 'efficiency',
        label: 'Efficiency',
        href: '/efficiency',
        icon: (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </>
        ),
      },
      {
        key: 'goals',
        label: 'Goals',
        href: '/goals',
        icon: (
          <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </>
        ),
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        key: 'billing',
        label: 'Billing',
        href: '/billing',
        icon: (
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        ),
      },
      {
        key: 'integrations',
        label: 'Integrations',
        href: '/integrations',
        icon: (
          <>
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </>
        ),
      },
      {
        key: 'preferences',
        label: 'Preferences',
        href: '/preferences',
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ),
      },
    ],
  },
];

export function Sidebar({
  activeItem = 'dashboard',
  sections = defaultSections,
  className = '',
}: SidebarProps) {
  const { sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const isActive = (itemKey: SidebarItemKey) => itemKey === activeItem;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${className}`} id="sidebar">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="sidebar-section">
          <div className="sidebar-section-title">{section.title}</div>
          {section.items.map((item) => (
            <Link
              key={item.key}
              href={item.href || '#'}
              className={`sidebar-item ${isActive(item.key) ? 'active' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
