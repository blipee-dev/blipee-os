# Pagination Audit Report

## Summary
Investigation of queries to `metrics_data` table that may be limited to Supabase's default 1000-record limit.

## Findings

### ⚠️ Files WITHOUT Pagination (High Priority)

#### 1. `/src/app/api/sustainability/dashboard/route.ts`
**Status**: ❌ **CRITICAL - No pagination**

**Queries**:
- Line 178-195: Main metrics data query
- Line 852-858: Previous year data for YoY comparison

**Impact**:
- Dashboard will show incorrect data when organization has >1000 records
- Year-over-year comparisons will be inaccurate
- Monthly trends will be incomplete

**Recommendation**: Add pagination using the same pattern as `baseline-calculator`

---

### ✅ Files WITH Pagination

#### 1. `/src/lib/sustainability/baseline-calculator.ts`
**Status**: ✅ Implements pagination correctly
- Uses `fetchAllMetricsData()` helper with `.range()` pagination
- Fetches in batches of 1000 until all data retrieved

#### 2. `/src/app/api/waste/forecast/route.ts`
**Status**: ✅ Has pagination (line 58-86)

#### 3. `/src/app/api/water/forecast/route.ts`
**Status**: ✅ Has pagination (line 58-86)

#### 4. `/src/app/api/energy/forecast/route.ts`
**Status**: ✅ Has pagination

#### 5. `/src/app/api/sustainability/scope-analysis/route.ts`
**Status**: ✅ Uses `baseline-calculator` functions (which have pagination)
- Line 95-118: Query for additional context only, not for calculations

---

## Recommended Pattern

The `baseline-calculator.ts` implements the correct pattern:

```typescript
async function fetchAllMetricsData(
  organizationId: string,
  selectFields: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  let allData: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabaseAdmin
      .from('metrics_data')
      .select(selectFields)
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      query = query.lte('period_end', endDate);
    }

    const { data: batchData, error } = await query;

    if (error || !batchData || batchData.length === 0) {
      hasMore = false;
      break;
    }

    allData = allData.concat(batchData);

    if (batchData.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  return allData;
}
```

## Next Steps

1. **Urgent**: Fix `/src/app/api/sustainability/dashboard/route.ts` to use pagination
2. **Audit**: Review other API routes not checked in this audit
3. **Testing**: Test with organization having >1000 records to verify fixes
4. **Documentation**: Add comment reminders about pagination in critical routes

## Test Case

Organization `22647141-2ee4-4d8d-8b47-16b0cbd830b2` has:
- **2023 data**: 1,091 records (429.30 tCO2e)
- **Without pagination**: Would only fetch 1,000 records (413.36 tCO2e)
- **Discrepancy**: 15.94 tCO2e (3.7% error)

This demonstrates the critical need for pagination in production systems.
