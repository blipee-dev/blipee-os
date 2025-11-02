#!/bin/bash

# Files to update
FILES=(
  "privacy.html"
  "terms.html"
  "contact.html"
  "updates.html"
  "documentation.html"
  "api.html"
  "support.html"
  "status.html"
  "403.html"
  "404.html"
  "500.html"
  "503.html"
  "signin.html"
  "signup.html"
  "forgot-password.html"
  "reset-password.html"
)

DIR="/Users/pedro/Documents/blipee/blipee-os/blipee-os/docs"

echo "Applying theme system to remaining files..."

for file in "${FILES[@]}"; do
  filepath="$DIR/$file"

  if [ ! -f "$filepath" ]; then
    echo "Skipping $file - file not found"
    continue
  fi

  echo "Processing $file..."

  # Create backup
  cp "$filepath" "$filepath.bak"

  # Apply theme system using Python for reliable text manipulation
  python3 <<PYTHON_SCRIPT
import re

filepath = "$filepath"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace :root CSS variables section
old_root = r':root\s*\{[^}]*\}'
new_root = ''':root {
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
      }'''

content = re.sub(old_root, new_root, content, flags=re.DOTALL)

# 2. Update body styling
content = re.sub(
    r'(body\s*\{[^}]*background:\s*)var\(--darker\)',
    r'\1var(--bg-primary)',
    content
)
content = re.sub(
    r'(body\s*\{[^}]*color:\s*)var\(--white\)',
    r'\1var(--text-primary)',
    content
)

# Add transition to body if not present
if 'body {' in content and 'transition:' not in re.search(r'body\s*\{[^}]*\}', content, re.DOTALL).group():
    content = re.sub(
        r'(body\s*\{[^}]*)(})',
        r'\1  transition: background-color 0.3s ease, color 0.3s ease;\n      \2',
        content
    )

# 3. Update nav styling
content = re.sub(
    r'(nav\s*\{[^}]*background:\s*)rgba\(2,\s*6,\s*23,\s*0\.8\)',
    r'\1var(--nav-bg)',
    content
)

# Save
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Applied basic theme variables to {filepath}")
PYTHON_SCRIPT

done

echo "Theme system applied to all files!"
echo "Backups created with .bak extension"
