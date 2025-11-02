/**
 * Blipee Navbar Component
 * Main navigation bar with dashboard links, notifications, and user menu
 * Exact replica from docs/js/components.js
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../theme/useTheme';

export type NavPage = 'energy' | 'water' | 'carbon' | 'waste' | '';

export interface NavbarProps {
  /** Active page for highlighting */
  activePage?: NavPage;
  /** Notification count */
  notificationCount?: number;
  /** User info */
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  /** Custom class name */
  className?: string;
}

export function Navbar({
  activePage = '',
  notificationCount = 0,
  user = {
    name: 'John Doe',
    email: 'john.doe@company.com',
  },
  className = '',
}: NavbarProps) {
  const { toggleTheme } = useTheme();

  const isActive = (page: NavPage) => page === activePage;

  // Generate avatar URL
  const avatarUrl =
    user.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=10b981&color=fff&size=40`;

  return (
    <nav className={className}>
      <div className="nav-container">
        <Link href="/" className="logo">
          blipee
        </Link>

        {/* Dashboard Navigation Links */}
        <ul className="nav-links">
          <li>
            <Link
              href="/energy"
              className={`nav-link ${isActive('energy') ? 'active' : ''}`}
            >
              Energy
            </Link>
          </li>
          <li>
            <Link
              href="/water"
              className={`nav-link ${isActive('water') ? 'active' : ''}`}
            >
              Water
            </Link>
          </li>
          <li>
            <Link
              href="/carbon"
              className={`nav-link ${isActive('carbon') ? 'active' : ''}`}
            >
              Carbon
            </Link>
          </li>
          <li>
            <Link
              href="/waste"
              className={`nav-link ${isActive('waste') ? 'active' : ''}`}
            >
              Waste
            </Link>
          </li>
        </ul>

        {/* Right Side Actions */}
        <div className="nav-actions">
          {/* Notifications */}
          <button className="icon-btn" aria-label="Notifications">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          {/* Settings */}
          <button className="icon-btn" aria-label="Settings">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.196-15.804L13.464 6.93m-2.93 2.928l-3.732-3.734M23 12h-6m-6 0H1m15.804-5.196L13.072 10.54m-2.928 2.93l-3.734 3.732M23 12h-6m-6 0H1m15.804 5.196L13.072 13.46m-2.928-2.93l-3.734 3.732" />
            </svg>
          </button>

          {/* User Profile */}
          <div className="user-menu">
            <button className="user-avatar" aria-label="User menu">
              <img src={avatarUrl} alt={`${user.name} avatar`} />
            </button>
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <div className="dropdown-divider" />

              {/* Theme Toggle in Dropdown */}
              <button
                className="dropdown-item theme-toggle-item"
                onClick={toggleTheme}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    className="moon-icon"
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  />
                  <g className="sun-icon">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </g>
                </svg>
                <span className="theme-label" />
                <div className="theme-switch">
                  <div className="theme-switch-slider" />
                </div>
              </button>

              <div className="dropdown-divider" />
              <Link href="/profile" className="dropdown-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </Link>
              <Link href="/organization" className="dropdown-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Organization
              </Link>
              <Link href="/settings" className="dropdown-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>
              <div className="dropdown-divider" />
              <Link href="/signin" className="dropdown-item logout">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
