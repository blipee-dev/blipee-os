# Blipee Dashboard Components

This directory contains reusable HTML components for Blipee dashboards.

## Available Components

### navbar.html
Complete navigation bar with:
- Blipee logo
- Navigation links (Energy, Water, Carbon, Waste)
- Notification and settings buttons
- User menu with dropdown
- Theme toggle integrated in user dropdown

### sidebar.html
Collapsible sidebar navigation with:
- Overview section (Dashboard, Analytics, Reports)
- Energy section (Consumption, Cost Analysis, Efficiency, Goals)
- Settings section (Billing, Integrations, Preferences)
- Toggle button for expand/collapse

### background.html
Animated gradient mesh background that adapts to theme.

## Usage

Components are automatically loaded by `js/components.js`. See `COMPONENTS_GUIDE.md` in the parent directory for complete documentation.

## Customization

Edit these HTML files to:
- Add new navigation links
- Add new sidebar sections/items
- Change icons
- Modify structure

Changes will automatically apply to all dashboards that use the component loader.
