# Energy Dashboard Debug Guide

## What I Just Fixed

Added comprehensive logging to track data flow from API → Adapter → Component:

### 1. Force Fresh API Fetch
- Set `gcTime: 0` - no cache
- Set `refetchOnMount: 'always'` - always refetch
- You should now see `🚀 [CONSOLIDATED API] Fetching:` on every page load

### 2. Added Detailed Logging

**Server-side (Terminal):**
- `⚡ [ENERGY DATA] Sources breakdown:` - Shows which energy categories exist
- `🏢 [SITE COMPARISON] Sites query:` - Shows how many sites found
- `🏢 [SITE COMPARISON] Final result:` - Shows sites with consumption data

**Client-side (Browser Console):**
- `🚀 [CONSOLIDATED API] Fetching:` - API call starting
- `✅ [CONSOLIDATED API] Success:` - API call completed
- `📦 [CONSOLIDATED API] Raw data:` - Full API response (JSON)
- `📊 [ADAPTER] Transforming:` - What data is being transformed
- `🏢 [SITE COMPARISON] Sites data:` - Site comparison adapter output

---

## How to Debug Your Issues

### Issue 1: Site Comparison Empty

**Check Browser Console for:**
```
🏢 [SITE COMPARISON] Sites data: {
  hasSites: false,  // ← Should be true!
  siteCount: 0,     // ← Should be 3
  sites: []         // ← Should have site data
}
```

**Check Server Terminal for:**
```
🏢 [SITE COMPARISON] Sites query: {
  siteCount: 3,     // ← How many sites in DB
  hasSites: true
}

🏢 [SITE COMPARISON] Final result: {
  totalSites: 3,
  sitesWithData: 3, // ← Sites with consumption > 0
  sites: [...]      // ← Site details
}
```

**Possible Causes:**
1. **No sites in database** - `siteCount: 0`
2. **Only 1 site** - API returns empty if ≤1 site (comparison requires 2+)
3. **No consumption data** - `sitesWithData: 0` (sites exist but no energy data)
4. **Wrong period** - No data for selected time period

---

### Issue 2: Heating and Cooling Missing

**Check Server Terminal for:**
```
⚡ [ENERGY DATA] Sources breakdown: {
  totalRows: 150,
  sources: ['Electricity', 'Natural Gas'],  // ← Should include 'Heating', 'Cooling'
  values: {
    'Electricity': 500000,
    'Natural Gas': 200000,
    'Heating': 0,      // ← If 0, no data in DB
    'Cooling': 0       // ← If 0, no data in DB
  }
}
```

**Possible Causes:**
1. **No data in database** - Categories don't appear in sources array
2. **Zero consumption** - Categories appear but with 0 value
3. **Wrong category names** - Database uses different names (e.g., "HVAC" instead of "Heating")
4. **Wrong time period** - No heating/cooling data for selected period

---

### Issue 3: Forecast Not Displaying

**Check Browser Console for:**
```
📊 [ADAPTER] Transforming: {
  hasForecastData: true,        // ← Should be true
  forecastValue: 1234567,       // ← Should have a number
  ...
}
```

**Check the raw API response:**
```
📦 [CONSOLIDATED API] Raw data: {
  "success": true,
  "data": {
    "forecast": {
      "value": 1234567,
      "ytd": 800000,
      "projected": 434567,
      "method": "ml_forecast"
    }
  }
}
```

**Possible Causes:**
1. **Component doesn't support yearProjection** - Expects monthly array
2. **Forecast null** - No forecast calculated (might be for non-current year)
3. **Component conditional rendering** - Checks for `forecast.data.forecast[0]` which is empty

---

## Next Steps

### Step 1: Refresh the Energy Dashboard

Visit: `http://localhost:3000/sustainability/energy`

### Step 2: Check Both Consoles

**Browser Console (Chrome DevTools):**
- Look for all emoji logs: 🚀 ✅ 📦 📊 🏢
- Copy the `📦 [CONSOLIDATED API] Raw data:` output

**Server Terminal:**
- Look for: ⚡ and 🏢 logs
- Check what sources are returned
- Check how many sites have data

### Step 3: Report Back

Share:
1. The `📦 Raw data` JSON from browser console
2. The `⚡ Sources breakdown` from server terminal
3. The `🏢 Final result` from server terminal

This will tell us exactly:
- What data exists in the database
- What the API is returning
- What the adapter is transforming
- Where the disconnect is

---

## Quick Fixes

### If Heating/Cooling Missing:
Check database for those categories:
```sql
SELECT DISTINCT category
FROM metrics_catalog
WHERE category LIKE '%eat%' OR category LIKE '%ool%';
```

### If Sites Empty:
Check if you have multiple sites:
```sql
SELECT COUNT(*) FROM sites WHERE organization_id = 'your-org-id';
```

### If Forecast Not Showing:
Check component expects `forecast.data.forecast` array vs `forecast.data.yearProjection` object.

---

**Last Updated:** 2025-01-29
**Status:** Debugging in progress with comprehensive logging
