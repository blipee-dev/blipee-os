# Blipee Components Guide

Complete reference for all reusable components in the Blipee design system.

## Table of Contents

1. [Navigation Components](#navigation-components)
2. [Chart Components](#chart-components)
3. [Form Components](#form-components)
4. [Layout Components](#layout-components)
5. [Data Display Components](#data-display-components)
6. [Feedback Components](#feedback-components)
7. [Icons](#icons)

---

## Navigation Components

### Navbar

**Location:** `js/components.js`

Full-featured navigation bar with dashboard links, notifications, settings, and user menu.

```javascript
const navbarHTML = Components.navbar('energy'); // 'energy', 'water', 'carbon', 'waste'
document.querySelector('#app').innerHTML = navbarHTML;
```

**Features:**
- Active page highlighting
- Notification badge
- User dropdown with theme toggle
- Responsive design

### Sidebar

**Location:** `js/components.js`

Collapsible sidebar with organized sections.

```javascript
const sidebarHTML = Components.sidebar('dashboard'); // Active item: 'dashboard', 'analytics', etc.
document.querySelector('#app').insertAdjacentHTML('beforeend', sidebarHTML);
```

**Features:**
- Active item highlighting
- Collapsible (via toggle button)
- localStorage persistence
- Icon + label design

### Sidebar Toggle

```javascript
const toggleHTML = Components.sidebarToggle();
```

---

## Chart Components

**Location:** `js/charts.js`

All charts automatically adapt to light/dark theme and sidebar state.

### 1. Donut Chart

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

Compare values across categories.

```javascript
const barHTML = ChartBuilder.barChart({
  title: 'Cost Breakdown',
  description: 'Energy costs by category (€)',
  bars: [
    { label: 'Demand', value: 8200, gradient: ChartColors.gradients.primary },
    { label: 'Supply', value: 6500, gradient: ChartColors.gradients.purple },
    { label: 'Peak', value: 4900, gradient: ChartColors.gradients.red }
  ]
});
```

### 3. Gauge Chart

Progress or percentage towards a goal.

```javascript
const gaugeHTML = ChartBuilder.gaugeChart({
  title: 'Target Achievement',
  description: 'Progress towards reduction goals',
  value: 73,
  label: 'of target'
});
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
```

### 5. Heatmap

Patterns and intensities across time or categories.

```javascript
const heatmapHTML = ChartBuilder.heatmap({
  title: 'Peak Demand Analysis',
  description: 'Hourly demand patterns',
  cells: [
    { value: 22, color: 'rgba(16, 185, 129, 0.3)' },
    { value: 28, color: 'rgba(16, 185, 129, 0.4)' },
    // ... 35 cells total
  ]
});
```

### 6. Treemap

Hierarchical data visualization.

```javascript
const treemapHTML = ChartBuilder.treemap({
  title: 'Emissions Distribution',
  description: 'By source and category',
  cells: [
    { label: 'Transportation', value: '342 tCO₂', color: ChartColors.gradients.blue, size: '1 / span 2' },
    { label: 'Electricity', value: '287 tCO₂', color: ChartColors.gradients.green, size: '3 / span 2' }
  ]
});
```

### Chart Colors

```javascript
// Solid colors
ChartColors.green   // #10b981
ChartColors.blue    // #3b82f6
ChartColors.purple  // #8b5cf6
ChartColors.amber   // #f59e0b
ChartColors.cyan    // #06b6d4
ChartColors.red     // #ef4444

// Gradients
ChartColors.gradients.primary
ChartColors.gradients.green
ChartColors.gradients.blue
ChartColors.gradients.purple
ChartColors.gradients.red
ChartColors.gradients.amber

// Opacity helper
ChartColors.opacity('#10b981', 0.5) // Returns rgba
```

---

## Form Components

**Location:** `css/shared-styles.css`

### Buttons

```html
<!-- Primary Button -->
<button class="btn-primary">Save Changes</button>

<!-- Secondary Button -->
<button class="btn-secondary">Cancel</button>

<!-- Ghost Button -->
<button class="btn-ghost">Learn More</button>

<!-- Icon Button -->
<button class="icon-btn" aria-label="Settings">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <!-- Icon path -->
  </svg>
</button>

<!-- Button with icon -->
<button class="btn-primary">
  <svg><!-- icon --></svg>
  <span>Add Item</span>
</button>
```

**Variants:**
- `.btn-primary` - Main actions (green gradient)
- `.btn-secondary` - Secondary actions (glass effect)
- `.btn-ghost` - Tertiary actions (minimal)
- `.icon-btn` - Icon-only buttons

### Input Fields

```html
<!-- Text Input -->
<div class="form-group">
  <label for="username">Username</label>
  <input type="text" id="username" placeholder="Enter username">
</div>

<!-- Password Input -->
<div class="form-group">
  <label for="password">Password</label>
  <input type="password" id="password" placeholder="Enter password">
</div>

<!-- Input with Icon -->
<div class="form-group">
  <label for="email">Email</label>
  <div class="input-icon">
    <svg class="input-icon-left"><!-- mail icon --></svg>
    <input type="email" id="email" placeholder="you@example.com">
  </div>
</div>
```

### Select / Dropdown

```html
<div class="form-group">
  <label for="site">Select Site</label>
  <select class="filter-select" id="site">
    <option>All Sites</option>
    <option>Headquarters</option>
    <option>Manufacturing Plant A</option>
  </select>
</div>
```

### Checkbox

```html
<label class="checkbox-label">
  <input type="checkbox">
  <span>Remember me</span>
</label>
```

### Radio Buttons

```html
<label class="radio-label">
  <input type="radio" name="option" value="1">
  <span>Option 1</span>
</label>
```

---

## Layout Components

### Cards

```html
<!-- Basic Card -->
<div class="chart-card">
  <div class="chart-header">
    <h2 class="chart-title">Card Title</h2>
    <p class="chart-description">Card description</p>
  </div>
  <div class="card-content">
    <!-- Content here -->
  </div>
</div>

<!-- Glass Card -->
<div style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 1.5rem;">
  <!-- Content -->
</div>
```

### KPI Cards

```html
<div class="kpi-card">
  <div class="kpi-header">
    <span class="kpi-label">Total Energy</span>
    <svg class="kpi-icon icon-green"><!-- icon --></svg>
  </div>
  <div class="kpi-value">1,247 kWh</div>
  <div class="kpi-trend trend-positive">
    <span>↑ 12.5%</span>
    <span style="color: var(--text-tertiary)">vs last month</span>
  </div>
</div>
```

### Grid Layouts

```html
<!-- Charts Grid -->
<div class="charts-section">
  <!-- Auto-responsive 2-column grid -->
</div>

<!-- KPI Grid -->
<div class="kpi-grid">
  <!-- Auto-responsive grid -->
</div>
```

---

## Data Display Components

### Tables

```html
<div class="chart-card">
  <div class="chart-header">
    <h2 class="chart-title">Data Table</h2>
    <p class="chart-description">Detailed breakdown</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Value</th>
        <th>Change</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Scope 1</td>
        <td>342 tCO₂</td>
        <td style="color: var(--green);">↓ 8%</td>
        <td><span class="status-badge status-on-track">On Track</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

**Styling:** Tables automatically get glass effect, hover states, and responsive design.

### Badges / Status Indicators

```html
<!-- Status Badges -->
<span class="status-badge status-on-track">On Track</span>
<span class="status-badge status-at-risk">At Risk</span>

<!-- Notification Badge -->
<span class="notification-badge">3</span>

<!-- Trend Indicators -->
<div class="kpi-trend trend-positive">↑ 12.5%</div>
<div class="kpi-trend trend-negative">↓ 8.2%</div>
```

### Metrics Display

```html
<div class="metric">
  <div class="metric-label">Active Users</div>
  <div class="metric-value">1,247</div>
  <div class="metric-change positive">+12.5%</div>
</div>
```

---

## Feedback Components

### Alerts

```html
<!-- Success Alert -->
<div class="alert alert-success">
  <svg class="alert-icon"><!-- checkmark --></svg>
  <div>
    <div class="alert-title">Success</div>
    <div class="alert-message">Your changes have been saved.</div>
  </div>
</div>

<!-- Error Alert -->
<div class="alert alert-error">
  <svg class="alert-icon"><!-- x icon --></svg>
  <div>
    <div class="alert-title">Error</div>
    <div class="alert-message">Something went wrong.</div>
  </div>
</div>
```

### Loading States

```html
<!-- Spinner -->
<div class="spinner"></div>

<!-- Skeleton Loader -->
<div class="skeleton"></div>
```

---

## Icons

All icons use Feather Icons style (24x24 viewBox).

### Common Icons

```html
<!-- Dashboard -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="7" height="7"/>
  <rect x="14" y="3" width="7" height="7"/>
  <rect x="14" y="14" width="7" height="7"/>
  <rect x="3" y="14" width="7" height="7"/>
</svg>

<!-- Energy / Lightning -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
</svg>

<!-- Settings / Gear -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83..."/>
</svg>

<!-- User -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>

<!-- Bell / Notifications -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>
```

---

## Theme System

### CSS Variables

```css
/* Dark Mode (default) */
body[data-theme="dark"] {
  --bg-primary: #020617;
  --bg-secondary: #0f172a;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-tertiary: rgba(255, 255, 255, 0.7);
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
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
}
```

### Theme Toggle Functions

```javascript
// Initialize theme on page load
initTheme();

// Toggle between light and dark
toggleTheme();
```

---

## Quick Start

### 1. Include Required Files

```html
<head>
  <link rel="stylesheet" href="./css/shared-styles.css">
  <link rel="stylesheet" href="./css/chart-styles.css">
</head>

<body>
  <!-- Your content -->
  
  <script src="./js/components.js"></script>
  <script src="./js/charts.js"></script>
</body>
```

### 2. Initialize Dashboard Components

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Initialize with dynamic components
  initDashboardComponents({
    activePage: 'energy',
    activeItem: 'dashboard',
    containerSelector: '#app'
  });
  
  // Or use static HTML (current approach in energy/carbon dashboards)
  initTheme();
  initSidebar();
});
```

### 3. Add Charts

```javascript
// Generate chart HTML
const donutHTML = ChartBuilder.donutChart({...});

// Insert into page
insertChart('.charts-section', donutHTML);
```

---

## File Structure

```
docs/
├── css/
│   ├── shared-styles.css    # Base styles, buttons, forms, layout
│   └── chart-styles.css     # Chart-specific styles
├── js/
│   ├── components.js        # Navbar, sidebar, theme toggle
│   └── charts.js            # Chart builders
├── CHARTS_GUIDE.md          # Chart documentation
└── COMPONENTS_GUIDE.md      # This file
```

---

## Best Practices

1. **Consistent Spacing:** Use CSS variables for spacing (1rem = 16px)
2. **Color Palette:** Stick to ChartColors for consistency
3. **Accessibility:** Always include aria labels on interactive elements
4. **Responsive:** Test on mobile, tablet, and desktop
5. **Theme Support:** Use CSS variables instead of hard-coded colors
6. **Performance:** Minimize DOM manipulation, batch updates

---

## Examples

See working examples in:
- `energy-dashboard.html` - Full dashboard with all components
- `carbon-dashboard.html` - Chart system showcase
- `signin.html` - Form components
- `index.html` - Landing page components

---

## Need Help?

- Check `CHARTS_GUIDE.md` for detailed chart documentation
- Review existing dashboards for implementation examples
- All components auto-adapt to light/dark theme
- Use browser DevTools to inspect component structure
