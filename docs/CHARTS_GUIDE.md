# Blipee Charts Guide

## Overview

The Blipee chart system provides reusable styles and JavaScript utilities for creating beautiful, responsive charts. All charts adapt to the light/dark theme automatically.

## Setup

### 1. Include Required Files

```html
<head>
  <!-- Shared Styles -->
  <link rel="stylesheet" href="./css/shared-styles.css">
  <!-- Chart Styles -->
  <link rel="stylesheet" href="./css/chart-styles.css">
</head>

<body>
  <!-- Your content -->

  <!-- Chart Utilities -->
  <script src="./js/charts.js"></script>
</body>
```

## Available Chart Types

### 1. Donut/Pie Chart
Perfect for showing distribution or percentages.

```javascript
const donutHTML = ChartBuilder.donutChart({
  title: 'Energy by Source',
  description: 'Distribution of energy sources',
  segments: [
    { label: 'Solar', value: 40, color: ChartColors.amber },
    { label: 'Wind', value: 30, color: ChartColors.green },
    { label: 'Grid', value: 20, color: ChartColors.blue },
    { label: 'Hydro', value: 10, color: ChartColors.purple }
  ]
});

insertChart('.charts-section', donutHTML);
```

### 2. Bar Chart
Great for comparing values across categories.

```javascript
const barHTML = ChartBuilder.barChart({
  title: 'Cost Breakdown',
  description: 'Energy costs by category (€)',
  bars: [
    { label: 'Demand', value: 8200, gradient: ChartColors.gradients.primary },
    { label: 'Supply', value: 6500, gradient: ChartColors.gradients.purple },
    { label: 'Peak', value: 4900, gradient: ChartColors.gradients.red },
    { label: 'Off-Peak', value: 3800, gradient: ChartColors.gradients.blue },
    { label: 'Renewable', value: 2700, gradient: ChartColors.gradients.green }
  ]
});

insertChart('.charts-section', barHTML);
```

### 3. Gauge Chart
Shows progress or percentage towards a goal.

```javascript
const gaugeHTML = ChartBuilder.gaugeChart({
  title: 'Target Achievement',
  description: 'Progress towards reduction goals',
  value: 73,
  label: 'of target'
});

insertChart('.charts-section', gaugeHTML);
```

### 4. Progress Rings
Multiple circular progress indicators.

```javascript
const ringsHTML = ChartBuilder.progressRings({
  title: 'Category Performance',
  description: 'Progress by emission category',
  rings: [
    { label: 'Scope 1', value: 85, color: ChartColors.green },
    { label: 'Scope 2', value: 62, color: ChartColors.blue },
    { label: 'Scope 3', value: 45, color: ChartColors.purple }
  ]
});

insertChart('.charts-section', ringsHTML);
```

### 5. Heatmap
Shows patterns and intensities across time or categories.

```javascript
const heatmapHTML = ChartBuilder.heatmap({
  title: 'Peak Demand Analysis',
  description: 'Hourly demand patterns',
  cells: [
    // 35 cells with value and color
    { value: 22, color: 'rgba(16, 185, 129, 0.3)' },
    { value: 28, color: 'rgba(16, 185, 129, 0.4)' },
    // ... more cells
  ]
});

insertChart('.charts-section', heatmapHTML);
```

### 6. Treemap
Hierarchical data visualization.

```javascript
const treemapHTML = ChartBuilder.treemap({
  title: 'Emissions Distribution',
  description: 'By source and category',
  cells: [
    { label: 'Transportation', value: '342 tCO₂', color: ChartColors.gradients.blue, size: '1 / span 2' },
    { label: 'Electricity', value: '287 tCO₂', color: ChartColors.gradients.green, size: '3 / span 2' },
    { label: 'Heating', value: '156 tCO₂', color: ChartColors.gradients.amber },
    { label: 'Cooling', value: '98 tCO₂', color: ChartColors.gradients.purple },
    // ... more cells
  ]
});

insertChart('.charts-section', treemapHTML);
```

## Chart Colors

The `ChartColors` object provides a consistent color palette:

```javascript
// Solid colors
ChartColors.green   // #10b981
ChartColors.blue    // #3b82f6
ChartColors.purple  // #8b5cf6
ChartColors.amber   // #f59e0b
ChartColors.cyan    // #06b6d4
ChartColors.red     // #ef4444

// Gradients
ChartColors.gradients.primary  // Green to blue
ChartColors.gradients.green    // Light to dark green
ChartColors.gradients.blue     // Light to dark blue
ChartColors.gradients.purple   // Purple gradient
ChartColors.gradients.red      // Red gradient
ChartColors.gradients.amber    // Amber/orange gradient

// Opacity helper
ChartColors.opacity('#10b981', 0.5)  // Returns rgba with 50% opacity
```

## Dashboard Layout

Charts are automatically responsive and adjust based on sidebar state:

```html
<main id="mainContent">
  <!-- Charts will auto-layout in a responsive grid -->
  <div class="charts-section">
    <!-- Charts inserted here -->
  </div>
</main>
```

**Grid behavior:**
- **Sidebar expanded:** 2 columns minimum (500px per chart)
- **Sidebar collapsed:** 2 columns minimum (650px per chart)
- **Mobile:** Single column

## Custom Chart HTML

You can also write custom chart HTML using the provided CSS classes:

```html
<div class="chart-card">
  <div class="chart-header">
    <h2 class="chart-title">Your Chart Title</h2>
    <p class="chart-description">Description of the chart</p>
  </div>
  <div class="your-chart-type">
    <!-- Your custom chart content -->
  </div>
</div>
```

## Chart Styles Reference

### Available CSS Classes

- `.charts-section` - Container for all charts (auto-grid)
- `.chart-card` - Individual chart container
- `.chart-header` - Chart title and description area
- `.chart-title` - Chart title styling
- `.chart-description` - Chart description styling

### Chart-Specific Classes

- `.line-chart` - Line/area chart container
- `.donut-chart` - Donut/pie chart container
- `.bar-chart` - Bar chart container
- `.heatmap` - Heatmap grid container
- `.gauge-chart` - Gauge chart container
- `.progress-rings` - Progress rings container
- `.treemap` - Treemap grid container
- `.waterfall-chart` - Waterfall chart container
- `.stacked-bar-chart` - Stacked bar chart container
- `.radar-chart` - Radar chart container
- `.scatter-plot` - Scatter plot container

## Advanced: SVG Charts

For line charts, area charts, and more complex visualizations, you'll need to write custom SVG. Here's the basic structure:

```html
<div class="chart-card">
  <div class="chart-header">
    <h2 class="chart-title">Trend Analysis</h2>
    <p class="chart-description">Monthly values over time</p>
  </div>
  <div class="line-chart">
    <svg viewBox="0 0 600 260">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="50" y1="20" x2="50" y2="220" class="chart-grid"/>
      <line x1="50" y1="220" x2="580" y2="220" class="chart-grid"/>

      <!-- Area under line -->
      <path d="..." class="chart-area"/>

      <!-- Line -->
      <path d="..." class="chart-line"/>

      <!-- Data points -->
      <circle cx="50" cy="180" r="4" fill="#10b981"/>

      <!-- Labels -->
      <text x="50" y="240" class="chart-label" text-anchor="middle">Jan</text>
    </svg>
  </div>
</div>
```

## Best Practices

1. **Use consistent colors** - Stick to the ChartColors palette
2. **Add descriptions** - Help users understand what they're looking at
3. **Keep it simple** - Don't overcrowd charts with too much data
4. **Test responsiveness** - Check charts on different screen sizes
5. **Theme compatibility** - All charts auto-adapt to light/dark mode

## Examples

See `chart-examples.html` for a complete working example showcasing all chart types.

## Responsive Behavior

Charts automatically adjust:
- **Desktop (>768px)**: 2-column grid
- **Tablet**: 2-column grid
- **Mobile (<768px)**: Single column

Donut chart legends stack vertically on mobile for better readability.

## Performance Tips

1. **Limit data points** - Keep charts focused and performant
2. **Use CSS transforms** - Better performance than changing position
3. **Minimize reflows** - Batch DOM updates when adding multiple charts
4. **SVG optimization** - Keep paths simple and use viewBox for scaling

## Troubleshooting

**Charts not showing?**
- Verify CSS files are loaded
- Check console for JavaScript errors
- Ensure `.charts-section` container exists

**Incorrect colors in dark mode?**
- Use CSS variables (var(--green)) instead of hex colors
- Check that theme toggle is working

**Layout issues?**
- Verify main content has `id="mainContent"`
- Check that sidebar toggle is functioning
- Test with different sidebar states

## Integration with Real Data

To connect charts to real data, fetch your data and pass it to ChartBuilder:

```javascript
// Fetch data from API
async function loadChartData() {
  const response = await fetch('/api/energy-distribution');
  const data = await response.json();

  const donutHTML = ChartBuilder.donutChart({
    title: 'Energy Distribution',
    description: 'Current energy usage by source',
    segments: data.sources.map(source => ({
      label: source.name,
      value: source.percentage,
      color: getColorForSource(source.type)
    }))
  });

  insertChart('.charts-section', donutHTML);
}
```
