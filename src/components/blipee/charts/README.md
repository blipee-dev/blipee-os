# Blipee Chart Components

## Overview

The Blipee design system uses **CSS-based charts**, not JavaScript charting libraries like Chart.js or Recharts. These components are React wrappers around the pure CSS/HTML visualizations found in `docs/`.

## Chart Types

1. **LineChart** - SVG-based line/area charts with `.line-chart` class
2. **BarChart** - CSS bar charts with `.bar-chart`, `.bar` classes
3. **DonutChart** - CSS donut/pie charts with `.donut-chart` class
4. **Heatmap** - Grid-based heatmap with `.heatmap`, `.heatmap-cell` classes
5. **Table** - Enhanced HTML tables with custom styling
6. **Treemap** - CSS-based treemap visualization

## Styling

All chart styles are defined in `docs/css/chart-styles.css`. These components simply render the HTML structure - the visual styling comes from existing CSS.

## Usage

```tsx
import { BarChart, DonutChart, LineChart } from '@/components/blipee/charts';

// Bar Chart
<BarChart
  data={[
    { label: 'Jan', value: 100, color: 'var(--green)' },
    { label: 'Feb', value: 150, color: 'var(--blue)' }
  ]}
/>

// Donut Chart
<DonutChart
  data={[
    { label: 'Solar', value: 40, color: '#f59e0b' },
    { label: 'Wind', value: 30, color: '#10b981' }
  ]}
  centerLabel="Total"
  centerValue="100 kWh"
/>
```

## Future Enhancement

These components can be enhanced to:
- Accept actual data arrays
- Calculate percentages/scales automatically
- Support responsive sizing
- Add animations
- Integrate with charting libraries if needed
