# Water Dashboard Piechart Fix

**Date:** 2025-10-31
**Status:** ✅ COMPLETE

---

## 🎯 Problem

The water sources piechart was not showing different colors for each source. All sources were displaying in the same color (gray) because the API was setting the `type` field incorrectly.

**User Request:** "o problema é que o pie chart deveria ter uma cor para cada source w ter as labels corretas"

---

## 🔍 Root Cause

The API was setting the source `type` field to the database `water_type` column value, which contains:
- `'withdrawal'` (for all withdrawal sources)
- `'discharge'` (for all discharge destinations)
- `'recycled'` (for recycled water)
- `'consumption'` (for consumption metrics)

But the piechart color mapping expects specific source types:
```typescript
const colors = {
  municipal: "#3b82f6",      // blue
  groundwater: "#06b6d4",     // cyan
  surface_water: "#0ea5e9",   // light blue
  rainwater: "#60a5fa",       // lighter blue
  recycled: "#10b981",        // green
  seawater: "#0284c7",        // darker blue
  wastewater: "#6b7280",      // gray
  other: "#94a3b8",           // light gray
};
```

Result: All sources had `type: 'withdrawal'` → mapped to `'other'` → gray color

---

## ✅ Solution

### **1. Added `extractSourceType()` Function**

**File:** `src/app/api/dashboard/water/route.ts` (line 218-272)

Extracts the actual source type from the metric code:

```typescript
function extractSourceType(code: string, waterType: string): string {
  const codeLower = code.toLowerCase();

  // Municipal water
  if (codeLower.includes('municipal')) return 'municipal';

  // Groundwater
  if (codeLower.includes('groundwater')) return 'groundwater';

  // Surface water (rivers, lakes)
  if (codeLower.includes('surface')) return 'surface_water';

  // Rainwater
  if (codeLower.includes('rainwater') || codeLower.includes('rain_water')) return 'rainwater';

  // Seawater (desalinated)
  if (codeLower.includes('seawater') || codeLower.includes('sea_water')) return 'seawater';

  // Recycled/grey water
  if (codeLower.includes('recycled') || codeLower.includes('grey_water') || codeLower.includes('gray_water')) return 'recycled';

  // Wastewater (discharge)
  if (codeLower.includes('discharge') || codeLower.includes('wastewater') || codeLower.includes('sewer')) return 'wastewater';

  // Default based on water_type
  if (waterType === 'recycled') return 'recycled';
  if (waterType === 'discharge') return 'wastewater';

  // Default to "other" for unknown sources
  return 'other';
}
```

**Example Transformations:**
- `gri_303_3_municipal_freshwater` → `'municipal'` → Blue (#3b82f6)
- `gri_303_3_groundwater_freshwater` → `'groundwater'` → Cyan (#06b6d4)
- `gri_303_3_surface_freshwater` → `'surface_water'` → Light Blue (#0ea5e9)
- `water_recycled_grey_water` → `'recycled'` → Green (#10b981)
- `gri_303_4_discharge_sewer` → `'wastewater'` → Gray (#6b7280)

### **2. Updated Source Type Assignment**

**File:** `src/app/api/dashboard/water/route.ts` (line 377-378)

Changed from:
```typescript
// ❌ OLD: Used water_type directly (all withdrawals = 'withdrawal')
const sourceType = waterType;
```

To:
```typescript
// ✅ NEW: Extract source type from metric code
const sourceType = extractSourceType(code, waterType);
```

### **3. Excluded Total Metrics from Sources Breakdown**

**File:** `src/app/api/dashboard/water/route.ts` (line 450-471)

Added filter to exclude `_total` metrics from the piechart:

```typescript
// ✅ EXCLUDE _total metrics from sources breakdown (they're for totals only)
// Only include specific sources (municipal, groundwater, surface, etc.)
const isTotal = code.includes('_total');
if (!isTotal) {
  // ... add to sourcesByType
}
```

**Why?** The `_total` metrics (like `gri_303_3_withdrawal_total`) are used for KPI totals, not for source breakdown. Including them caused double-counting in the piechart.

---

## 📊 Expected Results

### **For 2024 (Historical Data)**

**Data Available:**
- Municipal Water Supply: 589 m³
- Grey Water Recycled: 45.40 m³

**Piechart Display:**
- 🔵 **Municipal Water Supply** (blue) - 589 m³ (92.9%)
- 🟢 **Grey Water Recycled** (green) - 45.40 m³ (7.1%)

**Total Withdrawal KPI:** 589 m³

### **For 2025 (Forecast Data)**

**Data Available:**
- Total Water Withdrawal (forecast): 484.95 m³
- No source breakdown (only total forecasted)

**Piechart Display:**
- Empty or "No source breakdown available"

**Total Withdrawal KPI:** 484.95 m³

**Note:** For 2025, we only have total forecasts, not per-source forecasts. If source breakdown is needed, we would need to either:
1. Forecast each source separately using Prophet
2. Infer source breakdown based on historical ratios

---

## 🧪 Testing

### **1. Start Development Server**

```bash
npm run dev
```

### **2. Navigate to Water Dashboard**

URL: http://localhost:3000/sustainability/water

### **3. Check 2024 Piechart**

- Select period: 2024 (or YTD if current year is 2024)
- Verify piechart shows:
  - Blue segment for Municipal Water
  - Green segment for Recycled Water
  - Correct labels in legend
  - Correct values in tooltips

### **4. Check API Response**

```bash
curl "http://localhost:3000/api/dashboard/water?organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&start_date=2024-01-01&end_date=2024-12-31" | jq '.data.current.sources'
```

**Expected Output:**
```json
[
  {
    "name": "Municipal Water Supply",
    "type": "municipal",
    "withdrawal": 589.00,
    "discharge": 0,
    "cost": 0,
    "isRecycled": false
  },
  {
    "name": "Grey Water Recycled and Reused",
    "type": "recycled",
    "withdrawal": 45.40,
    "discharge": 0,
    "cost": 0,
    "isRecycled": true
  }
]
```

---

## 📁 Files Modified

1. **`src/app/api/dashboard/water/route.ts`**
   - Added `extractSourceType()` function (line 218-272)
   - Updated source type extraction (line 377-378)
   - Added filter to exclude _total metrics from sources (line 453-471)

---

## ✅ Completion Checklist

- [x] Added `extractSourceType()` helper function
- [x] Updated API to use extracted source type instead of water_type
- [x] Excluded `_total` metrics from sources breakdown
- [x] Verified TypeScript compilation (no errors)
- [x] Documented changes

**Status:** ✅ **READY TO TEST**

---

## 🔄 Next Steps (Optional Enhancement)

If source breakdown is desired for 2025 forecasts, consider:

1. **Option A: Per-Source Forecasting**
   - Modify `generate-water-forecasts-2025.js` to forecast each source separately
   - Generate forecasts for:
     - `gri_303_3_municipal_freshwater`
     - `water_recycled_grey_water`
     - Other sources if applicable

2. **Option B: Ratio-Based Inference**
   - Calculate historical source ratios (e.g., 92.9% municipal, 7.1% recycled)
   - Apply these ratios to total forecast to create source breakdown
   - Add this logic to the API when returning 2025 data

---

**Implementation by:** Claude Code
**Date:** 2025-10-31
**Status:** ✅ COMPLETE
