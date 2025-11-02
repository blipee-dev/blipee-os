# Blipee Design System - React Component Library

Complete React/TypeScript replica of the `docs/` HTML/CSS/JS component system.

## 📁 Directory Structure

```
src/components/blipee/
├── README.md                 # This file
├── constants/                # Design tokens and colors
│   ├── colors.ts            # Chart colors, gradients, theme colors
│   └── index.ts
├── theme/                    # Theme system
│   ├── ThemeProvider.tsx    # React Context for theme management
│   ├── useTheme.ts          # Theme hook
│   └── theme.css            # Global CSS variables
├── hooks/                    # Shared hooks
│   ├── useSidebar.ts        # Sidebar state management
│   └── useLocalStorage.ts   # localStorage wrapper
├── navigation/               # Navigation components
│   ├── Navbar.tsx           # Main navigation bar
│   ├── Sidebar.tsx          # Collapsible sidebar
│   └── SidebarToggle.tsx    # Toggle button
├── buttons/                  # Button components
│   ├── Button.tsx           # Primary/Secondary/Ghost variants
│   └── IconButton.tsx       # Icon-only button
├── forms/                    # Form components
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   └── Radio.tsx
├── cards/                    # Card components
│   ├── ChartCard.tsx        # Card for charts
│   ├── KPICard.tsx          # Key performance indicator card
│   └── GlassCard.tsx        # Generic glass morphism card
├── charts/                   # Chart components
│   ├── DonutChart.tsx
│   ├── BarChart.tsx
│   ├── GaugeChart.tsx
│   ├── ProgressRings.tsx
│   ├── Heatmap.tsx
│   └── Treemap.tsx
├── data-display/             # Data display components
│   ├── Table.tsx
│   ├── Badge.tsx
│   ├── TrendIndicator.tsx
│   └── StatusBadge.tsx
├── feedback/                 # Feedback components
│   ├── Alert.tsx
│   └── Spinner.tsx
├── layout/                   # Layout components
│   ├── ChartsGrid.tsx
│   ├── KPIGrid.tsx
│   └── ContentWrapper.tsx
├── icons/                    # Icon components
│   └── index.tsx            # All Feather-style icons
└── index.ts                 # Main export file
```

## 🎯 Design Principles

1. **Exact Replica** - Components match `docs/` design pixel-perfect
2. **Type Safety** - Full TypeScript support
3. **Theme Support** - Dark/Light mode with CSS variables
4. **Accessibility** - ARIA labels and keyboard navigation
5. **Performance** - Optimized React components
6. **SSR Compatible** - Works with Next.js App Router

## 🚀 Usage

```tsx
import { ThemeProvider } from '@/components/blipee/theme/ThemeProvider'
import { Navbar } from '@/components/blipee/navigation/Navbar'
import { Sidebar } from '@/components/blipee/navigation/Sidebar'
import { ChartCard } from '@/components/blipee/cards/ChartCard'
import { DonutChart } from '@/components/blipee/charts/DonutChart'

export default function Dashboard() {
  return (
    <ThemeProvider>
      <div className="dashboard-layout">
        <Navbar activePage="energy" />
        <Sidebar activeItem="dashboard" />
        
        <main className="dashboard-content">
          <ChartCard
            title="Energy by Source"
            description="Distribution of energy sources"
          >
            <DonutChart
              segments={[
                { label: 'Solar', value: 40, color: ChartColors.amber },
                { label: 'Wind', value: 30, color: ChartColors.green },
              ]}
            />
          </ChartCard>
        </main>
      </div>
    </ThemeProvider>
  )
}
```

## 📊 Component Status

| Component | Status | Source Reference |
|-----------|--------|------------------|
| **Theme System** | 🔄 Planned | `docs/js/components.js` |
| **Colors** | 🔄 Planned | `docs/js/charts.js` |
| **Navbar** | 🔄 Planned | `docs/js/components.js` |
| **Sidebar** | 🔄 Planned | `docs/js/components.js` |
| **Buttons** | 🔄 Planned | `docs/css/shared-styles.css` |
| **Forms** | 🔄 Planned | `docs/css/shared-styles.css` |
| **Cards** | 🔄 Planned | `docs/css/shared-styles.css` |
| **Charts** | 🔄 Planned | `docs/js/charts.js` |
| **Tables** | 🔄 Planned | `docs/css/shared-styles.css` |
| **Badges** | 🔄 Planned | `docs/css/shared-styles.css` |

## 🎨 Design Tokens

### Colors
- Primary: `#10b981` (Green)
- Blue: `#3b82f6`
- Purple: `#8b5cf6`
- Amber: `#f59e0b`
- Cyan: `#06b6d4`
- Red: `#ef4444`

### Theme Variables
```css
/* Dark Mode */
--bg-primary: #020617
--bg-secondary: #0f172a
--text-primary: #ffffff
--glass-bg: rgba(255, 255, 255, 0.05)

/* Light Mode */
--bg-primary: #ffffff
--bg-secondary: #f8fafc
--text-primary: #0f172a
--glass-bg: rgba(255, 255, 255, 0.9)
```

## 📚 Documentation

- See `docs/COMPONENTS_GUIDE.md` for detailed component documentation
- See `docs/CHARTS_GUIDE.md` for chart-specific documentation
- See `docs/COMPONENT_LIBRARY_SUMMARY.md` for quick reference

## 🔄 Migration Strategy

1. ✅ Create directory structure
2. ⏳ Create theme system (ThemeProvider, CSS variables)
3. ⏳ Create color constants
4. ⏳ Convert navigation components (Navbar, Sidebar)
5. ⏳ Convert button components
6. ⏳ Convert form components
7. ⏳ Convert card components
8. ⏳ Convert chart components
9. ⏳ Convert data display components
10. ⏳ Convert feedback components
11. ⏳ Create example dashboard page

## 🧪 Testing

Each component should have:
- Unit tests (Jest + React Testing Library)
- Visual tests (Storybook)
- Accessibility tests (axe)

## 🤝 Contributing

When adding new components:
1. Match `docs/` design exactly
2. Add TypeScript types
3. Support light/dark themes
4. Add ARIA labels
5. Write tests
6. Document usage
