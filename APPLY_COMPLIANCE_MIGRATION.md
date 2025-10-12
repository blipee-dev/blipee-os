# Apply Compliance Data Migration

## Overview
This migration populates compliance tables with **100% REAL DATA** from your `metrics_data` table.
**NO MOCKED OR HARDCODED DATA** - everything is calculated from actual emissions data.

## What Will Be Created

### 1. ghg_inventory_settings (4 records for years 2022-2025)
- **Base year:** 2022 (first year with 1,084+ data points)
- **Consolidation approach:** Operational Control
- **GWP standard:** IPCC AR6
- **Scope 3 categories:** Only categories 5 & 6 (Waste, Business Travel - the ones you track)
- **Emissions:** Calculated from metrics_data

### 2. esrs_e1_disclosures (4 records for years 2022-2025)
- **E1-6 (Emissions):** Calculated from metrics_data
  - 2022: 417,164 tCO2e (S1: 0, S2: 308,654, S3: 108,510)
  - 2023: 413,361 tCO2e (S1: 0, S2: 287,697, S3: 125,664)
  - 2024: 517,229 tCO2e (S1: 0, S2: 238,649, S3: 278,580)
  - 2025: 399,057 tCO2e (S1: 0, S2: 220,087, S3: 178,971)
- **E1-5 (Energy):** Calculated from electricity metrics
- **Strategic fields (E1-1 to E1-4, E1-7 to E1-9):** NULL (ready for your input)

### 3. tcfd_disclosures (4 records for years 2022-2025)
- **Metrics:** Populated with actual emissions by scope
- **Governance, Strategy, Risk Management:** NULL (ready for your input)

## How to Apply

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of: `supabase/migrations/20251013_populate_compliance_data.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success in the output panel

### Option 2: Via Local Supabase CLI (if installed)
```bash
supabase db push
```

### Option 3: Via Direct psql Connection (if you have psql)
```bash
psql "postgresql://postgres.yrbmmymayojycyszunis:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20251013_populate_compliance_data.sql
```

## Verification

After applying, run this verification script:
```bash
node apply-compliance-migrations.js
```

You should see:
- ✅ ghg_inventory_settings: 4 records
- ✅ esrs_e1_disclosures: 4 records
- ✅ tcfd_disclosures: 4 records

## Next Steps After Migration

1. **Review the Compliance Dashboard**
   - Navigate to: http://localhost:3000/sustainability/dashboard
   - Click the **Compliance** tab
   - All tabs should now show real data

2. **Complete Strategic Disclosures** (optional)
   - ESRS E1: Transition plans, policies, targets
   - TCFD: Governance, strategy, risk management
   - These can be added through the UI or directly in the database

3. **Set Assurance Level** (when ready)
   - Update `assurance_level` in `ghg_inventory_settings`
   - Add `assurance_provider` when third-party verification is obtained

## Data Quality Notes

✅ **What's populated (REAL DATA):**
- Actual emissions by scope and year
- Data points per year (1,084-1,275 points)
- Scope 3 categories actually tracked (5 & 6)
- Energy consumption from electricity metrics
- Base year calculations

⏳ **What's NULL (ready for your input):**
- Transition plans and climate policies (ESRS E1-1, E1-2)
- Mitigation and adaptation actions (ESRS E1-3)
- Climate targets (ESRS E1-4)
- Carbon removals and offsets (ESRS E1-7)
- Carbon pricing (ESRS E1-8)
- Financial effects (ESRS E1-9)
- TCFD governance and strategy
- Assurance details (until verified)

## Scope 1 = 0 Explanation

Scope 1 is correctly 0 for PLMJ because:
- ✅ Office-based services (law firm)
- ✅ No company-owned vehicles tracked
- ✅ No on-site fuel combustion
- ✅ No generators or boilers
- ✅ Primary emissions are Scope 2 (electricity) and Scope 3 (business travel, waste)

This is typical for professional services firms.
