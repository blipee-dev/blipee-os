# Blipee Performance Index™ - Integration Guide

## Overview

The Blipee Performance Index™ is Arc Skoru's scoring system on steroids. It provides a comprehensive 0-100 sustainability performance score with:

- **8 weighted categories** (vs Arc's 5)
- **Industry-specific weighting** (GRI sector standards)
- **ML-powered predictions**
- **Real-time improvement velocity**
- **AI agent integration**
- **Portfolio-level aggregation**

---

## Visual Layout

### Dashboard Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    SUSTAINABILITY DASHBOARD                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🎯 BLIPEE PERFORMANCE INDEX™              [Recalculate]│ │
│  │  Portfolio-wide sustainability performance   │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │   ┌─────────┐                                           │ │
│  │   │   67    │   Overall Score: 67/100 (Grade B)        │ │
│  │   │  /100   │   Improvement: +23 🚀 (Top 15%)          │ │
│  │   │   B     │   Percentile: 73rd (Better than 73%)     │ │
│  │   └─────────┘   Predicted 90d: 74 (+7 points)          │ │
│  │                                                          │ │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│  │   Energy           78  ▓▓▓▓▓▓▓▓░░  ↗️ 67th %ile        │ │
│  │   Water            52  ▓▓▓▓▓░░░░░  ↘️ 41st %ile ⚠️      │ │
│  │   Waste            61  ▓▓▓▓▓▓░░░░  →  58th %ile        │ │
│  │   Transport        45  ▓▓▓▓░░░░░░  ↗️ 39th %ile ⚠️      │ │
│  │   Human Exp.       72  ▓▓▓▓▓▓▓░░░  ↗️ 81st %ile ⭐      │ │
│  │   Scope 3          58  ▓▓▓▓▓▓░░░░  →  55th %ile        │ │
│  │   Supply Chain     42  ▓▓▓▓░░░░░░  ↗️ 48th %ile        │ │
│  │   Compliance       95  ▓▓▓▓▓▓▓▓▓░  →  92nd %ile ⭐      │ │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│  │                                                          │ │
│  │   🎯 Top Opportunities (AI-Generated):                  │ │
│  │   1. Water efficiency → +6 pts, $12K, 18mo payback     │ │
│  │   2. Transport survey → +4 pts, FREE 💡 AI Working     │ │
│  │   3. Scope 3 supplier → +5 pts, $8K, 24mo payback      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ℹ️ How Blipee beats Arc Skoru:                             │
│     • Industry-specific weighting (GRI standards)            │
│     • Scope 3 & Supply Chain (Arc doesn't have)             │
│     • ML predictions & improvement velocity                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                       Detailed Metrics                       │
├──────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Total  │ │Emission│ │Projected│ │ Target │               │
│  │Emissions│ │Intensity│ │ Annual │ │Progress│               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                              │
│  [Scope Breakdown]  [Emissions Trend]  [Top Emitters]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration Steps

### 1. Update Dashboard Page

Replace the standard `OverviewDashboard` with `OverviewDashboardWithScore`:

```tsx
// src/app/sustainability/dashboard/DashboardClient.tsx

import { OverviewDashboardWithScore } from '@/components/dashboard/OverviewDashboardWithScore';

export default function DashboardClient() {
  // ... your existing code ...

  return (
    <div>
      {/* Replace OverviewDashboard with OverviewDashboardWithScore */}
      <OverviewDashboardWithScore
        organizationId={organizationId}
        selectedSite={selectedSite}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
}
```

### 2. Run Database Migration

```bash
# Apply the performance scoring schema
npx supabase db push

# This creates:
# - performance_scores table
# - category_scores table
# - performance_score_history table
# - peer_benchmarks table
# - score_opportunities table
# - portfolio_best_practices table
```

### 3. Seed Peer Benchmark Data (Optional)

The migration includes sample peer benchmarks for manufacturing, office, and retail industries. Add more as needed:

```sql
INSERT INTO peer_benchmarks (
  industry,
  size_range,
  region,
  category,
  median_score,
  top_10_percentile_score,
  top_25_percentile_score,
  bottom_25_percentile_score,
  sample_count,
  period_start,
  period_end
)
VALUES (
  'healthcare',
  '50000-100000',
  'West Coast',
  'overall',
  65,
  85,
  78,
  48,
  120,
  '2024-01-01',
  '2024-12-31'
);
```

---

## API Endpoints

### Calculate Site Score

```bash
# GET - Retrieve latest score
GET /api/scoring/site/{siteId}

# POST - Recalculate score
POST /api/scoring/site/{siteId}
Content-Type: application/json

{
  "timeWindow": 365,        # Days (default: 365)
  "includeForecasts": true, # ML predictions
  "industryOverride": null  # Force specific industry
}
```

### Calculate Portfolio Score

```bash
# GET - Retrieve latest portfolio score
GET /api/scoring/portfolio/{organizationId}

# POST - Recalculate portfolio score
POST /api/scoring/portfolio/{organizationId}
```

---

## Component Usage

### Full Score Card (Default)

```tsx
import { PerformanceScoreCard } from '@/components/scoring/PerformanceScoreCard';

<PerformanceScoreCard
  data={scoreData}
  variant="full"
  showPredictions={true}
  showOpportunities={true}
  animated={true}
/>
```

### Compact Score Card (Sidebar)

```tsx
<PerformanceScoreCard
  data={scoreData}
  variant="compact"
  animated={true}
/>
```

### Minimal Score Card (Widget)

```tsx
<PerformanceScoreCard
  data={scoreData}
  variant="minimal"
  animated={true}
/>
```

---

## React Query Hooks

### Fetch Site Score

```tsx
import { useSitePerformanceScore } from '@/hooks/usePerformanceScore';

const { data, isLoading, error } = useSitePerformanceScore(siteId);
```

### Fetch Portfolio Score

```tsx
import { usePortfolioPerformanceScore } from '@/hooks/usePerformanceScore';

const { data, isLoading } = usePortfolioPerformanceScore(organizationId);
```

### Recalculate Score

```tsx
import { useRecalculateScore } from '@/hooks/usePerformanceScore';

const { recalculateSiteScore } = useRecalculateScore();

const handleRecalculate = async () => {
  await recalculateSiteScore(siteId);
  // Score will auto-refresh via React Query
};
```

---

## Scoring Categories & Weights

### Default Weights (Office)

| Category | Weight | What It Measures |
|----------|--------|------------------|
| **Energy** | 25% | Total energy consumption & carbon intensity |
| **Water** | 8% | Water consumption & efficiency |
| **Waste** | 6% | Waste generation & diversion rate |
| **Transportation** | 15% | Commuting & business travel emissions |
| **Human Experience** | 20% | Indoor air quality, occupant satisfaction |
| **Scope 3 Emissions** | 18% | Value chain & supply chain emissions |
| **Supply Chain** | 3% | Supplier ESG assessment coverage |
| **Compliance** | 5% | Regulatory & certification compliance |

### Industry-Specific Weighting

```typescript
// Manufacturing
{
  energy: 0.35,        // Higher energy intensity
  water: 0.18,         // Water-intensive processes
  waste: 0.12,
  transportation: 0.08,
  humanExperience: 0.12,
  scopeThree: 0.10,
  supplyChain: 0.05,
  compliance: 0.05
}

// Retail
{
  energy: 0.28,
  water: 0.10,
  waste: 0.15,         // Packaging waste
  transportation: 0.12,
  humanExperience: 0.15,
  scopeThree: 0.15,    // Product supply chain
  supplyChain: 0.08,
  compliance: 0.05
}
```

---

## Blipee vs Arc Comparison

| Feature | Arc Skoru | Blipee Performance Index™ |
|---------|-----------|---------------------------|
| Overall Score | ✅ 0-100 | ✅ 0-100 |
| Energy Category | ✅ 33% fixed | ✅ 25-40% industry-adjusted |
| Water Category | ✅ 15% fixed | ✅ 5-20% industry-adjusted |
| **Scope 3** | ❌ None | ✅ 10-25% (NEW) |
| **Supply Chain** | ❌ None | ✅ 0-15% (NEW) |
| **Compliance** | ❌ None | ✅ 3-10% (NEW) |
| Industry-Specific | ❌ One-size-fits-all | ✅ GRI sector weighting |
| Improvement Velocity | ❌ None | ✅ Real-time (-100 to +100) |
| Predictions | ❌ None | ✅ ML forecasts (30/90/365d) |
| **AI Integration** | ❌ Manual | ✅ Autonomous agents |
| Portfolio View | ✅ Basic aggregation | ✅ Cross-site optimization |

---

## AI Agent Integration

The scoring system automatically creates "opportunities" that AI agents can work on:

```typescript
// Opportunities are automatically saved to database
interface ScoringOpportunity {
  category: 'water' | 'energy' | 'waste' | ...
  action: 'Water efficiency upgrades'
  potentialPoints: 6                    // +6 points
  estimatedCost: '$12,000'
  paybackMonths: 18
  priority: 'high' | 'medium' | 'low'
  agentWorking: false                   // AI agent can claim this
}
```

### Enable AI Agents to Work on Opportunities

```typescript
// In your AI agent code (ESG Chief of Staff, Carbon Hunter, etc.)
const opportunities = await supabase
  .from('score_opportunities')
  .select('*')
  .eq('status', 'identified')
  .eq('agent_working', false)
  .order('potential_points', { ascending: false })
  .limit(1);

// Claim the opportunity
await supabase
  .from('score_opportunities')
  .update({
    agent_working: true,
    status: 'in_progress',
    agent_id: agentId
  })
  .eq('id', opportunities[0].id);

// Agent works on it autonomously...
```

---

## Scheduled Recalculation

Set up a cron job to recalculate scores daily/weekly:

```typescript
// /api/cron/recalculate-scores/route.ts
export async function GET() {
  const supabase = createClient();

  // Get all sites
  const { data: sites } = await supabase.from('sites').select('id');

  // Recalculate each site
  for (const site of sites) {
    await performanceScorer.calculateSiteScore(site.id);
  }

  return Response.json({ success: true });
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/recalculate-scores",
    "schedule": "0 2 * * *"  // Daily at 2 AM
  }]
}
```

---

## Troubleshooting

### Score Not Calculating

**Issue**: Score returns 0 or "No data available"

**Solution**: Ensure you have:
- Energy data in `energy_data` table
- Water data in `water_data` table
- Waste data in `waste_data` table
- At least 30 days of data for accurate scoring

### Wrong Industry Weighting

**Issue**: Score using default weights instead of industry-specific

**Solution**: Set `industry` field on your site:

```sql
UPDATE sites
SET industry = 'manufacturing'  -- or 'office', 'retail', etc.
WHERE id = '{siteId}';
```

### Peer Percentile Shows 50%

**Issue**: No peer benchmark data for your industry

**Solution**: Add peer benchmarks for your industry (see "Seed Peer Benchmark Data" above)

---

## What's Next?

The scoring foundation is complete. Next enhancements:

1. **Climate Risk Module** (Arc's premium addon)
   - Transition risk scoring
   - Physical risk assessment
   - Electrification tracking

2. **Financial Impact Calculator** (Arc's premium addon)
   - ROI calculations
   - Payback period forecasting
   - Carbon pricing scenarios

3. **Certification Automation**
   - LEED, ISO 14001, CDP auto-completion
   - TCFD report generation
   - GRI disclosure mapping

4. **Advanced ML Models**
   - Deep learning for anomaly detection
   - Reinforcement learning for optimization
   - NLP for document parsing

---

## Support

Questions? Check the Blipee OS docs or reach out to the team!

**Remember**: We're not competing with Arc - we're creating a new category. 🚀
