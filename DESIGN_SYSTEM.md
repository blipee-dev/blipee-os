# blipee OS Design System

Complete design system for building consistent, beautiful pages across blipee OS.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Design Tokens](#design-tokens)
- [Layout Components](#layout-components)
- [Card Components](#card-components)
- [Complete Page Examples](#complete-page-examples)
- [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Creating a New Page

Every new page should follow this pattern for consistency:

```tsx
'use client';

import { Zap } from 'lucide-react';
import {
  PageLayout,
  Section,
  MetricGrid,
  ChartGrid,
  MetricCard,
  ChartCard,
  designTokens,
} from '@/components/design-system';

export default function MyNewPage() {
  return (
    <PageLayout
      title="Page Title"
      description="GRI Standard • Description of the page"
      icon={Zap}
      showFilters={true}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <>
          {/* Metrics Section */}
          <Section>
            <MetricGrid columns={4}>
              <MetricCard
                title="Metric 1"
                value={1234.5}
                unit="tCO2e"
                icon={Zap}
                iconColor={designTokens.colors.category.electricity}
                trend={{ value: -5.2, label: "YoY" }}
              />
              {/* ... more metrics */}
            </MetricGrid>
          </Section>

          {/* Charts Section */}
          <Section>
            <ChartGrid columns={2}>
              <ChartCard
                title="Chart Title"
                icon={TrendingUp}
                iconColor="#8B5CF6"
                badges={[{ label: "TCFD", type: "tcfd" }]}
              >
                {/* Your chart component */}
              </ChartCard>
              {/* ... more charts */}
            </ChartGrid>
          </Section>
        </>
      )}
    </PageLayout>
  );
}
```

**That's it!** Your page now has:
- ✅ Consistent sidebar navigation
- ✅ Page header with icon and description
- ✅ Site and time period filters
- ✅ Loading and error states
- ✅ Organization context
- ✅ Unified styling and spacing

---

## 🎨 Design Tokens

Design tokens are stored in `/src/styles/design-tokens.ts`. Import them to access consistent colors, spacing, and styles:

```tsx
import { designTokens, getCategoryColor, getStatusColor } from '@/components/design-system';
```

### Color System

#### Scope Colors (Emissions)
```tsx
designTokens.colors.scope.scope1  // #EF4444 (Red)
designTokens.colors.scope.scope2  // #3B82F6 (Blue)
designTokens.colors.scope.scope3  // #6B7280 (Gray)
```

#### Status Colors
```tsx
designTokens.colors.status.success   // Green
designTokens.colors.status.warning   // Yellow
designTokens.colors.status.danger    // Red
designTokens.colors.status.info      // Blue
```

#### Category Colors (with helper function)
```tsx
// Automatic color mapping based on metric name
const color = getCategoryColor("Grid Electricity");  // Returns blue
const color = getCategoryColor("Natural Gas");       // Returns orange
const color = getCategoryColor("Waste Disposal");    // Returns brown
```

#### Framework Badge Colors
```tsx
designTokens.colors.framework.ghg    // Cyan - GHG Protocol
designTokens.colors.framework.gri    // Blue - GRI
designTokens.colors.framework.tcfd   // Purple - TCFD
designTokens.colors.framework.esrs   // Orange - ESRS
designTokens.colors.framework.sbti   // Green - SBTi
```

### Typography Classes
```tsx
designTokens.typography.pageTitle       // Page headers
designTokens.typography.sectionTitle    // Section headers
designTokens.typography.cardTitle       // Card labels
designTokens.typography.metricValue     // Large metric values
designTokens.typography.metricUnit      // Metric units
designTokens.typography.description     // Descriptions
designTokens.typography.badgeText       // Badge text
```

### Spacing
```tsx
designTokens.spacing.cardPadding      // p-4
designTokens.spacing.sectionPadding   // p-4 sm:p-6
designTokens.spacing.cardGap          // gap-4
designTokens.spacing.sectionGap       // space-y-6
designTokens.spacing.gridGap          // gap-4
```

### Glass Morphism Styles
```tsx
designTokens.glassMorphism.card        // Standard card style
designTokens.glassMorphism.cardHover   // Card with hover effect
designTokens.glassMorphism.dropdown    // Dropdown menus
```

---

## 📐 Layout Components

### PageLayout

The foundation of every page. Automatically provides navigation, filters, and organization context.

```tsx
<PageLayout
  title="Energy Management"
  description="GRI 302 • Energy consumption & renewable sources"
  icon={Zap}
  showFilters={true}
  loadingMessage="Loading energy data..."
  errorTitle="Failed to Load Energy Data"
>
  {({ organizationId, selectedSite, selectedPeriod }) => (
    // Your page content here
    <div>...</div>
  )}
</PageLayout>
```

**Props:**
- `title` - Page title (required)
- `description` - Page description with standards (required)
- `icon` - Lucide icon component (required)
- `showFilters` - Show/hide site and time filters (default: true)
- `loadingMessage` - Custom loading message
- `errorTitle` - Custom error title
- `children` - Render function receiving context

### Section

Groups content with consistent vertical spacing.

```tsx
<Section>
  <MetricGrid>...</MetricGrid>
</Section>

<Section>
  <ChartGrid>...</ChartGrid>
</Section>
```

### MetricGrid

Grid layout for metric cards with responsive columns.

```tsx
<MetricGrid columns={4}>
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</MetricGrid>
```

**Props:**
- `columns` - Number of columns: 2, 3, or 4 (default: 4)
- `children` - MetricCard components

### ChartGrid

Responsive grid for chart cards.

```tsx
<ChartGrid columns={2}>
  <ChartCard ... />
  <ChartCard ... />
</ChartGrid>
```

**Props:**
- `columns` - Number of columns: 1 or 2 (default: 2)
- `children` - ChartCard components

---

## 🎴 Card Components

### MetricCard

Display key metrics with optional trends and tooltips.

```tsx
<MetricCard
  title="Total Emissions"
  value={1234.5}
  unit="tCO2e"
  icon={Cloud}
  iconColor="#8B5CF6"
  trend={{
    value: -5.2,
    label: "YoY"
  }}
  subtitle="Projected: 1500 tCO2e"
  tooltip="Total greenhouse gas emissions across all scopes"
/>
```

**Props:**
- `title` - Metric label (required)
- `value` - Numeric or string value (required)
- `unit` - Unit of measurement (required)
- `icon` - Lucide icon (required)
- `iconColor` - Icon color hex code
- `trend` - Optional trend object with value and label
- `subtitle` - Optional subtitle text
- `tooltip` - Optional tooltip on info icon hover

**Features:**
- ✅ Automatic trend coloring (green for decrease, red for increase)
- ✅ Trend arrow icons
- ✅ Hover tooltips
- ✅ Glass morphism styling

### ChartCard

Container for charts with framework badges.

```tsx
<ChartCard
  title="Emissions Trend"
  icon={TrendingUp}
  iconColor="#8B5CF6"
  tooltip="Monthly emissions data with ML forecasting"
  badges={[
    { label: "TCFD", type: "tcfd" },
    { label: "ESRS E1", type: "esrs" }
  ]}
  height="chart"
>
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={data}>
      {/* Recharts components */}
    </LineChart>
  </ResponsiveContainer>
</ChartCard>
```

**Props:**
- `title` - Chart title (required)
- `icon` - Lucide icon (required)
- `iconColor` - Icon color hex code
- `tooltip` - Optional tooltip text
- `badges` - Array of framework badges
- `height` - Card height: 'chart' (420px), 'table', or custom
- `children` - Chart/visualization content (required)

**Badge Types:**
- `ghg` - GHG Protocol (cyan)
- `gri` - GRI Standards (blue)
- `tcfd` - TCFD (purple)
- `esrs` - ESRS (orange)
- `sbti` - SBTi (green)

### StatCard

Flexible card for custom statistics and data.

```tsx
<StatCard
  title="Organizational Boundaries"
  icon={Building2}
  iconColor="#6366F1"
>
  <div className="space-y-3">
    <div>
      <div className="text-xs text-gray-500 mb-1">Consolidation Approach</div>
      <div className="text-base font-semibold">Operational Control</div>
    </div>
    <div>
      <div className="text-xs text-gray-500 mb-1">Sites Included</div>
      <div className="text-base font-semibold">12/15</div>
    </div>
  </div>
</StatCard>
```

**Props:**
- `title` - Card title (required)
- `icon` - Lucide icon (required)
- `iconColor` - Icon color hex code
- `children` - Custom content (required)

---

## 📋 Complete Page Examples

### Example 1: Simple Metrics Page

```tsx
'use client';

import { Droplets } from 'lucide-react';
import { PageLayout, Section, MetricGrid, MetricCard, designTokens } from '@/components/design-system';

export default function WaterPage() {
  return (
    <PageLayout
      title="Water & Effluents"
      description="GRI 303 • Water withdrawal, discharge, and consumption"
      icon={Droplets}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <Section>
          <MetricGrid columns={4}>
            <MetricCard
              title="Water Withdrawal"
              value={15234}
              unit="m³"
              icon={Droplets}
              iconColor={designTokens.colors.category.water}
              trend={{ value: -8.5, label: "YoY" }}
            />
            <MetricCard
              title="Water Discharge"
              value={12150}
              unit="m³"
              icon={Droplets}
              iconColor={designTokens.colors.category.water}
              trend={{ value: -6.2, label: "YoY" }}
            />
            <MetricCard
              title="Water Consumption"
              value={3084}
              unit="m³"
              icon={Droplets}
              iconColor={designTokens.colors.category.water}
              trend={{ value: -12.3, label: "YoY" }}
            />
            <MetricCard
              title="Intensity"
              value={15.42}
              unit="m³/employee"
              icon={Droplets}
              iconColor={designTokens.colors.category.water}
              trend={{ value: -10.1, label: "YoY" }}
            />
          </MetricGrid>
        </Section>
      )}
    </PageLayout>
  );
}
```

### Example 2: Full Dashboard with Metrics and Charts

```tsx
'use client';

import { Cloud, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  PageLayout,
  Section,
  MetricGrid,
  ChartGrid,
  MetricCard,
  ChartCard,
  designTokens,
} from '@/components/design-system';

export default function EmissionsPage() {
  return (
    <PageLayout
      title="GHG Emissions"
      description="GHG Protocol • GRI 305 • ESRS E1 • TCFD"
      icon={Cloud}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <>
          {/* Metrics */}
          <Section>
            <MetricGrid columns={4}>
              <MetricCard
                title="Total Emissions"
                value={2456.8}
                unit="tCO2e"
                icon={Cloud}
                iconColor={designTokens.colors.scope.scope2}
                trend={{ value: -12.3, label: "YoY" }}
                tooltip="Total GHG emissions across all scopes"
              />
              <MetricCard
                title="Scope 1"
                value={456.2}
                unit="tCO2e"
                icon={Cloud}
                iconColor={designTokens.colors.scope.scope1}
                trend={{ value: -8.1, label: "YoY" }}
              />
              <MetricCard
                title="Scope 2"
                value={1234.5}
                unit="tCO2e"
                icon={Cloud}
                iconColor={designTokens.colors.scope.scope2}
                trend={{ value: -15.2, label: "YoY" }}
              />
              <MetricCard
                title="Scope 3"
                value={766.1}
                unit="tCO2e"
                icon={Cloud}
                iconColor={designTokens.colors.scope.scope3}
                trend={{ value: -9.8, label: "YoY" }}
              />
            </MetricGrid>
          </Section>

          {/* Charts */}
          <Section>
            <ChartGrid columns={2}>
              <ChartCard
                title="Emissions Trend"
                icon={TrendingUp}
                iconColor="#8B5CF6"
                badges={[
                  { label: "TCFD", type: "tcfd" },
                  { label: "ESRS E1", type: "esrs" }
                ]}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData}>
                    <Line
                      type="monotone"
                      dataKey="emissions"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Scope Breakdown"
                icon={PieChartIcon}
                iconColor="#3B82F6"
                badges={[
                  { label: "GHG Protocol", type: "ghg" },
                  { label: "GRI 305", type: "gri" }
                ]}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={scopeData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {scopeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </ChartGrid>
          </Section>
        </>
      )}
    </PageLayout>
  );
}
```

### Example 3: Custom Content with StatCard

```tsx
'use client';

import { Building2, Target } from 'lucide-react';
import {
  PageLayout,
  Section,
  ChartGrid,
  StatCard,
  designTokens,
} from '@/components/design-system';

export default function CompliancePage() {
  return (
    <PageLayout
      title="Compliance"
      description="GRI • TCFD • ESRS • SBTi Tracking"
      icon={Building2}
      showFilters={false}
    >
      {({ organizationId }) => (
        <Section>
          <ChartGrid columns={2}>
            <StatCard
              title="Organizational Boundaries"
              icon={Building2}
              iconColor="#6366F1"
            >
              <div className="space-y-3">
                <div>
                  <div className={designTokens.typography.label}>
                    Consolidation Approach
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    Operational Control
                  </div>
                </div>
                <div>
                  <div className={designTokens.typography.label}>
                    Sites Included
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      12/15
                    </div>
                    <div className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                      80%
                    </div>
                  </div>
                </div>
              </div>
            </StatCard>

            <StatCard
              title="SBTi Targets"
              icon={Target}
              iconColor="#10B981"
            >
              <div className="space-y-2.5">
                <div>
                  <div className={designTokens.typography.label}>
                    Ambition
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    1.5°C aligned
                  </div>
                </div>
                <div>
                  <div className={designTokens.typography.label}>
                    Near-Term Target
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    -42% by 2030
                  </div>
                </div>
              </div>
            </StatCard>
          </ChartGrid>
        </Section>
      )}
    </PageLayout>
  );
}
```

---

## ✨ Best Practices

### 1. Always Use PageLayout
Every page should start with `PageLayout` to ensure consistency:
```tsx
<PageLayout title="..." description="..." icon={Icon}>
  {({ organizationId, selectedSite, selectedPeriod }) => (
    // Your content
  )}
</PageLayout>
```

### 2. Group Content in Sections
Use `Section` components to group related content:
```tsx
<Section>
  <MetricGrid>...</MetricGrid>
</Section>

<Section>
  <ChartGrid>...</ChartGrid>
</Section>
```

### 3. Use Design Tokens for Colors
Always reference design tokens instead of hardcoding colors:
```tsx
// ❌ Bad
iconColor="#3B82F6"

// ✅ Good
iconColor={designTokens.colors.category.electricity}
```

### 4. Include Framework Badges
Add appropriate framework badges to chart cards:
```tsx
<ChartCard
  badges={[
    { label: "GRI 305", type: "gri" },
    { label: "TCFD", type: "tcfd" }
  ]}
>
```

### 5. Provide Tooltips for Context
Add tooltips to help users understand metrics:
```tsx
<MetricCard
  tooltip="Total greenhouse gas emissions across all scopes, including direct and indirect sources"
  ...
/>
```

### 6. Use Semantic Icons
Choose icons that clearly represent the data:
- `Cloud` - Emissions
- `Zap` - Energy
- `Droplets` - Water
- `Trash2` - Waste
- `Target` - Goals/Targets
- `TrendingUp` - Trends/Progress

### 7. Show Trends When Available
Include year-over-year trends for context:
```tsx
<MetricCard
  trend={{ value: -12.3, label: "YoY" }}
  ...
/>
```

### 8. Consistent Grid Layouts
- **Metrics**: 4 columns
- **Charts**: 2 columns (responsive to 1 on mobile)
- **Mixed content**: Use appropriate grid based on content type

---

## 🎯 Summary

With this design system, creating a new page is as simple as:

1. **Import the design system**: `import { ... } from '@/components/design-system'`
2. **Wrap with PageLayout**: Provides navigation, filters, and context
3. **Add Sections**: Group related content
4. **Use Grid Layouts**: MetricGrid and ChartGrid for consistent layouts
5. **Place Cards**: MetricCard, ChartCard, and StatCard for content

**Result**: Every page automatically has the same look, feel, colors, spacing, and behavior!

---

## 📦 File Structure

```
src/
├── styles/
│   └── design-tokens.ts              # Central design tokens
├── components/
│   └── design-system/
│       ├── index.ts                  # Main export file
│       ├── PageLayout.tsx            # Universal page wrapper
│       ├── Section.tsx               # Content grouping
│       ├── MetricGrid.tsx            # Metrics grid layout
│       ├── ChartGrid.tsx             # Charts grid layout
│       ├── MetricCard.tsx            # Metric display card
│       ├── ChartCard.tsx             # Chart container card
│       └── StatCard.tsx              # Custom stats card
└── app/
    └── sustainability/
        └── your-page/
            └── page.tsx              # Your new page!
```

---

**Questions or need help?** Check the inline JSDoc comments in each component for more details!
