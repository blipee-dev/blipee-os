# Real-Time Grid Mix Solution (Using /latest Endpoint)

## Summary

Based on the Electricity Maps API documentation analysis, **Portugal has full data availability** including Carbon Intensity, Renewable Percentage, and Day-ahead Prices. However, your current API key only has access to `/latest` (real-time) endpoints, not `/past` (historical) endpoints.

**Solution**: Capture real-time data hourly and build your own historical database over time.

## What's Available for Portugal 🇵🇹

According to the official API documentation:

- ✅ **Carbon Intensity** - Available (gCO₂e/kWh)
- ✅ **Renewable Energy Percentage** - Available
- ✅ **Carbon-free Energy Percentage** - Available (fossil-free)
- ✅ **Day-ahead Price** - YES! Portugal has day-ahead price data
- ✅ **Power Breakdown** - Full electricity mix by source
- ✅ **Tier A Quality** - Measured hourly data from original source
- ✅ **Up to 10 years** - Historical data available (with upgraded plan)

**Your API Key**: Works perfectly for `/latest` endpoints (real-time data)

## Implementation Strategy

Instead of fetching historical data (requires paid plan), we'll **capture current data hourly** using a cron job:

```
Hour 1: Capture PT grid mix → Store in database
Hour 2: Capture PT grid mix → Store in database
...
Result: Build historical database over time using free /latest endpoint
```

## Setup Instructions

### Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20250105_create_grid_mix_snapshots.sql

CREATE TABLE IF NOT EXISTS grid_mix_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  carbon_intensity NUMERIC NOT NULL, -- gCO2e/kWh
  renewable_percentage NUMERIC NOT NULL, -- 0-100
  fossil_free_percentage NUMERIC NOT NULL, -- 0-100
  price_day_ahead NUMERIC, -- EUR/MWh (optional)
  power_breakdown JSONB NOT NULL, -- Full power consumption breakdown
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (zone, datetime)
);

CREATE INDEX idx_grid_mix_snapshots_zone_datetime
  ON grid_mix_snapshots(zone, datetime DESC);

CREATE INDEX idx_grid_mix_snapshots_datetime
  ON grid_mix_snapshots(datetime DESC);

ALTER TABLE grid_mix_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read grid mix snapshots"
  ON grid_mix_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only service role can insert grid mix snapshots"
  ON grid_mix_snapshots FOR INSERT TO service_role WITH CHECK (true);
```

### Step 2: Test the Capture Script

```bash
# Dry run to test (won't store data)
npx tsx scripts/capture-live-grid-mix.ts --dry-run

# Run for real to capture current data
npx tsx scripts/capture-live-grid-mix.ts
```

Expected output:
```
📡 Capturing current grid mix data...

Mode: ✍️  WRITE MODE
Time: 2025-11-05T22:00:00.000Z

📍 Countries to capture: Portugal

🔍 Portugal (PT)...
   📊 Carbon Intensity: 112 gCO₂/kWh
   🌱 Renewable: 45.2%
   ⚡ Fossil-free: 55.0%
   💰 Price: €65.50/MWh
   🕐 Datetime: 2025-11-05T22:00:00.000Z
   ✅ Stored successfully

====================================
📊 Capture Summary
====================================
Countries processed: 1
✅ Successful: 1
❌ Errors: 0
====================================
```

### Step 3: Set Up Cron Job (Automated Hourly Capture)

#### Option A: Using Vercel Cron Jobs (Recommended)

Create `app/api/cron/capture-grid-mix/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Run capture logic
  // (copy logic from scripts/capture-live-grid-mix.ts)

  return NextResponse.json({ success: true })
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/capture-grid-mix",
    "schedule": "0 * * * *"
  }]
}
```

#### Option B: Using System Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /path/to/your/app && npx tsx scripts/capture-live-grid-mix.ts >> /var/log/grid-mix-capture.log 2>&1
```

#### Option C: GitHub Actions (Runs on GitHub)

Create `.github/workflows/capture-grid-mix.yml`:

```yaml
name: Capture Grid Mix Data
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/capture-live-grid-mix.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          ELECTRICITY_MAPS_API_KEY: ${{ secrets.ELECTRICITY_MAPS_API_KEY }}
```

### Step 4: Query the Data

Create a helper function to get grid mix for a specific date/time:

```typescript
// src/lib/data/grid-mix.ts

export async function getGridMixForDateTime(
  zone: string,
  datetime: Date
): Promise<GridMixSnapshot | null> {
  const supabase = await createClient()

  // Find closest snapshot (within 1 hour)
  const { data } = await supabase
    .from('grid_mix_snapshots')
    .select('*')
    .eq('zone', zone)
    .gte('datetime', new Date(datetime.getTime() - 3600000).toISOString())
    .lte('datetime', new Date(datetime.getTime() + 3600000).toISOString())
    .order('datetime', { ascending: false })
    .limit(1)
    .single()

  return data
}

// Get average for a date range
export async function getAverageGridMix(
  zone: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('grid_mix_snapshots')
    .select('carbon_intensity, renewable_percentage, price_day_ahead')
    .eq('zone', zone)
    .gte('datetime', startDate.toISOString())
    .lte('datetime', endDate.toISOString())

  if (!data || data.length === 0) return null

  return {
    avg_carbon_intensity: data.reduce((sum, d) => sum + d.carbon_intensity, 0) / data.length,
    avg_renewable_percentage: data.reduce((sum, d) => sum + d.renewable_percentage, 0) / data.length,
    avg_price: data
      .filter(d => d.price_day_ahead)
      .reduce((sum, d) => sum + (d.price_day_ahead || 0), 0) / data.filter(d => d.price_day_ahead).length,
    sample_count: data.length,
  }
}
```

## Data You'll Capture

Each hourly snapshot includes:

```json
{
  "zone": "PT",
  "datetime": "2025-11-05T22:00:00.000Z",
  "carbon_intensity": 112,  // gCO₂e/kWh
  "renewable_percentage": 45.2,  // %
  "fossil_free_percentage": 55.0,  // %
  "price_day_ahead": 65.50,  // EUR/MWh
  "power_breakdown": {
    "nuclear": 0,
    "geothermal": 120,
    "biomass": 450,
    "coal": 0,
    "wind": 1250,
    "solar": 300,
    "hydro": 890,
    "gas": 1340,
    "oil": 0,
    "unknown": 0,
    "hydro discharge": 0,
    "battery discharge": 0
  },
  "captured_at": "2025-11-05T22:05:12.000Z"
}
```

## Usage Examples

### 1. Populate Energy Record Metadata (Backfill Historical Records)

Since you have energy consumption records from 2022-2025, you can retroactively populate them by:

**Option A**: Accept that historical data before "now" won't have grid mix (wait for data to accumulate)

**Option B**: Request historical data access from Electricity Maps (paid upgrade)

**Option C**: Use reference data table with country averages (see README-GRID-MIX.md Option 2)

### 2. For New Energy Records (Going Forward)

When inserting new energy consumption records, look up the grid mix:

```typescript
// When user enters consumption for a specific date/time
const consumption = 5000 // kWh
const consumptionDate = new Date('2025-11-05T14:00:00Z')

// Look up grid mix for that time
const gridMix = await getGridMixForDateTime('PT', consumptionDate)

if (gridMix) {
  const renewableKwh = consumption * (gridMix.renewable_percentage / 100)
  const carbonEmissions = consumption * (gridMix.carbon_intensity / 1000) // Convert to tCO2e
  const cost = consumption * (gridMix.price_day_ahead / 1000) // Convert MWh to kWh

  // Store in metrics_data
  await supabase.from('metrics_data').insert({
    ...energyRecord,
    metadata: {
      grid_mix: {
        provider: 'Electricity Maps',
        zone: 'PT',
        datetime: gridMix.datetime,
        country: 'Portugal',
        renewable_percentage: gridMix.renewable_percentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: consumption - renewableKwh,
        carbon_intensity: gridMix.carbon_intensity,
        estimated_cost: cost,
        price_per_mwh: gridMix.price_day_ahead,
        source: 'grid_mix_snapshots'
      }
    }
  })
}
```

### 3. Display Real-Time Grid Status

Show users current grid conditions:

```typescript
// Get latest snapshot
const { data: latest } = await supabase
  .from('grid_mix_snapshots')
  .select('*')
  .eq('zone', 'PT')
  .order('datetime', { ascending: false })
  .limit(1)
  .single()

// Show in UI
<div className="grid-status">
  <div>Carbon Intensity: {latest.carbon_intensity} gCO₂/kWh</div>
  <div>Renewable: {latest.renewable_percentage}%</div>
  <div>Price: €{latest.price_day_ahead}/MWh</div>
  <div className={latest.carbon_intensity < 150 ? 'good' : 'bad'}>
    Grid Status: {latest.carbon_intensity < 150 ? 'Clean' : 'Dirty'}
  </div>
</div>
```

## Benefits of This Approach

### ✅ Advantages

1. **No Additional API Costs** - Uses free `/latest` endpoint
2. **All Data You Need** - Carbon intensity, renewable %, and price
3. **High Quality** - Tier A data for Portugal
4. **Builds Over Time** - Accumulates historical database automatically
5. **Future-Proof** - Once you have 2-3 years of data, you're set
6. **Accurate Pricing** - Day-ahead prices included
7. **Full Breakdown** - See which sources contribute to grid mix

### ⚠️ Limitations

1. **No Historical Backfill** - Can't populate data before "today"
2. **Requires Patience** - Need to wait to build historical database
3. **Cron Dependency** - Must keep cron job running reliably
4. **Storage Cost** - ~720 records/month/country (negligible cost)

### 🔄 Workarounds for Historical Data

For your existing 2022-2023 records, you have 3 options:

**1. Upgrade API Plan** (Recommended if budget allows)
- Get immediate access to historical data
- Run `backfill-grid-mix.ts` script to populate all records
- Cost: Check Electricity Maps pricing

**2. Use Reference Table** (Good compromise)
- Create table with monthly averages for Portugal
- Source data from:
  - [REN (Portuguese TSO) statistics](https://datahub.ren.pt/)
  - [ENTSO-E Transparency Platform](https://transparency.entsoe.eu/)
  - [IEA Monthly Electricity Statistics](https://www.iea.org/data-and-statistics)
- Less accurate but acceptable for compliance

**3. Accept Gap** (Simplest)
- Leave pre-2025 data without grid mix
- Note in reports: "Grid mix data available from [start date]"
- Focus on going-forward accuracy

## Monitoring & Maintenance

### Check Capture Success Rate

```sql
SELECT
  DATE(datetime) as date,
  COUNT(*) as captures,
  COUNT(DISTINCT zone) as zones
FROM grid_mix_snapshots
WHERE datetime > NOW() - INTERVAL '7 days'
GROUP BY DATE(datetime)
ORDER BY date DESC;
```

### Verify Data Freshness

```sql
SELECT
  zone,
  MAX(datetime) as last_capture,
  NOW() - MAX(datetime) as age
FROM grid_mix_snapshots
GROUP BY zone;
```

Expected: `age` should be < 2 hours

### Alert on Missing Data

```sql
-- Find hours with missing captures
SELECT generate_series(
  NOW() - INTERVAL '24 hours',
  NOW(),
  INTERVAL '1 hour'
) AS expected_hour
WHERE expected_hour NOT IN (
  SELECT datetime
  FROM grid_mix_snapshots
  WHERE zone = 'PT'
);
```

## Cost Analysis

### Storage Cost (Supabase)
- Records per hour: 1 (per country)
- Records per day: 24
- Records per month: ~720
- Records per year: ~8,760
- Record size: ~500 bytes

**Total**: ~4.4 MB/year/country (negligible)

### API Cost (Electricity Maps)
- Requests per hour: 3 (carbon, power, price)
- Requests per day: 72
- Requests per month: ~2,160

**Your plan**: Check your API quota (likely sufficient for free tier)

## Next Steps

1. ✅ Apply database migration (Step 1 above)
2. ✅ Test capture script with `--dry-run`
3. ✅ Run first real capture
4. ✅ Verify data in database
5. ✅ Set up cron job (choose Option A, B, or C)
6. ✅ Monitor for 48 hours to ensure reliability
7. ⏳ Wait 1-2 weeks to build initial dataset
8. ✅ Start using data in renewable % calculations
9. ✅ Add data visualization to dashboard

## Support & Resources

- **Electricity Maps API Docs**: https://app.electricitymaps.com/developer-hub/api/getting-started
- **Portugal Data Quality**: Tier A (highest quality)
- **API Playground**: https://app.electricitymaps.com/developer-hub/playground
- **Zone Code**: PT (Portugal)
- **Script Location**: `scripts/capture-live-grid-mix.ts`
- **Migration Location**: `supabase/migrations/20250105_create_grid_mix_snapshots.sql`

---

**Created**: 2025-11-05
**Status**: Ready to implement
**Estimated Setup Time**: 30 minutes
**Data Available**: Carbon Intensity, Renewable %, Price, Full Mix
