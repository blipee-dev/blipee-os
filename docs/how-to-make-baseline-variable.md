# How to Make Baseline Year Variable

## Current State (Fixed 2023)

Energy, Water, and Waste dashboards have **hardcoded 2023** as the baseline year:

```typescript
// Current implementation (FIXED)
const baseline2023Params = new URLSearchParams({
  start_date: '2023-01-01',
  end_date: '2023-12-31',
});
```

## Proposed Change (Variable Baseline)

Make the baseline year configurable per organization, like Emissions Dashboard.

---

## Step 1: Add Baseline Configuration to Database

### **Option A: Add to `sustainability_targets` table**

```sql
-- Add baseline_year column if it doesn't exist
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS baseline_year INTEGER DEFAULT 2023;

-- Set baseline year for your organization
UPDATE sustainability_targets
SET baseline_year = 2023  -- Or whichever year you want
WHERE organization_id = 'YOUR_ORG_ID';
```

### **Option B: Create separate `organization_settings` table**

```sql
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  baseline_year INTEGER NOT NULL DEFAULT 2023,
  target_year INTEGER NOT NULL DEFAULT 2025,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Insert baseline for your organization
INSERT INTO organization_settings (organization_id, baseline_year, target_year)
VALUES ('YOUR_ORG_ID', 2023, 2025)
ON CONFLICT (organization_id) DO UPDATE
SET baseline_year = 2023, target_year = 2025;
```

---

## Step 2: Create API Endpoint to Fetch Baseline Year

### **File:** `/src/app/api/organizations/baseline-year/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch baseline year from organization_settings or sustainability_targets
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .select('baseline_year, target_year')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching baseline year:', error);
      // Fallback to default
      return NextResponse.json({
        success: true,
        baselineYear: 2023,
        targetYear: 2025,
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      baselineYear: settings.baseline_year || 2023,
      targetYear: settings.target_year || 2025,
      isDefault: false
    });

  } catch (error: any) {
    console.error('Error in baseline-year API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Update Dashboard Hooks

### **File:** `/src/hooks/useDashboardData.ts`

#### **A. Add Baseline Year Query:**

```typescript
// Fetch baseline year configuration
const baselineConfig = useQuery({
  queryKey: ['baselineConfig', organizationId],
  queryFn: async () => {
    if (!organizationId) return { baselineYear: 2023, targetYear: 2025, isDefault: true };

    const response = await fetch(`/api/organizations/baseline-year?organizationId=${organizationId}`);
    if (!response.ok) return { baselineYear: 2023, targetYear: 2025, isDefault: true };

    const data = await response.json();
    return data;
  },
  enabled: !!organizationId,
  staleTime: 30 * 60 * 1000, // 30 minutes (baseline rarely changes)
});
```

#### **B. Update Energy Dashboard Hook:**

```typescript
// BEFORE (Fixed):
const baseline2023Params = new URLSearchParams({
  start_date: '2023-01-01',
  end_date: '2023-12-31',
});

// AFTER (Variable):
const baselineYear = baselineConfig.data?.baselineYear || 2023;
const baselineParams = new URLSearchParams({
  start_date: `${baselineYear}-01-01`,
  end_date: `${baselineYear}-12-31`,
});
```

#### **C. Update Query Key:**

```typescript
// BEFORE:
const baseline2023 = useQuery({
  queryKey: [...dashboardKeys.energy(period, selectedSite?.id), 'baseline2023'],
  // ...
});

// AFTER:
const baseline = useQuery({
  queryKey: [...dashboardKeys.energy(period, selectedSite?.id), 'baseline', baselineYear],
  // ...
});
```

#### **D. Update Target Calculation:**

```typescript
// BEFORE:
const yearsToTarget = targetYear - 2023;

// AFTER:
const baselineYear = baselineConfig.data?.baselineYear || 2023;
const targetYear = baselineConfig.data?.targetYear || 2025;
const yearsToTarget = targetYear - baselineYear;
```

---

## Step 4: Update API Routes

### **File:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts`

```typescript
// BEFORE (line 38-39):
const baselineYear = parseInt(searchParams.get('baselineYear') || '2023');
const targetYear = parseInt(searchParams.get('targetYear') || '2025');

// No change needed - already accepts baselineYear as parameter!
// Just need to pass it from the frontend
```

---

## Step 5: Update Dashboard Components

### **File:** `/src/components/dashboard/EnergyDashboard.tsx`

#### **Display Baseline Year:**

```typescript
// Add to the Target Card
<div className="text-sm text-gray-600 dark:text-gray-400">
  Baseline {baselineConfig.data?.baselineYear || 2023}: {baseline2023.data?.total_emissions_tco2e} tCO2e
</div>
<div className="text-sm text-gray-600 dark:text-gray-400">
  Target {baselineConfig.data?.targetYear || 2025}: {target.target_emissions} tCO2e
</div>
```

#### **Update Metric Targets Fetch:**

```typescript
// BEFORE:
const url = `/api/sustainability/targets/by-category-dynamic?organizationId=${organizationId}&categories=${energyCategories}&baselineYear=2023&targetYear=2025`;

// AFTER:
const baselineYear = baselineConfig.data?.baselineYear || 2023;
const targetYear = baselineConfig.data?.targetYear || 2025;
const url = `/api/sustainability/targets/by-category-dynamic?organizationId=${organizationId}&categories=${energyCategories}&baselineYear=${baselineYear}&targetYear=${targetYear}`;
```

---

## Step 6: Add Settings UI (Optional)

### **File:** `/src/components/settings/BaselineSettings.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function BaselineSettings({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [baselineYear, setBaselineYear] = useState(2023);
  const [targetYear, setTargetYear] = useState(2025);

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['baselineConfig', organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/baseline-year?organizationId=${organizationId}`);
      return res.json();
    },
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/organizations/baseline-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, baselineYear, targetYear }),
      });
      if (!res.ok) throw new Error('Failed to update baseline settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselineConfig'] });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Baseline Configuration</h3>

      <div>
        <label className="block text-sm font-medium mb-1">
          Baseline Year
        </label>
        <input
          type="number"
          min="2019"
          max={new Date().getFullYear()}
          value={baselineYear}
          onChange={(e) => setBaselineYear(parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Target Year
        </label>
        <input
          type="number"
          min={baselineYear + 1}
          max={baselineYear + 20}
          value={targetYear}
          onChange={(e) => setTargetYear(parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        onClick={() => updateSettings.mutate()}
        disabled={updateSettings.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
      </button>

      {settings?.isDefault && (
        <p className="text-sm text-yellow-600">
          Using default baseline (2023). Configure above to customize.
        </p>
      )}
    </div>
  );
}
```

---

## Step 7: Testing

```bash
# 1. Update baseline year in database
psql -h YOUR_DB_HOST -U YOUR_USER -d YOUR_DB -c "
  UPDATE organization_settings
  SET baseline_year = 2022, target_year = 2026
  WHERE organization_id = 'YOUR_ORG_ID';
"

# 2. Restart dev server
npm run dev

# 3. Check API response
curl "http://localhost:3001/api/organizations/baseline-year?organizationId=YOUR_ORG_ID"

# Expected:
{
  "success": true,
  "baselineYear": 2022,
  "targetYear": 2026,
  "isDefault": false
}

# 4. Check dashboard uses correct year
# Open Energy Dashboard → Check if baseline shows 2022 instead of 2023
```

---

## Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| **Database** | Add `baseline_year` column | Stores per-org configuration |
| **API** | New `/api/organizations/baseline-year` endpoint | Fetches baseline year |
| **Hooks** | Add `baselineConfig` query | Provides baseline year to components |
| **API Routes** | Already accepts `baselineYear` param | No change needed |
| **Components** | Use `baselineConfig.data.baselineYear` | Dynamic baseline display |

---

## Migration Path

### **Phase 1: Add Database Column (Safe)**
- Add `baseline_year` column with default 2023
- No code changes required
- Backward compatible

### **Phase 2: Add API Endpoint (Safe)**
- Create `/api/organizations/baseline-year` endpoint
- Returns default 2023 if no custom setting
- No breaking changes

### **Phase 3: Update Frontend (Safe)**
- Update hooks to fetch baseline year
- Use fetched value instead of hardcoded 2023
- Falls back to 2023 if API fails

### **Phase 4: Add Settings UI (Optional)**
- Add UI to configure baseline year
- Only for super admins
- Nice-to-have feature

---

## Rollback Plan

If something goes wrong:

```typescript
// Revert to hardcoded 2023:
const baselineYear = 2023;  // Comment out: baselineConfig.data?.baselineYear || 2023
```

Database changes are backward compatible (default 2023).
