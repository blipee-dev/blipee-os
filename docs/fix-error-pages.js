const fs = require('fs');

const files = ['403.html', '404.html', '500.html', '503.html'];

files.forEach(filename => {
  console.log(`\nFixing ${filename}...`);
  
  let content = fs.readFileSync(filename, 'utf8');
  
  // Fix 1: Remove duplicate theme sections
  const duplicateThemeRegex = /(body\[data-theme="dark"\]\s*\{[^}]*--text-secondary:\s*var\(--text-secondary\);[^}]*\}\s*\/\*\s*Light Mode\s*\*\/\s*body\[data-theme="light"\]\s*\{[^}]*\})\s*(\/\*\s*Dark Mode[^}]*\*\/\s*body\[data-theme="dark"\]\s*\{[^}]*--text-secondary:\s*var\(--text-secondary\);[^}]*\}\s*\/\*\s*Light Mode\s*\*\/\s*body\[data-theme="light"\]\s*\{[^}]*\})/gs;
  
  content = content.replace(duplicateThemeRegex, '$1');
  
  // Fix 2: Fix circular CSS variable references
  content = content.replace(
    /body\[data-theme="dark"\]\s*\{([^}]*?)--text-secondary:\s*var\(--text-secondary\);([^}]*?)--text-tertiary:\s*var\(--text-tertiary\);([^}]*?)\}/gs,
    'body[data-theme="dark"] {$1--text-secondary: rgba(255, 255, 255, 0.8);$2--text-tertiary: rgba(255, 255, 255, 0.7);$3}'
  );
  
  // Fix 3: Add smooth transitions to body
  if (!content.includes('transition: background-color 0.3s ease')) {
    content = content.replace(
      /(body\s*\{[^}]*?-webkit-font-smoothing:\s*antialiased;)/s,
      '$1\n        transition: background-color 0.3s ease, color 0.3s ease;'
    );
  }
  
  // Fix 4: Update .btn-primary to ensure white text
  content = content.replace(
    /(\.btn-primary\s*\{[^}]*?)background:\s*var\(--gradient-primary\);/gs,
    '$1background: var(--gradient-primary);\n        color: #ffffff !important;'
  );
  
  // Fix 5: Add theme toggle CSS if not present
  if (!content.includes('.theme-toggle-container')) {
    const themeToggleCSS = `

      /* Theme Toggle */
      .theme-toggle-container {
        position: fixed;
        top: 2rem;
        right: 2rem;
        z-index: 1000;
      }

      .theme-toggle {
        width: 60px;
        height: 32px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .theme-toggle:hover {
        border-color: var(--green);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }

      .theme-toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 26px;
        height: 26px;
        background: var(--gradient-primary);
        border-radius: 50%;
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      body[data-theme="light"] .theme-toggle-slider {
        transform: translateX(28px);
      }

      .theme-toggle-icon {
        width: 16px;
        height: 16px;
        color: white;
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
      }

      @media (max-width: 768px) {
        .theme-toggle-container {
          top: 1rem;
          right: 1rem;
        }
      }`;
    
    content = content.replace(/(\s*<\/style>)/, themeToggleCSS + '\n    </style>');
  }
  
  // Fix 6: Add theme toggle HTML after <body> tag if not present
  if (!content.includes('theme-toggle-container')) {
    const themeToggleHTML = `<body>
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
    </div>
`;
    
    content = content.replace(/<body>/, themeToggleHTML);
  }
  
  fs.writeFileSync(filename, content, 'utf8');
  console.log(`✓ Fixed ${filename}`);
});

console.log('\n✅ All error pages fixed!');
