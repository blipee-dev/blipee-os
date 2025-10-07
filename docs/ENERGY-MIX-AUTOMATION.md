# Energy Mix Automation - Complete Guide

## Overview

The energy mix system is **fully automated** with 3 data sources working in priority order:

1. **Invoice Data** (Highest Priority) - Extracted by AI from PDFs
2. **Electricity Maps API** (Automatic Fallback) - Real-time grid data with emission factors
3. **Manual Entry** (Edge Cases) - Via reference table

### Key Features

- **Automatic Grid Mix Detection**: Renewable vs non-renewable sources
- **GHG Protocol Compliant Emissions**: Scope 2 (Direct) + Scope 3 Category 3 (Upstream)
- **Location-Specific Factors**: Real-time emission factors from 200+ countries
- **Time-Specific Accuracy**: Factors vary by year/month for historical accuracy

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  User Action                                            │
└─────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   Upload Invoice              Manual Data Entry
        │                             │
        ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│ AI Document      │          │ INSERT into      │
│ Parser           │          │ metrics_data     │
│                  │          └──────────────────┘
│ Extracts:        │                   │
│ - Consumption    │                   │
│ - Energy Mix     │                   ▼
│ - Sources        │          ┌──────────────────┐
└──────────────────┘          │ Database Trigger │
        │                     │ (AFTER INSERT)   │
        │                     └──────────────────┘
        │                             │
        │                             ▼
        │                     ┌──────────────────┐
        │                     │ Has grid_mix?    │
        │                     │ in metadata?     │
        │                     └──────────────────┘
        │                             │
        │                     No ─────┤
        │                             ▼
        │                     ┌──────────────────┐
        │                     │ Call API:        │
        │                     │ /api/energy/     │
        │                     │ auto-populate-mix│
        │                     └──────────────────┘
        │                             │
        │                             ▼
        │                     ┌──────────────────┐
        │                     │ Electricity Maps │
        │                     │ API Call         │
        │                     └──────────────────┘
        │                             │
        │                             ▼
        │                     ┌──────────────────┐
        │                     │ Update metadata  │
        │                     │ with grid_mix    │
        └─────────────────────┴──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Energy Dashboard │
                    │ Shows Mix Data   │
                    └──────────────────┘
```

## 1. Invoice Parsing (AI Extraction)

### Location
`/src/lib/data/document-parser.ts` → `extractEnergyMix()`

### What It Extracts

From electricity invoices in **any language** (Portuguese, English, Spanish, etc.):

```
Input (Invoice Text):
"Energia renovável: 56,99%
Eólica: 11,38%
Hídrica: 31,22%
Solar: 8,20%
Gás Natural: 28,35%
Carvão: 0,58%"

Output (Structured Data):
{
  "renewable_percentage": 56.99,
  "non_renewable_percentage": 43.01,
  "sources": [
    {"name": "Wind", "percentage": 11.38, "renewable": true},
    {"name": "Hydro", "percentage": 31.22, "renewable": true},
    {"name": "Solar", "percentage": 8.20, "renewable": true},
    {"name": "Natural Gas", "percentage": 28.35, "renewable": false},
    {"name": "Coal", "percentage": 0.58, "renewable": false}
  ]
}
```

### Supported Patterns

- Portuguese: "Renovável", "Eólica", "Hídrica", "Gás Natural"
- English: "Renewable", "Wind", "Hydro", "Natural Gas"
- Spanish: "Renovable", "Eólico", "Hidráulico"

### Sources Recognized

**Renewable**:
- Wind / Eólica / Vento
- Hydro / Hídrica / Água
- Solar / Fotovoltaica / PV
- Biomass / Biomassa
- Geothermal / Geotermia

**Non-Renewable**:
- Natural Gas / Gás Natural
- Coal / Carvão
- Oil / Diesel / Fuelóleo
- Nuclear
- Cogeneration / Cogeração

## 2. Auto-Populate (Database Trigger + API)

### Flow

1. **New Record Inserted** → `metrics_data` table
2. **Trigger Fires** → `trigger_auto_populate_grid_mix` (AFTER INSERT)
3. **Check**: Does metadata already have `grid_mix.sources`?
   - **YES** → Skip (invoice data present)
   - **NO** → Continue
4. **HTTP Request** → `POST /api/energy/auto-populate-mix`
5. **API Logic**:
   - Get metric info (energy_type)
   - Get site country_code
   - Call Electricity Maps API
   - Convert to energy mix format
   - Update record metadata

### Database Trigger

**File**: `/supabase/migrations/20251007_auto_populate_grid_mix_webhook.sql`

```sql
CREATE TRIGGER trigger_auto_populate_grid_mix
  AFTER INSERT ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_grid_mix_webhook();
```

**Key Features**:
- **Non-blocking**: Uses AFTER INSERT (doesn't slow down data entry)
- **Async**: HTTP request via pg_net extension
- **Smart Skip**: Checks if data already exists
- **Multi-country**: Gets country from site location

### API Endpoint

**File**: `/src/app/api/energy/auto-populate-mix/route.ts`

**Endpoint**: `POST /api/energy/auto-populate-mix`

**Request**:
```json
{
  "record": {
    "id": "uuid",
    "metric_id": "uuid",
    "value": 1000,
    "period_start": "2024-01-15",
    "site_id": "uuid",
    "metadata": {}
  }
}
```

**Response**:
```json
{
  "success": true,
  "renewable_percentage": 76,
  "sources_count": 8
}
```

## 3. Multi-Country Support

The system automatically detects the country from the site location:

```sql
-- Get country from site
SELECT country_code FROM sites WHERE id = site_id;

-- Fetch grid mix for that country
GET https://api.electricitymap.org/v3/power-breakdown/history?zone={country_code}
```

**Supported Countries**: 200+ (all countries in Electricity Maps)

Examples:
- **PT** (Portugal) → Portuguese grid mix
- **ES** (Spain) → Spanish grid mix
- **DE** (Germany) → German grid mix
- **US-CAL-CISO** (California) → California grid mix

## Setup Instructions

### Step 1: Apply Database Migration

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- File: supabase/migrations/20251007_auto_populate_grid_mix_webhook.sql
-- (Copy and paste entire file)
```

This creates:
- `trigger_auto_populate_grid_mix` trigger
- `auto_populate_grid_mix_webhook()` function
- Configures API URL

### Step 2: Configure Environment Variables

Ensure `.env.local` has:

```bash
# Required
ELECTRICITY_MAPS_API_KEY=T4xEjR2XyjTyEmfqRYh1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 3: Test the Automation

#### Test 1: Manual Data Entry

```typescript
// Add new electricity record
await supabase
  .from('metrics_data')
  .insert({
    metric_id: 'electricity-metric-id',
    value: 1000,
    unit: 'kWh',
    period_start: '2024-01-15',
    site_id: 'your-site-id',
    organization_id: 'your-org-id'
  });

// Wait 2-3 seconds for trigger to complete

// Check if grid mix was added
const { data } = await supabase
  .from('metrics_data')
  .select('metadata')
  .eq('id', 'record-id')
  .single();

console.log(data.metadata.grid_mix);
// Should show: renewable_percentage, sources, etc.
```

#### Test 2: Invoice Upload

```typescript
// Upload electricity invoice PDF
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('type', 'utility');

await fetch('/api/documents/parse', {
  method: 'POST',
  body: formData
});

// AI extracts:
// - Consumption: 1000 kWh
// - Period: January 2024
// - Energy Mix: 56.99% renewable
// - Sources: [Wind, Hydro, Solar, Gas, Coal]

// Record is created with grid_mix already in metadata
// Trigger sees grid_mix exists → skips API call
```

## Maintenance

### Backfill Existing Records

If you have old records without grid mix:

```bash
npx tsx backfill-energy-mix-simple.ts
```

This script:
- Fetches all electricity records
- Calls Electricity Maps API for each
- Updates metadata with grid_mix

**Time**: ~30 seconds for 200 records (200ms rate limit)

### Monitor API Usage

Electricity Maps API limits:
- **Free Tier**: 1000 requests/month
- **Current Usage**: Check dashboard

### Update API Key

If you need to rotate the API key:

```bash
# Update .env.local
ELECTRICITY_MAPS_API_KEY=new-key

# Restart dev server
npm run dev

# Or in production, update Vercel environment variable
```

## Troubleshooting

### Issue: Trigger not firing

**Check 1**: Verify trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_populate_grid_mix';
```

**Check 2**: Check trigger logs
```sql
SELECT * FROM pg_stat_activity WHERE query LIKE '%auto_populate%';
```

**Fix**: Re-run migration

### Issue: API returns 401 Unauthorized

**Cause**: Invalid or expired API key

**Fix**: Update `ELECTRICITY_MAPS_API_KEY` in `.env.local`

### Issue: Grid mix not showing in dashboard

**Check 1**: Verify data in database
```sql
SELECT metadata->'grid_mix' FROM metrics_data WHERE id = 'your-id';
```

**Check 2**: Check API response
```bash
curl http://localhost:3000/api/energy/sources?start_date=2024-01-01
```

**Fix**: Refresh dashboard page

### Issue: Invoice parsing not extracting mix

**Cause**: Invoice format not recognized

**Fix**: Add new patterns to `extractEnergyMix()` function:

```typescript
const renewablePatterns = [
  // Add your invoice's pattern here
  /your pattern here/i,
];
```

## Performance

### API Call Times

- Electricity Maps API: ~200-500ms
- Trigger execution: ~1-2 seconds total
- User experience: **No blocking** (AFTER INSERT)

### Database Impact

- Trigger overhead: Minimal (~10ms)
- HTTP request: Async (doesn't block)
- Metadata update: Single UPDATE query

### Scaling

- **100 records/day**: No issues
- **1000 records/day**: Consider caching
- **10000+ records/day**: Implement queue system

## Future Enhancements

### 1. Hourly Granularity

Currently uses daily mix. Could use hourly for more accuracy:

```typescript
// Instead of date: "2024-01-15"
// Use datetime: "2024-01-15T14:30:00Z"
```

### 2. Provider-Specific Mix

Some suppliers have better mix than grid average:

```typescript
// Check if invoice specifies supplier
if (supplierName === 'Green Energy Co') {
  // Use supplier's specific mix instead of grid
  mix = getSupplierMix(supplierName);
}
```

### 3. Predictive Mix

For future dates, predict mix based on historical trends:

```typescript
if (date > new Date()) {
  mix = predictFutureMix(countryCode, date);
}
```

## Summary

✅ **Fully Automated**: New records get grid mix automatically
✅ **Invoice Priority**: AI extracts from PDFs when available
✅ **API Fallback**: Electricity Maps provides real-time data
✅ **Multi-Country**: Works for 200+ countries
✅ **Non-Blocking**: Doesn't slow down data entry
✅ **Smart Caching**: API responses cached for 1 hour

**No manual work needed** - the system handles everything! 🎉

## Emission Factors System

### Overview

The system automatically fetches and calculates emission factors compliant with the GHG Protocol:

- **Scope 2**: Direct emissions from electricity generation (85% of lifecycle)
- **Scope 3 Category 3**: Upstream emissions from fuel extraction, processing, and transport (15% of lifecycle)
- **Lifecycle Total**: Combined Scope 2 + Scope 3.3 emissions

### Emission Factor Calculation

**Source**: Electricity Maps API provides lifecycle carbon intensity in gCO2eq/kWh

**Methodology**: 85/15 split based on industry standards
```typescript
emissionFactorLifecycle = 124 gCO2/kWh  // From API
emissionFactorScope2 = 124 × 0.85 = 105.40 gCO2/kWh
emissionFactorScope3 = 124 × 0.15 = 18.60 gCO2/kWh
```

### Emissions Calculation

For each electricity record:
```typescript
totalEmissions = (kWh × emissionFactorLifecycle) / 1000  // Convert to kgCO2e
scope2Emissions = (kWh × emissionFactorScope2) / 1000
scope3Emissions = (kWh × emissionFactorScope3) / 1000
```

### Dashboard Display

The Energy Dashboard shows:
1. **Energy Mix Card**: Renewable percentage, source breakdown
2. **Scope Badges**: GHG Scope 2, Scope 3.3, TCFD compliance
3. **Emission Factors**: Real-time factors split by scope
   - Scope 2 (Direct): 105 gCO2/kWh
   - Scope 3.3 (Upstream): 19 gCO2/kWh
   - Total (Lifecycle): 124 gCO2/kWh

### Data Storage

Emission factors are stored in `metrics_data.metadata.grid_mix`:
```json
{
  "grid_mix": {
    "carbon_intensity_lifecycle": 124.00,
    "carbon_intensity_scope2": 105.40,
    "carbon_intensity_scope3_cat3": 18.60,
    "calculated_emissions_total_kgco2e": 4575.85,
    "calculated_emissions_scope2_kgco2e": 3889.47,
    "calculated_emissions_scope3_cat3_kgco2e": 686.38
  }
}
```

### Accuracy Benefits

Using Electricity Maps API provides:
- **Location-Specific**: Portugal has different factors than Germany
- **Time-Specific**: Factors change by year and month
- **Source-Specific**: Based on actual grid mix (renewables vs fossil)
- **GHG Compliant**: Follows GHG Protocol Scope 2 Guidance
- **TCFD Ready**: Supports climate-related financial disclosures

### Example: Portugal 2023

For Portugal in 2023 with 76% renewable mix:
- Lifecycle: 124 gCO2/kWh
- Scope 2: 105 gCO2/kWh (direct combustion)
- Scope 3.3: 19 gCO2/kWh (fuel extraction, transport)

This is significantly lower than the EU grid average (250-300 gCO2/kWh) due to high renewable penetration.
