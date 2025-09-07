# Dark/Light Mode Best Practices

## ❌ Current Implementation (Not Recommended)
- Separate pages for dark and light modes
- Full page redirects when toggling theme
- Duplicate code maintenance
- Poor performance and UX

## ✅ Best Practice Implementation

### 1. **Use Tailwind's Built-in Dark Mode**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ...
}
```

### 2. **Single Page with Dynamic Classes**

```tsx
// Example: Single page that handles both themes
export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useThemeBestPractice();
  
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="bg-white dark:bg-black border-gray-200 dark:border-white/10">
        <h1 className="text-black dark:text-white">
          Welcome
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          This text adapts to the theme
        </p>
        <button onClick={toggleTheme}>
          Toggle Theme
        </button>
      </nav>
    </div>
  );
}
```

### 3. **CSS Variables Approach**

```css
/* globals.css */
:root {
  --bg-primary: white;
  --text-primary: black;
  --border-color: rgba(0, 0, 0, 0.1);
}

.dark {
  --bg-primary: black;
  --text-primary: white;
  --border-color: rgba(255, 255, 255, 0.1);
}

/* Use variables in your styles */
.container {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### 4. **Theme Context Provider (Advanced)**

```tsx
// providers/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Apply theme to root element
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

## Benefits of Best Practice Approach

### ✅ Performance
- **No page reloads** - Instant theme switching
- **No network requests** - Everything happens client-side
- **Smaller bundle** - No duplicate pages

### ✅ UX
- **Smooth transitions** - Can add CSS transitions
- **No flash** - Theme applies instantly
- **Respects system preference** - Can detect user's OS theme

### ✅ Maintenance
- **Single source of truth** - One page to maintain
- **Consistent styling** - Easy to ensure both themes look good
- **Less code** - No duplicate components

### ✅ SEO
- **No duplicate content** - Single URL per page
- **Better crawlability** - Search engines see one page
- **Faster indexing** - Less pages to crawl

## Implementation Steps

### Step 1: Configure Tailwind
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ... rest of config
}
```

### Step 2: Add Theme Hook
Use the `useThemeBestPractice` hook provided above

### Step 3: Update Components
Replace separate dark/light pages with single pages using dark: classes

```tsx
// Before (2 files)
// page.tsx - dark version
<div className="bg-black text-white">

// page-light.tsx - light version  
<div className="bg-white text-black">

// After (1 file)
<div className="bg-white dark:bg-black text-black dark:text-white">
```

### Step 4: Add Theme Toggle
```tsx
<button onClick={toggleTheme}>
  {isDarkMode ? <Sun /> : <Moon />}
</button>
```

## Advanced Features

### 1. **Theme Transitions**
```css
/* Smooth theme transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### 2. **System Preference Detection**
```javascript
// Detect and respect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### 3. **Theme Persistence**
```javascript
// Save to localStorage
localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
```

### 4. **Prevent Flash of Unstyled Content (FOUC)**
```html
<!-- Add to <head> to prevent flash -->
<script>
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.className = theme;
</script>
```

## Migration Strategy

To migrate from current implementation to best practice:

1. **Keep existing pages temporarily** - Don't break current functionality
2. **Create new unified pages** - Build single-page versions
3. **Test thoroughly** - Ensure all themes work correctly
4. **Update routing** - Remove theme-based redirects
5. **Delete old pages** - Once new implementation is stable

## Recommended Libraries

1. **next-themes** - Excellent for Next.js apps
```bash
npm install next-themes
```

2. **use-dark-mode** - Simple React hook
```bash
npm install use-dark-mode
```

3. **tailwindcss** - Built-in dark mode support
```bash
npm install tailwindcss
```

## Conclusion

The best practice is to use **single pages with dynamic styling** rather than separate pages for each theme. This provides:
- Better performance
- Superior user experience
- Easier maintenance
- Better SEO
- Industry-standard approach

The current implementation with separate pages should be refactored to follow these best practices for optimal results.