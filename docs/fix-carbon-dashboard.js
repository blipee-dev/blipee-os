const fs = require('fs');

let content = fs.readFileSync('carbon-dashboard.html', 'utf8');

// Find and replace the component wrapper section
const oldContentWrapper = /<!-- Content Wrapper -->\s*<div class="content-wrapper" id="app">\s*<!-- Components \(navbar and sidebar\) will be loaded here by JavaScript -->\s*<\/div>/;

const newContentWrapper = `<!-- Content Wrapper -->
    <div class="content-wrapper">
    <!-- Navigation -->
    <nav>
      <div class="nav-container">
        <a href="index.html" class="logo">blipee</a>

        <!-- Dashboard Navigation Links -->
        <ul class="nav-links">
          <li><a href="energy-dashboard.html" class="nav-link">Energy</a></li>
          <li><a href="#" class="nav-link">Water</a></li>
          <li><a href="carbon-dashboard.html" class="nav-link active">Carbon</a></li>
          <li><a href="#" class="nav-link">Waste</a></li>
        </ul>

        <!-- Right Side Actions -->
        <div class="nav-actions">
          <!-- Notifications -->
          <button class="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-badge">3</span>
          </button>

          <!-- Settings -->
          <button class="icon-btn" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m5.196-15.804L13.464 6.93m-2.93 2.928l-3.732-3.734M23 12h-6m-6 0H1m15.804-5.196L13.072 10.54m-2.928 2.93l-3.734 3.732M23 12h-6m-6 0H1m15.804 5.196L13.072 13.46m-2.928-2.93l-3.734 3.732"/>
            </svg>
          </button>

          <!-- User Profile -->
          <div class="user-menu">
            <button class="user-avatar" aria-label="User menu">
              <img src="https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff&size=40" alt="User avatar" />
            </button>
            <div class="user-dropdown">
              <div class="user-info">
                <div class="user-name">John Doe</div>
                <div class="user-email">john.doe@company.com</div>
              </div>
              <div class="dropdown-divider"></div>

              <!-- Theme Toggle in Dropdown -->
              <div class="dropdown-item theme-toggle-item" onclick="toggleTheme()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path class="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  <g class="sun-icon">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </g>
                </svg>
                <span class="theme-label"></span>
                <div class="theme-switch">
                  <div class="theme-switch-slider"></div>
                </div>
              </div>

              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                My Profile
              </a>
              <a href="#" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Organization
              </a>
              <a href="#" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </a>
              <div class="dropdown-divider"></div>
              <a href="signin.html" class="dropdown-item logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">Overview</div>
        <a href="#" class="sidebar-item active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
          <span>Analytics</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10"/>
            <path d="M18 20V4"/>
            <path d="M6 20v-4"/>
          </svg>
          <span>Reports</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Energy</div>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Consumption</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Cost Analysis</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <span>Efficiency</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Goals</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Settings</div>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Billing</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7h-9"/>
            <path d="M14 17H5"/>
            <circle cx="17" cy="17" r="3"/>
            <circle cx="7" cy="7" r="3"/>
          </svg>
          <span>Integrations</span>
        </a>
        <a href="#" class="sidebar-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Preferences</span>
        </a>
      </div>
    </aside>

    <!-- Sidebar Toggle Button -->
    <button class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()" aria-label="Toggle sidebar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
`;

content = content.replace(oldContentWrapper, newContentWrapper);

// Remove component loader script reference
content = content.replace(/\s*<!-- Component Loader -->\s*<script src="\.\/js\/components\.js"><\/script>\s*/g, '');

// Update the JavaScript - remove initDashboardComponents call and add theme/sidebar functions
content = content.replace(
  /document\.addEventListener\('DOMContentLoaded', \(\) => \{\s*initDashboardComponents\(\);/,
  `document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initSidebar();`
);

// Add the theme and sidebar functions before the closing script tag
const functionsToAdd = `
      // Theme Toggle System
      function initTheme() {
        const savedTheme = localStorage.getItem('blipee-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.body.setAttribute('data-theme', theme);
      }

      function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('blipee-theme', newTheme);
      }

      // Sidebar Toggle System
      function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
          sidebar.classList.remove('collapsed');
          mainContent.classList.remove('expanded');
          localStorage.setItem('blipee-sidebar', 'expanded');
        } else {
          sidebar.classList.add('collapsed');
          mainContent.classList.add('expanded');
          localStorage.setItem('blipee-sidebar', 'collapsed');
        }
      }

      function initSidebar() {
        const savedState = localStorage.getItem('blipee-sidebar');
        if (savedState === 'collapsed') {
          document.getElementById('sidebar').classList.add('collapsed');
          document.getElementById('mainContent').classList.add('expanded');
        }
      }

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('blipee-theme')) {
          document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
`;

// Insert the functions before the generateCharts function
content = content.replace(
  /(\s+function generateCharts\(\))/,
  functionsToAdd + '\n$1'
);

// Add closing div for content-wrapper before closing body tag
content = content.replace(
  /(\s*<\/body>)/,
  '    </div>\n$1'
);

fs.writeFileSync('carbon-dashboard.html', content, 'utf8');
console.log('✓ Fixed carbon dashboard with embedded navbar and sidebar');
