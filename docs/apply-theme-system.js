#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FILES_TO_UPDATE = [
  'privacy.html',
  'terms.html',
  'contact.html',
  'updates.html',
  'documentation.html',
  'api.html',
  'support.html',
  'status.html',
  '403.html',
  '404.html',
  '500.html',
  '503.html',
  'signin.html',
  'signup.html',
  'forgot-password.html',
  'reset-password.html'
];

const DOCS_DIR = __dirname;

const NEW_ROOT_CSS = `      :root {
        /* Gradient System (shared between modes) */
        --gradient-primary: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%);
        --gradient-mesh:
          radial-gradient(at 40% 20%, hsla(160, 100%, 50%, 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsla(125, 100%, 70%, 0.2) 0px, transparent 50%);
        --green: #10b981;
        --blue: #0ea5e9;
        --cyan: #06b6d4;
      }

      /* Dark Mode (default) */
      body[data-theme="dark"] {
        --bg-primary: #020617;
        --bg-secondary: #0f172a;
        --text-primary: #ffffff;
        --text-secondary: rgba(255, 255, 255, 0.8);
        --text-tertiary: rgba(255, 255, 255, 0.7);
        --glass-bg: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
        --nav-bg: rgba(2, 6, 23, 0.8);
        --footer-bg: rgba(2, 6, 23, 0.9);
      }

      /* Light Mode */
      body[data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #f8fafc;
        --text-primary: #0f172a;
        --text-secondary: #334155;
        --text-tertiary: #64748b;
        --glass-bg: rgba(255, 255, 255, 0.9);
        --glass-border: rgba(15, 23, 42, 0.1);
        --nav-bg: rgba(255, 255, 255, 0.9);
        --footer-bg: #f8fafc;
      }`;

const THEME_TOGGLE_CSS = `
      /* Theme Toggle */
      .theme-toggle-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .theme-toggle {
        position: relative;
        width: 48px;
        height: 26px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        padding: 0 2px;
      }

      .theme-toggle:hover {
        border-color: var(--green);
      }

      .theme-toggle-slider {
        width: 22px;
        height: 22px;
        background: var(--gradient-primary);
        border-radius: 50%;
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      body[data-theme="light"] .theme-toggle-slider {
        transform: translateX(22px);
      }

      .theme-toggle-icon {
        width: 14px;
        height: 14px;
        color: #ffffff;
      }

      .moon-icon {
        display: block;
      }

      .sun-icon {
        display: none;
      }

      body[data-theme="light"] .moon-icon {
        display: none;
      }

      body[data-theme="light"] .sun-icon {
        display: block;
      }`;

const THEME_TOGGLE_HTML = `
            <div class="theme-toggle-container">
              <div class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
                <div class="theme-toggle-slider">
                  <svg class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                </div>
              </div>
            </div>`;

const THEME_JS = `
    <script>
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

      // Initialize theme on page load
      initTheme();

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('blipee-theme')) {
          const newTheme = e.matches ? 'dark' : 'light';
          document.body.setAttribute('data-theme', newTheme);
        }
      });
    </script>`;

function applyThemeSystem(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Step 1: Replace :root CSS variables
  content = content.replace(
    /:root\s*\{[\s\S]*?\n      \}/,
    NEW_ROOT_CSS
  );

  // Step 2: Update body styling
  content = content.replace(
    /(body\s*\{[\s\S]*?)background:\s*var\(--darker\)/,
    '$1background: var(--bg-primary)'
  );
  content = content.replace(
    /(body\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );

  // Add transition if not present
  if (content.includes('body {') && !content.match(/body\s*\{[\s\S]*?transition:/)) {
    content = content.replace(
      /(body\s*\{[\s\S]*?)(min-height:[\s\S]*?\n)/,
      '$1$2        transition: background-color 0.3s ease, color 0.3s ease;\n'
    );
  }

  // Step 3: Update nav styling
  content = content.replace(
    /(nav\s*\{[\s\S]*?)background:\s*rgba\(2,\s*6,\s*23,\s*0\.8\)/g,
    '$1background: var(--nav-bg)'
  );

  // Add transition to nav
  if (content.includes('nav {') && !content.match(/nav\s*\{[\s\S]*?transition:[\s\S]*?background/)) {
    content = content.replace(
      /(nav\s*\{[\s\S]*?border-bottom:[^\n]*\n)/,
      '$1        transition: background-color 0.3s ease;\n'
    );
  }

  // Step 4: Update navigation links
  content = content.replace(
    /(\.nav-links\s+a\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.8\)/,
    '$1color: var(--text-secondary)'
  );
  content = content.replace(
    /(\.nav-links\s+a:hover\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );

  // Step 5: Update button styling with !important
  content = content.replace(
    /(\.btn-primary\s*\{[\s\S]*?)color:\s*var\(--white\)/g,
    '$1color: #ffffff !important'
  );
  content = content.replace(
    /(\.btn-primary\s*\{[\s\S]*?)color:\s*#ffffff;/g,
    '$1color: #ffffff !important;'
  );

  // Add !important to btn-primary hover if not present
  if (content.match(/\.btn-primary:hover/) && !content.match(/\.btn-primary:hover[\s\S]*?color:[\s\S]*?!important/)) {
    content = content.replace(
      /(\.btn-primary:hover\s*\{[\s\S]*?)(})/,
      '$1        color: #ffffff !important;\n      $2'
    );
  }

  // Step 6: Replace ALL color references
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.85\)/g, 'var(--text-secondary)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.8\)/g, 'var(--text-secondary)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.7\)/g, 'var(--text-tertiary)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.6\)/g, 'var(--text-tertiary)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.95\)/g, 'var(--text-primary)');

  // Update footer
  content = content.replace(
    /(\.footer\s*\{[\s\S]*?)background:\s*rgba\(2,\s*6,\s*23,\s*0\.9\)/,
    '$1background: var(--footer-bg)'
  );
  content = content.replace(
    /(\.footer\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/,
    '$1color: var(--text-tertiary)'
  );

  // Add transition to footer
  if (content.includes('.footer {') && !content.match(/\.footer\s*\{[\s\S]*?transition:/)) {
    content = content.replace(
      /(\.footer\s*\{[\s\S]*?)(color:[^\n]*\n)/,
      '$1$2        transition: background-color 0.3s ease;\n'
    );
  }

  // Update footer elements
  content = content.replace(
    /(\.footer-section\s+h4\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );
  content = content.replace(
    /(\.footer-description\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/g,
    '$1color: var(--text-tertiary)'
  );
  content = content.replace(
    /(\.social-link\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/,
    '$1background: var(--glass-bg)'
  );
  content = content.replace(
    /(\.social-link\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/,
    '$1color: var(--text-tertiary)'
  );
  content = content.replace(
    /(\.social-link:hover\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: #ffffff'
  );

  content = content.replace(
    /(\.footer-link\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/,
    '$1color: var(--text-tertiary)'
  );
  content = content.replace(
    /(\.footer-link:hover\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );

  // Newsletter input
  content = content.replace(
    /(\.newsletter-input\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/,
    '$1background: var(--glass-bg)'
  );
  content = content.replace(
    /(\.newsletter-input\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );
  content = content.replace(
    /\.newsletter-input::placeholder\s*\{[\s\S]*?color:\s*rgba\(255,\s*255,\s*255,\s*0\.3\);[\s\S]*?\}/,
    `.newsletter-input::placeholder {
        color: var(--text-tertiary);
        opacity: 0.5;
      }`
  );

  // Newsletter button
  content = content.replace(
    /(\.newsletter-btn\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: #ffffff'
  );

  // Footer bottom links
  content = content.replace(
    /(\.footer-bottom-links\s+a\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/,
    '$1color: var(--text-tertiary)'
  );
  content = content.replace(
    /(\.footer-bottom-links\s+a:hover\s*\{[\s\S]*?)color:\s*var\(--white\)/,
    '$1color: var(--text-primary)'
  );

  // Step 7: Add footer grid alignment
  if (content.includes('.footer-grid {') && !content.includes('align-items: start')) {
    content = content.replace(
      /(\.footer-grid\s*\{[\s\S]*?margin-bottom:[^\n]*\n)/,
      '$1        align-items: start;\n'
    );
  }

  // Step 8: Add theme toggle CSS (before media queries)
  const hasFooter = content.includes('.footer {');
  if (hasFooter && !content.includes('.theme-toggle-container')) {
    content = content.replace(
      /(\n\s*@media\s*\(max-width)/,
      THEME_TOGGLE_CSS + '$1'
    );
  }

  // Step 9: Add theme toggle HTML (after social icons, if footer exists)
  if (hasFooter && content.includes('.footer-social') && !content.includes('theme-toggle-container')) {
    content = content.replace(
      /([\s]*<\/div>\s*\n\s*<\/div>\s*\n\s*\n\s*<div class="footer-section">)/,
      THEME_TOGGLE_HTML + '\n          </div>\n\n          <div class="footer-section">'
    );
  }

  // Step 10: Add JavaScript (before </body>)
  if (!content.includes('function initTheme()')) {
    content = content.replace(
      /(\s*<\/body>)/,
      THEME_JS + '$1'
    );
  }

  // Write back
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Successfully updated ${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`⚠ No changes made to ${path.basename(filePath)}`);
    return false;
  }
}

// Main execution
console.log('Starting theme system application...\n');

let successCount = 0;
const updatedFiles = [];

FILES_TO_UPDATE.forEach(filename => {
  const filePath = path.join(DOCS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`✗ File not found: ${filename}`);
    return;
  }

  try {
    if (applyThemeSystem(filePath)) {
      successCount++;
      updatedFiles.push(filename);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);
  }
});

console.log(`\n=================================`);
console.log(`Theme system applied successfully!`);
console.log(`Files updated: ${successCount}/${FILES_TO_UPDATE.length}`);
console.log(`=================================\n`);

if (updatedFiles.length > 0) {
  console.log('Updated files:');
  updatedFiles.forEach(file => console.log(`  - ${file}`));
}
