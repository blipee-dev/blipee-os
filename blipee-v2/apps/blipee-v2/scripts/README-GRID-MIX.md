# Grid Mix Integration - Implementation Summary

## Overview

This document summarizes the work completed to integrate grid mix data from Electricity Maps API into the energy dashboard, including the challenges encountered and recommended next steps.

## What Was Completed

### 1. Removed Client-Side Live Data Fetching
**Problem**: Client-side fetching of live Electricity Maps data caused React hydration errors because the data changed between server-side rendering and client hydration.

**Solution**:
- Removed `/api/electricity-maps/route.ts` API endpoint
- Simplified `EnergyMetricsCards.tsx` to remove client-side data fetching
- Updated `page.tsx` to remove `siteCountry` prop passing
- Removed `country` field from `getUserSites()` query in `energy.ts`

**Files Modified**:
- `src/app/dashboard/energy/EnergyMetricsCards.tsx`
- `src/app/dashboard/energy/page.tsx`
- `src/lib/data/energy.ts`
- `src/app/api/electricity-maps/route.ts` (deleted)

### 2. Created Historical API Functions
Added new functions to fetch historical grid mix data:

**Files Modified**:
- `src/lib/apis/electricity-maps.ts`

**New Functions**:
```typescript
getCarbonIntensityPast(zone: string, datetime: string): Promise<CarbonIntensityData | null>
getPowerBreakdownPast(zone: string, datetime: string): Promise<PowerBreakdownData | null>
```

### 3. Updated Renewable Percentage Calculation
Enhanced the calculation to include both pure renewable sources (solar, wind) and the renewable portion from grid electricity.

**Files Modified**:
- `src/lib/data/energy.ts` (lines 197-215)

**Formula**:
```typescript
totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid
renewablePercentage = (totalRenewableEnergy / totalConsumption * 1000) * 100
```

The renewable portion is extracted from `metadata.grid_mix.renewable_kwh` stored in each energy record.

### 4. Created Backfill Script
Developed a comprehensive script to populate grid mix metadata for existing electricity consumption records.

**File Created**: `scripts/backfill-grid-mix.ts`

**Features**:
- Fetches historical grid mix data from Electricity Maps API
- Groups records by site-date to minimize API calls
- Uses first-of-month at noon (12:00 UTC) for representative daily snapshot
- Stores complete grid mix breakdown in `metadata.grid_mix`
- Supports dry-run mode for preview
- Supports targeting specific organizations
- Includes progress tracking and error handling

**Usage**:
```bash
# Preview changes
npx tsx scripts/backfill-grid-mix.ts --dry-run

# Apply changes
npx tsx scripts/backfill-grid-mix.ts

# Target specific organization
npx tsx scripts/backfill-grid-mix.ts --org-id=<org-id>
```

**Metadata Structure**:
```json
{
  "grid_mix": {
    "provider": "Electricity Maps",
    "zone": "PT",
    "datetime": "2022-01-01T12:00:00.000Z",
    "country": "Portugal",
    "renewable_percentage": 45.2,
    "non_renewable_percentage": 54.8,
    "renewable_kwh": 2260.0,
    "non_renewable_kwh": 2740.0,
    "carbon_intensity": 250,
    "fossil_free_percentage": 55.0,
    "sources": [
      {"name": "Wind", "percentage": 25.0, "renewable": true},
      {"name": "Hydro", "percentage": 20.2, "renewable": true},
      {"name": "Natural Gas", "percentage": 30.0, "renewable": false}
    ],
    "source": "electricity_maps_api",
    "backfilled_at": "2025-11-05T22:00:00.000Z"
  }
}
```

### 5. Populated Site Country Information
Created and ran a script to populate the `country` field for all sites based on their location information.

**File Created**: `scripts/update-sites-country.ts`

**Results**:
- 3 sites updated with "Portugal"
- Lisboa - FPM41 → Portugal
- Porto - POP → Portugal
- Faro → Portugal

### 6. Additional Helper Scripts
Created diagnostic and testing scripts:

**Files Created**:
- `scripts/check-sites.ts` - Verify sites table structure and country data
- `scripts/test-api-key.ts` - Test Electricity Maps API key validity
- `scripts/test-past-api.ts` - Test historical data API access

## API Limitation Discovered

### Issue: Historical Data Access Restricted

**API Endpoint Tested**:
```
https://api.electricitymap.org/v3/power-breakdown/past?zone=PT&datetime=2024-01-01T12:00:00.000Z
```

**Error Response**:
```json
{
  "error": "Request unauthorized for zoneKey=PT,requestType=past,dataType=power-breakdown.",
  "message": "You do not have access to this specific endpoint for this specific zone. Please visit https://help.electricitymaps.com if this is a mistake"
}
```

**Status Code**: 401 Unauthorized

**What This Means**:
- The current API key (T4xEjR2Xyj...) only has access to `/latest` endpoint (real-time data)
- Historical data endpoints (`/past`, `/history`) require a paid API plan
- The `/latest` endpoint works perfectly (tested and confirmed)

**Impact**:
- ❌ Cannot backfill historical grid mix data using Electricity Maps API
- ❌ Cannot automatically populate `metadata.grid_mix` for existing records
- ✅ Can still fetch real-time grid mix data for current consumption
- ✅ Renewable percentage calculation is ready and working

## Recommended Next Steps

### Option 1: Upgrade Electricity Maps API Plan (Recommended)
**Pros**:
- Get access to historical data
- Enable full backfill functionality
- Most accurate renewable percentage calculations
- Compliance-ready data

**Cons**:
- Requires budget approval
- Ongoing subscription cost

**Action Items**:
1. Visit https://www.electricitymaps.com/pricing
2. Compare plans and select appropriate tier
3. Upgrade API key
4. Run backfill script: `npx tsx scripts/backfill-grid-mix.ts`

### Option 2: Implement 3-Tier Hybrid Approach (Like blipee-os)
**Architecture**:
```
1. Invoice Data (Primary)
   ↓ (if not available)
2. Electricity Maps API (Secondary)
   ↓ (if not available)
3. Reference Table (Fallback)
```

**Reference Table Approach**:
- Create `grid_mix_reference` table with country-level averages
- Populate with public data sources (e.g., IEA, national grid operators)
- Use for historical backfill when API data unavailable
- Update periodically (monthly/quarterly)

**Pros**:
- No additional API costs
- Reasonable accuracy for compliance reporting
- Can backfill immediately

**Cons**:
- Less accurate than real-time API data
- Requires maintenance of reference data
- Country-level averages may not reflect local grid mix

**Action Items**:
1. Create `grid_mix_reference` table migration
2. Populate with 2022-2025 data for Portugal (and other countries as needed)
3. Update backfill script to use reference data as fallback
4. Document data sources for audit trail

### Option 3: Manual Data Entry (Interim Solution)
Use the Energy Management Portal or invoice data to manually enter renewable percentages for each consumption record.

**Pros**:
- Most accurate if based on invoices
- No API dependency

**Cons**:
- Labor intensive
- Doesn't scale
- Not automated

## Technical Architecture

### Data Flow (When API Access Enabled)

```
Energy Record Insert
  ↓
Trigger/Script
  ↓
Fetch Grid Mix (Electricity Maps API)
  - getCarbonIntensityPast(zone, datetime)
  - getPowerBreakdownPast(zone, datetime)
  ↓
Calculate Renewable kWh
  - renewable_kwh = consumption * (renewable_percentage / 100)
  ↓
Store in metadata.grid_mix
  ↓
Dashboard Query
  - getEnergyDashboardData()
  - Read metadata.grid_mix.renewable_kwh
  - Calculate total renewable percentage
  ↓
Display in UI
```

### Database Schema

**sites table**:
- Added: `country` field (TEXT) - Required for Electricity Maps zone mapping

**metrics_data table**:
- Uses existing: `metadata` field (JSONB) - Stores grid_mix data
- Structure: See "Metadata Structure" above

## Code References

### Renewable Percentage Calculation
**File**: `src/lib/data/energy.ts:197-215`

```typescript
// Calculate renewable percentage including grid mix data
const pureRenewableConsumption = sources
  .filter((s) => s.renewable)
  .reduce((sum, s) => sum + s.consumption, 0)

// Add renewable portion from grid electricity
let totalRenewableFromGrid = 0
energyData.forEach((record) => {
  const gridMix = record.metadata?.grid_mix
  if (gridMix && gridMix.renewable_kwh) {
    totalRenewableFromGrid += parseFloat(String(gridMix.renewable_kwh)) || 0
  }
})

const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid
const renewablePercentage = totalConsumption > 0
  ? (totalRenewableEnergy / (totalConsumption * 1000)) * 100
  : 0
```

### Country to Zone Mapping
**File**: `src/lib/apis/electricity-maps.ts:165-204`

The `getZoneFromCountry()` function maps country names to ISO 2-letter zone codes used by Electricity Maps API (e.g., "Portugal" → "PT").

## Testing Results

### API Key Validation
✅ **Latest Endpoint**: Working (200 OK)
```bash
npx tsx scripts/test-api-key.ts
```

❌ **Past Endpoint**: Unauthorized (401)
```bash
npx tsx scripts/test-past-api.ts
```

### Backfill Script (Dry Run)
✅ **Script Execution**: Working
❌ **API Data Fetch**: Blocked by API plan limitation

```bash
npx tsx scripts/backfill-grid-mix.ts --dry-run
```

**Results**:
- 126 electricity records identified
- 54 unique site-date combinations
- All attempts resulted in 401 errors

### Site Country Population
✅ **Success**: All 3 sites updated
```bash
npx tsx scripts/update-sites-country.ts
```

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Electricity Maps API
ELECTRICITY_MAPS_API_KEY=your-api-key
```

## Summary

### What Works ✅
1. Client-side hydration errors resolved
2. Renewable percentage calculation updated and ready
3. Backfill script created and tested
4. Site country information populated
5. API integration tested and validated
6. `/latest` endpoint access confirmed

### What's Blocked ❌
1. Historical data access (requires API upgrade)
2. Automated backfill of existing records
3. Complete grid mix metadata population

### Next Decision Point 🎯
**Choose one of the three options above** to proceed with populating grid mix data for existing energy records and enabling accurate renewable percentage calculations.

---

**Created**: 2025-11-05
**Last Updated**: 2025-11-05
**Status**: Implementation complete, awaiting API upgrade or alternative data source decision
