# Design System Quick Start

## 🚀 Create a New Page in 60 Seconds

### Step 1: Copy the Template

```tsx
'use client';

import { YourIcon } from 'lucide-react';
import {
  PageLayout,
  Section,
  MetricGrid,
  MetricCard,
  designTokens,
} from '@/components/design-system';

export default function YourPage() {
  return (
    <PageLayout
      title="Your Page Title"
      description="GRI Standard • Description"
      icon={YourIcon}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <Section>
          <MetricGrid columns={4}>
            <MetricCard
              title="Metric Name"
              value={1234}
              unit="unit"
              icon={YourIcon}
              iconColor={designTokens.colors.category.electricity}
              trend={{ value: -5.2, label: "YoY" }}
            />
          </MetricGrid>
        </Section>
      )}
    </PageLayout>
  );
}
```

### Step 2: Customize Your Content

1. **Change the title and icon**
2. **Add your metrics**
3. **Include charts if needed**
4. **Done!**

---

## 📦 Common Imports

```tsx
// Layout and containers
import {
  PageLayout,
  Section,
  MetricGrid,
  ChartGrid,
} from '@/components/design-system';

// Cards
import {
  MetricCard,
  ChartCard,
  StatCard,
} from '@/components/design-system';

// Design tokens
import {
  designTokens,
  getCategoryColor,
  getStatusColor,
} from '@/components/design-system';

// Icons (from lucide-react)
import {
  Cloud,
  Zap,
  Droplets,
  Trash2,
  Leaf,
  TrendingUp,
  Building2,
  Target,
} from 'lucide-react';
```

---

## 🎨 Common Color References

```tsx
// Scope colors
designTokens.colors.scope.scope1    // Red
designTokens.colors.scope.scope2    // Blue
designTokens.colors.scope.scope3    // Gray

// Category colors (use helper)
getCategoryColor("Grid Electricity")  // Blue
getCategoryColor("Natural Gas")       // Orange
getCategoryColor("Waste")             // Brown

// Status colors
designTokens.colors.status.success   // Green
designTokens.colors.status.warning   // Yellow
designTokens.colors.status.danger    // Red

// Framework colors
designTokens.colors.framework.ghg    // Cyan
designTokens.colors.framework.gri    // Blue
designTokens.colors.framework.tcfd   // Purple
designTokens.colors.framework.sbti   // Green
```

---

## 📐 Layout Patterns

### 4 Metrics in a Row
```tsx
<Section>
  <MetricGrid columns={4}>
    <MetricCard ... />
    <MetricCard ... />
    <MetricCard ... />
    <MetricCard ... />
  </MetricGrid>
</Section>
```

### 5 Compact Metrics (New!)
```tsx
<Section>
  <MetricGrid columns={5}>
    <MetricCard compact ... />
    <MetricCard compact ... />
    <MetricCard compact ... />
    <MetricCard compact ... />
    <MetricCard compact ... />
  </MetricGrid>
</Section>
```

### 2 Charts Side by Side
```tsx
<Section>
  <ChartGrid columns={2}>
    <ChartCard ...>
      <LineChart ... />
    </ChartCard>
    <ChartCard ...>
      <PieChart ... />
    </ChartCard>
  </ChartGrid>
</Section>
```

### Mixed Content
```tsx
<Section>
  <MetricGrid columns={4}>
    <MetricCard ... />
    <MetricCard ... />
    <MetricCard ... />
    <MetricCard ... />
  </MetricGrid>
</Section>

<Section>
  <ChartGrid columns={2}>
    <ChartCard ...>...</ChartCard>
    <ChartCard ...>...</ChartCard>
  </ChartGrid>
</Section>

<Section>
  <ChartGrid columns={2}>
    <StatCard ...>...</StatCard>
    <StatCard ...>...</StatCard>
  </ChartGrid>
</Section>
```

---

## 🎴 Card Examples

### Simple Metric
```tsx
<MetricCard
  title="Total Emissions"
  value={1234.5}
  unit="tCO2e"
  icon={Cloud}
  iconColor="#8B5CF6"
/>
```

### Metric with Trend
```tsx
<MetricCard
  title="Energy Consumption"
  value={5678.9}
  unit="MWh"
  icon={Zap}
  iconColor={designTokens.colors.category.electricity}
  trend={{ value: -12.3, label: "YoY" }}
/>
```

### Metric with Tooltip
```tsx
<MetricCard
  title="Water Usage"
  value={15234}
  unit="m³"
  icon={Droplets}
  iconColor={designTokens.colors.category.water}
  trend={{ value: -8.5, label: "YoY" }}
  tooltip="Total water withdrawal from all sources"
/>
```

### Compact Metric with Subtitle (New!)
```tsx
<MetricCard
  title="ML Forecast"
  value="+12.5%"
  icon={Brain}
  iconColor="#10B981"
  subtitle="Next 12 months"
  subtitleColor="text-gray-500"
  compact
/>
```

### Chart with Badges
```tsx
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
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</ChartCard>
```

### Custom Stat Card
```tsx
<StatCard
  title="Data Quality"
  icon={Leaf}
  iconColor="#10B981"
>
  <div className="space-y-3">
    <div>
      <div className="text-xs text-gray-500 mb-1">Primary Data</div>
      <div className="text-xl font-bold">85%</div>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }} />
    </div>
  </div>
</StatCard>
```

---

## 🎯 Framework Badges

Use these badges on ChartCard components:

```tsx
badges={[
  { label: "GHG Protocol", type: "ghg" },    // Cyan
  { label: "GRI 305", type: "gri" },         // Blue
  { label: "TCFD", type: "tcfd" },           // Purple
  { label: "ESRS E1", type: "esrs" },        // Orange
  { label: "SBTi", type: "sbti" },           // Green
]}
```

---

## ✨ Pro Tips

1. **Always wrap content in `<Section>`** for consistent spacing
2. **Use design tokens** instead of hardcoding colors
3. **Add tooltips** to provide context for metrics
4. **Include trends** when showing year-over-year data
5. **Use framework badges** to show compliance alignment
6. **Keep metrics to 4 per row** for best readability
7. **Keep charts to 2 per row** on desktop
8. **Use semantic icons** that match your data type

---

## 📱 Responsive Behavior

The design system is **automatically responsive**:

- **Desktop**: 4 metrics, 2 charts side-by-side
- **Tablet**: 2 metrics, 1 chart per row
- **Mobile**: 1 metric, 1 chart per row

No extra code needed!

---

## 🔗 Need More Details?

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete documentation with:
- Full API reference
- Advanced examples
- Best practices
- Typography system
- Complete color palette

---

## 📂 Example Files

Check out these examples:
- `/src/app/sustainability/example-new-page/page.tsx` - Full featured example
- `/src/app/sustainability/ghg-emissions/GHGEmissionsPage.tsx` - Production example
- `/src/app/sustainability/energy/EnergyPage.tsx` - Simple example

---

**Happy building! 🎉**
