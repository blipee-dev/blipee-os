# Site Rankings Feature

## Overview
Enhanced the Performance Index section with a new 3-column layout that includes a site rankings display, allowing users to quickly compare emission performance across all sites.

## Changes Made

### 1. Layout Reorganization
**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx`
**Lines**: 106-154

Changed from 2-column to 3-column grid layout:
- **Column 1**: Circular score display (blipee Performance Index™)
- **Column 2**: Category scores breakdown
- **Column 3**: Site rankings (NEW)

```typescript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  {/* Three columns with staggered animations */}
</div>
```

### 2. New SiteRankingsDisplay Component
**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx`
**Lines**: 652-804

Features:
- Fetches all sites from `/api/organizations/{id}/buildings`
- Fetches performance score for each site from `/api/scoring/site/{siteId}`
- Sorts sites by blipee Performance Index™ score (0-100) - higher is better
- Visual ranking indicators:
  - 🥇 Top performer (green gradient)
  - 🥈 Second place (blue gradient)
  - 🥉 Third place (purple gradient)
  - Numbered badges for others (gray)
- Displays:
  - Site name
  - Performance grade (A+, A, B, C, D, F)
  - Performance score (0-100)
- Highlights currently selected site with cyan ring
- Loading states with skeleton animation
- Hover tooltip explaining ranking methodology
- Scrollable list (max height 280px)

### 3. Internationalization
Added translations for site rankings in all three supported languages:

**English** (`/src/messages/en.json`):
```json
"siteRankings": {
  "title": "Site Rankings",
  "noData": "No site data available",
  "tooltip": {
    "title": "Site Performance Rankings",
    "description": "Sites ranked by their blipee Performance Index™ score (0-100), where higher scores indicate better overall sustainability performance. Top 3 performers are highlighted with medals. Use this ranking to identify best practices and share learnings across sites."
  }
}
```

**Portuguese** (`/src/messages/pt.json`):
```json
"siteRankings": {
  "title": "Ranking de Sites",
  "noData": "Sem dados de sites disponíveis",
  "tooltip": {
    "title": "Ranking de Desempenho dos Sites",
    "description": "Sites classificados pela pontuação blipee Performance Index™ (0-100), onde pontuações mais altas indicam melhor desempenho geral de sustentabilidade. Os 3 melhores desempenhos são destacados com medalhas. Use este ranking para identificar melhores práticas e compartilhar aprendizados entre sites."
  }
}
```

**Spanish** (`/src/messages/es.json`):
```json
"siteRankings": {
  "title": "Clasificación de Sitios",
  "noData": "No hay datos de sitios disponibles",
  "tooltip": {
    "title": "Clasificación de Rendimiento de Sitios",
    "description": "Sitios clasificados por su puntuación blipee Performance Index™ (0-100), donde puntuaciones más altas indican mejor rendimiento general de sostenibilidad. Los 3 mejores sitios son destacados con medallas. Use esta clasificación para identificar mejores prácticas y compartir conocimientos entre sitios."
  }
}
```

## Technical Details

### Ranking Algorithm
Sites are ranked by their blipee Performance Index™ score:
```
score = overall_score (0-100 scale)
```

Higher score = better performance = higher ranking

The blipee Performance Index™ is a comprehensive sustainability score that combines:
- Energy efficiency
- Water management
- Waste reduction
- Transportation emissions
- Compliance with regulations
- Human experience metrics
- Supply chain sustainability

### Responsive Design
- Mobile/Tablet: Single column layout
- Desktop (lg breakpoint): Three columns side by side
- Smooth animations with Framer Motion
- Glass morphism design consistent with blipee theme

### Data Flow
1. Component fetches all sites from `/api/organizations/{organizationId}/buildings`
2. For each site, fetches performance score from `/api/scoring/site/{siteId}`
3. Filters out sites without scores
4. Sorts by performance score (descending - higher is better)
5. Renders ranked list with visual indicators (medals for top 3)

## User Benefits

1. **Quick Comparison**: See at a glance which sites have the best overall sustainability performance
2. **Holistic View**: Rankings based on comprehensive blipee Performance Index™, not just emissions
3. **Performance Context**: Understand selected site's position relative to others
4. **Best Practice Identification**: Top performers can share strategies and learnings
5. **Data-Driven Decisions**: Scores combine multiple sustainability factors for fair comparison
6. **Visual Clarity**: Medal system immediately highlights top 3 performers
7. **Grade Reference**: Quick grade view (A+, A, B, C, D, F) for easy understanding

## Integration

The rankings display:
- Automatically updates when organization changes
- Fetches from existing scoring API endpoints
- Respects current site selection (highlights it)
- Shows only sites with calculated performance scores
- No additional backend changes required
- Fully internationalized (EN/PT/ES)

## Testing Checklist

- [ ] Three columns display correctly on desktop
- [ ] Layout is responsive on mobile/tablet
- [ ] Site rankings load performance scores correctly
- [ ] Sites are sorted by score (highest first)
- [ ] Medal indicators appear for top 3
- [ ] Selected site is highlighted
- [ ] Performance scores (0-100) display correctly
- [ ] Grades (A+, A, B, C, D, F) display correctly
- [ ] Only sites with scores are shown
- [ ] Tooltips appear on hover
- [ ] Loading states display properly
- [ ] Empty state shows when no data
- [ ] All three languages display correctly
- [ ] Animations are smooth

## Future Enhancements

Potential improvements:
- Click on site to switch to that site's view
- Show trend arrows (score improving/declining over time)
- Add time period selector for historical rankings
- Export rankings to PDF/CSV
- Show category breakdown on hover (which categories drive the score)
- Display score change since last period
- Add filter to show only sites above/below certain score threshold
- Show organization average score as benchmark line
