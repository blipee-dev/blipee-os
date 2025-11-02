# Blipee Design System - Usage Guide

## Setup

### 1. Import Global CSS

Add the theme CSS to your root layout or `_app.tsx`:

```tsx
// app/layout.tsx (Next.js App Router)
import '@/components/blipee/theme/theme.css';

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// pages/_app.tsx (Next.js Pages Router)
import '@/components/blipee/theme/theme.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

### 2. Wrap Your App with ThemeProvider

```tsx
// app/layout.tsx (Next.js App Router)
import { ThemeProvider } from '@/components/blipee/theme/ThemeProvider';
import '@/components/blipee/theme/theme.css';

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

```tsx
// pages/_app.tsx (Next.js Pages Router)
import { ThemeProvider } from '@/components/blipee/theme/ThemeProvider';
import '@/components/blipee/theme/theme.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

## Using the Theme System

### Access Theme State

```tsx
'use client'; // Required for Next.js App Router

import { useTheme } from '@/components/blipee/theme/useTheme';

export function ThemeToggleButton() {
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
      {isDark && '🌙'}
      {isLight && '☀️'}
    </button>
  );
}
```

### Programmatic Theme Control

```tsx
import { useTheme } from '@/components/blipee/theme/useTheme';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
    </div>
  );
}
```

## Using Colors

### Import Color Constants

```tsx
import { ChartColors, green, blue, purple } from '@/components/blipee/constants';

// Use solid colors
const solidColor = ChartColors.green; // '#10b981'

// Use gradients
const gradient = ChartColors.gradients.primary;

// Create color with opacity
const transparentGreen = ChartColors.opacity(ChartColors.green, 0.5);
// Returns: 'rgba(16, 185, 129, 0.5)'
```

### Use in Components

```tsx
import { ChartColors } from '@/components/blipee/constants';

export function StatusBadge({ status }: { status: 'success' | 'error' }) {
  const color = status === 'success' ? ChartColors.green : ChartColors.red;

  return (
    <div
      style={{
        background: ChartColors.opacity(color, 0.1),
        color: color,
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
      }}
    >
      {status}
    </div>
  );
}
```

## Using Hooks

### useLocalStorage

```tsx
import { useLocalStorage } from '@/components/blipee/hooks';

export function UserPreferences() {
  const [language, setLanguage] = useLocalStorage('user-language', 'en');

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="pt">Português</option>
    </select>
  );
}
```

### useSidebar

```tsx
import { useSidebar } from '@/components/blipee/hooks';

export function SidebarToggle() {
  const { toggleSidebar, isCollapsed } = useSidebar();

  return (
    <button onClick={toggleSidebar}>
      {isCollapsed ? '→ Expand' : '← Collapse'}
    </button>
  );
}

export function MainLayout({ children }) {
  const { sidebarState } = useSidebar();

  return (
    <div className={`layout ${sidebarState === 'collapsed' ? 'expanded' : ''}`}>
      {children}
    </div>
  );
}
```

## CSS Variables

All CSS variables are available in your components:

```tsx
export function Card() {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '1rem',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <h2 style={{ color: 'var(--text-primary)' }}>Card Title</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Card description</p>
    </div>
  );
}
```

## Available CSS Variables

### Colors (Same in both themes)
- `--green: #10b981`
- `--blue: #0ea5e9`
- `--purple: #8b5cf6`
- `--cyan: #06b6d4`
- `--amber: #f59e0b`
- `--red: #ef4444`

### Gradients (Same in both themes)
- `--gradient-primary`
- `--gradient-green`
- `--gradient-blue`
- `--gradient-purple`

### Theme-Specific Variables

**Dark Mode:**
- `--bg-primary: #020617`
- `--bg-secondary: #0f172a`
- `--bg-tertiary: #1e293b`
- `--text-primary: #ffffff`
- `--text-secondary: rgba(255, 255, 255, 0.8)`
- `--text-tertiary: rgba(255, 255, 255, 0.7)`
- `--text-muted: rgba(255, 255, 255, 0.5)`
- `--glass-bg: rgba(255, 255, 255, 0.05)`
- `--glass-border: rgba(255, 255, 255, 0.1)`

**Light Mode:**
- `--bg-primary: #ffffff`
- `--bg-secondary: #f8fafc`
- `--bg-tertiary: #f1f5f9`
- `--text-primary: #0f172a`
- `--text-secondary: #334155`
- `--text-tertiary: #64748b`
- `--text-muted: #94a3b8`
- `--glass-bg: rgba(255, 255, 255, 0.9)`
- `--glass-border: rgba(15, 23, 42, 0.1)`

## TypeScript Support

All exports are fully typed:

```tsx
import type { Theme } from '@/components/blipee/theme/ThemeProvider';
import type { ChartColorKey, GradientKey } from '@/components/blipee/constants';
import type { SidebarState } from '@/components/blipee/hooks/useSidebar';

// Type-safe theme
const theme: Theme = 'dark'; // ✅ Valid
const invalidTheme: Theme = 'blue'; // ❌ TypeScript error

// Type-safe colors
const colorKey: ChartColorKey = 'green'; // ✅ Valid
const color = ChartColors[colorKey]; // ✅ Type-safe

// Type-safe gradients
const gradientKey: GradientKey = 'primary'; // ✅ Valid
const gradient = ChartColors.gradients[gradientKey]; // ✅ Type-safe
```

## Next Steps

Once the navigation components are ready, you'll be able to use:

```tsx
import { Navbar, Sidebar } from '@/components/blipee/navigation';
import { Button } from '@/components/blipee/buttons';
import { ChartCard } from '@/components/blipee/cards';

export default function Dashboard() {
  return (
    <ThemeProvider>
      <Navbar activePage="energy" />
      <Sidebar activeItem="dashboard" />
      <main>
        <ChartCard title="Energy Usage">
          {/* Chart component will go here */}
        </ChartCard>
      </main>
    </ThemeProvider>
  );
}
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- SSR compatible with Next.js App Router and Pages Router
