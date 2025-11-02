const fs = require('fs');

let content = fs.readFileSync('example_signin.html', 'utf8');

// Add theme system CSS after :root
const themeVars = `

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

content = content.replace(/(:root\s*\{[\s\S]*?\n      \})/, '$1' + themeVars);

// Add JavaScript before </body>
const themeJS = `
    <script>
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
      initTheme();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('blipee-theme')) {
          document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    </script>`;

content = content.replace(/(\s*<\/body>)/, themeJS + '$1');

fs.writeFileSync('example_signin.html', content, 'utf8');
console.log('✓ Applied theme system to example_signin.html');
