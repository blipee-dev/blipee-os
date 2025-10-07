# Apply Energy Mix Migrations

## Instructions

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of each file below in order
3. Click "Run" for each one

## Step 1: Create energy_mix_metadata table

**File:** `supabase/migrations/20251007_energy_mix_metadata_all_types.sql`

This creates:
- `energy_mix_metadata` table for all energy types (electricity, district heating, cooling, steam)
- Stores detailed source breakdowns (Wind, Solar, Hydro, Gas, Coal, etc.)
- Migrates existing EDP data
- Adds EDP Portugal 2025 with full source breakdown

## Step 2: Update auto-add function

**File:** `supabase/migrations/20251007_update_auto_grid_mix_with_sources.sql`

This updates:
- `auto_add_grid_mix_metadata()` function to read from new table
- Supports all energy types (not just electricity)
- Adds `supplier_mix` metadata for district heating/cooling/steam
- Backward compatible with existing grid_mix

## What This Enables

After applying these migrations:

1. **Detailed Source Breakdown**: See Wind, Solar, Hydro, Gas, Coal percentages
2. **Multi-Type Support**: Electricity, district heating, cooling, steam all have mix data
3. **Automatic Metadata**: New energy records automatically get mix metadata
4. **Dynamic Dashboard**: Energy mix cards show detailed source breakdowns

## Verification

After running migrations, check:

```sql
-- Should show 4 rows (EDP 2022-2025)
SELECT * FROM energy_mix_metadata WHERE energy_type = 'electricity';

-- Should show detailed sources for 2025
SELECT energy_type, provider_name, year, sources
FROM energy_mix_metadata
WHERE year = 2025 AND energy_type = 'electricity';
```

## Current Status

✅ Frontend ready - `EnergyDashboard.tsx` supports multiple energy mix types
✅ API ready - `/api/energy/sources` returns `energy_mixes` array
⏳ Database - Migrations ready to apply (just need to run in SQL Editor)

## To Get Detailed Pie Chart in Frontend

Once migrations are applied, the API will return:

```json
{
  "energy_mixes": [
    {
      "energy_type": "electricity",
      "provider_name": "EDP",
      "year": 2025,
      "sources": [
        {"name": "Wind", "percentage": 25.5, "renewable": true},
        {"name": "Hydro", "percentage": 20.3, "renewable": true},
        {"name": "Solar", "percentage": 8.2, "renewable": true},
        {"name": "Biomass", "percentage": 2.99, "renewable": true},
        {"name": "Natural Gas", "percentage": 35.8, "renewable": false},
        {"name": "Coal", "percentage": 7.21, "renewable": false}
      ],
      "renewable_percentage": 56.99,
      "has_unknown_sources": false
    }
  ]
}
```

The dashboard will then show a **detailed pie chart** with all 6 energy sources instead of just "renewable vs non-renewable"!
