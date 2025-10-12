# Apply Professional Services Materiality Migration

## What This Does

This migration populates the `industry_materiality` table with **material metrics** for professional services (law firms). It defines which metrics from the catalog SHOULD be tracked based on:

1. **GRI 11 Sector Standard** (Services)
2. **Typical law firm operations** (office-based, knowledge work, client-facing)
3. **ESRS double materiality** (environmental impact + financial materiality)

## Materiality Levels

### HIGH Priority (Must Track)
- ✅ **Employee Commuting** - Major emissions source for office work
- ✅ **Business Travel** - Essential for client meetings (flights, trains, cars, hotels)
- ✅ **Electricity** - Primary Scope 2 emissions
- ✅ **IT Equipment** - Laptops, servers (embodied emissions)
- ✅ **Paper & Office Supplies** - Still significant in legal services

### MEDIUM Priority (Should Track)
- **Waste & Recycling** - Paper, plastic, e-waste
- **Water** - Office building consumption
- **Heating/Cooling** - HVAC systems
- **Cloud Computing** - Digital infrastructure

### LOW Priority (Optional)
- **Scope 1 Emissions** - Typically zero for office-based services

## How to Apply

### Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy contents from: `supabase/migrations/20251013_populate_professional_services_materiality.sql`
6. Paste and click **Run** (or Cmd/Ctrl + Enter)
7. Check output for success message

## Expected Output

```
====================================
✅ PROFESSIONAL SERVICES MATERIALITY POPULATED
====================================

Industry: Professional Services (GRI 11)
High Materiality Metrics: ~15
Medium Materiality Metrics: ~25
Low Materiality Metrics: ~18
Total: ~58

Recommendations will now prioritize:
  1. Employee commuting tracking
  2. Business travel monitoring
  3. IT equipment lifecycle
  4. Paper/office supplies
  5. Waste & recycling programs

====================================
```

## After Migration

The recommendations API will now suggest:
- **29 high-priority metrics** that PLMJ is not tracking
- Based on industry best practices
- With rationale explaining WHY each metric matters
- Prioritized by materiality level

Example recommendations:
- "Start tracking employee car commuting - tracked by 75% of peer law firms"
- "Add hotel stays to business travel tracking - high financial materiality"
- "Monitor IT equipment purchases - significant embodied emissions"

## Verification

After applying, run:
```bash
node check-recommendations-setup.js
```

Should now show:
```
✅ industry_materiality: 58 records (for professional_services)
```

Then test the API:
```bash
curl "http://localhost:3001/api/sustainability/recommendations/metrics?industry=professional_services"
```
