# Water API Fix - Cost Column Error

## Issue
The Water Dashboard was failing to load due to a database error:
```
Error fetching water data: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column metrics_data.cost does not exist'
}
```

## Root Cause
The `/api/water/sources` endpoint (src/app/api/water/sources/route.ts:172) was attempting to select a `cost` column from the `metrics_data` table that doesn't exist in the current database schema.

## Solution
Removed the `cost` column from the query and cost calculation logic:

### Changes Made

**File**: `src/app/api/water/sources/route.ts`

1. **Line 172** - Removed `cost` from SELECT query:
   ```typescript
   // Before:
   .select('metric_id, value, cost, period_start, unit')

   // After:
   .select('metric_id, value, period_start, unit')
   ```

2. **Lines 297-298** - Removed cost accumulation logic:
   ```typescript
   // Before:
   // Add cost if available
   sourcesByType[sourceInfo.type].cost += parseFloat(record.cost) || 0;

   // After:
   // Cost tracking removed - cost column does not exist in metrics_data
   // Future: Add cost tracking when column is added to schema
   ```

3. **Note**: The response still includes `total_cost` (line 446) and individual source `cost` fields (line 283), but they will always be 0 until the schema is updated.

## Status
✅ **FIXED** - Water Dashboard API now works correctly without the cost column

## Future Enhancement
If cost tracking is needed in the future:
1. Add `cost` column to `metrics_data` table schema
2. Update migration scripts
3. Re-enable cost selection in the query (line 172)
4. Re-enable cost accumulation logic (line 298)

## Testing
- ✅ Server compiles successfully
- ✅ No database errors when fetching water data
- ✅ Water Dashboard loads correctly
- ✅ All water metrics display properly

## Impact
- Water Dashboard is now functional
- Cost tracking is disabled (shows $0) until schema is updated
- All other functionality (withdrawal, consumption, discharge, recycling) works correctly

---

**Fixed**: 2025-10-15
**Related Issue**: Water Dashboard migration testing
