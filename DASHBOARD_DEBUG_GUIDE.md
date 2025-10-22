# Dashboard Data Loading - Debug Guide

## Overview

I've added comprehensive debug logging to all dashboard API endpoints. This guide will help you trace exactly what's happening when data doesn't show up on the dashboards.

## Debug Logging Added

The following API endpoints now have detailed logging with emoji prefixes:

- 🔍 `/api/organization/context` - Organization and user data
- ⚡ `/api/energy/sources` - Energy metrics and data
- 💧 `/api/water/sources` - Water metrics and data
- 🗑️ `/api/waste/streams` - Waste metrics and data

## How to Debug

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Open the Dashboard

Navigate to one of the dashboard pages:
- http://localhost:3000/sustainability/dashboard
- http://localhost:3000/sustainability/energy
- http://localhost:3000/sustainability/water
- http://localhost:3000/sustainability/waste
- http://localhost:3000/sustainability/compliance

### Step 3: Check the Terminal Output

Look for the debug logs in your terminal where `npm run dev` is running.

## What to Look For

### ✅ **SUCCESSFUL FLOW**

```bash
🔍 [ORG-CONTEXT] API called
🔍 [ORG-CONTEXT] User auth: ✅ e1c83a34-424d-4114-94c5-1a11942dcdea (jose.pinto@plmj.pt)
🔍 [ORG-CONTEXT] Fetching organization context for user: e1c83a34-424d-4114-94c5-1a11942dcdea
🔍 [ORG-CONTEXT] Context result: ✅ Org: PLMJ
🔍 [ORG-CONTEXT] Returning: { org: 'PLMJ', sites: 2, devices: 5, users: 4 }

⚡ [ENERGY-SOURCES] API called
⚡ [ENERGY-SOURCES] User auth: ✅ e1c83a34-424d-4114-94c5-1a11942dcdea
⚡ [ENERGY-SOURCES] Org info: 22647141-2ee4-4d8d-8b47-16b0cbd830b2
⚡ [ENERGY-SOURCES] Filters: {
  organizationId: '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  siteId: 'all sites'
}
⚡ [ENERGY-SOURCES] Metrics catalog: ✅ 10 metrics
⚡ [ENERGY-SOURCES] Querying metrics_data for 10 metric IDs
⚡ [ENERGY-SOURCES] Effective end date: 2025-10-22 (requested: 2025-12-31)
⚡ [ENERGY-SOURCES] Metrics data: ✅ 384 records
⚡ [ENERGY-SOURCES] Sample record: {
  metric_id: '8c4dbd73-910a-468d-a2c4-cfc03dad9dfa',
  value: 1596.1449909541755,
  period: '2025-11-01'
}
```

### ❌ **AUTHENTICATION FAILURE**

```bash
🔍 [ORG-CONTEXT] API called
🔍 [ORG-CONTEXT] User auth: ❌ No user
🔍 [ORG-CONTEXT] Returning 401 - Unauthorized
```

**Fix:** Session cookie is missing or expired. Sign out and sign in again.

### ❌ **NO ORGANIZATION**

```bash
🔍 [ORG-CONTEXT] API called
🔍 [ORG-CONTEXT] User auth: ✅ user-id-here
🔍 [ORG-CONTEXT] Context result: ❌ No context
🔍 [ORG-CONTEXT] No organization found for user
```

**Fix:** User is not linked to an organization. Check `app_users` table.

### ❌ **NO DATA IN DATABASE**

```bash
⚡ [ENERGY-SOURCES] API called
⚡ [ENERGY-SOURCES] User auth: ✅ user-id-here
⚡ [ENERGY-SOURCES] Org info: org-id-here
⚡ [ENERGY-SOURCES] Filters: {...}
⚡ [ENERGY-SOURCES] Metrics catalog: ✅ 10 metrics
⚡ [ENERGY-SOURCES] Querying metrics_data for 10 metric IDs
⚡ [ENERGY-SOURCES] Metrics data: ❌ No data
⚡ [ENERGY-SOURCES] Returning empty result
```

**Fix:** No metrics_data records exist for this organization in the specified date range.

### ❌ **NO METRICS IN CATALOG**

```bash
⚡ [ENERGY-SOURCES] API called
⚡ [ENERGY-SOURCES] User auth: ✅ user-id-here
⚡ [ENERGY-SOURCES] Org info: org-id-here
⚡ [ENERGY-SOURCES] Filters: {...}
⚡ [ENERGY-SOURCES] Metrics catalog: ❌ No metrics
⚡ [ENERGY-SOURCES] No energy metrics in catalog
```

**Fix:** `metrics_catalog` table is empty or missing energy categories.

## Common Issues and Solutions

### Issue 1: "No data" but database has records

**Check:** Date range filters
- Dashboards filter by current year: `2025-01-01` to `2025-12-31`
- Check if your data is in this date range
- Look at the terminal logs for "Effective end date"

**Solution:**
```sql
-- Check what date ranges you have data for
SELECT
  MIN(period_start) as earliest,
  MAX(period_end) as latest,
  COUNT(*) as total_records
FROM metrics_data
WHERE organization_id = 'your-org-id';
```

### Issue 2: Authentication keeps failing

**Check:** Session cookie
- Open browser DevTools → Application → Cookies
- Look for `blipee-session` cookie
- Should be ~43 bytes, httpOnly

**Solution:**
1. Sign out
2. Clear browser cookies
3. Sign in again

### Issue 3: React Query not fetching

**Check:** Browser Console (F12)
- Look for JavaScript errors
- Check Network tab for failed requests
- Look for React Query errors

**Solution:**
```javascript
// Temporarily disable in browser console
localStorage.clear();
location.reload();
```

### Issue 4: API returns data but UI shows "No data"

**Check:** Frontend rendering
- Browser Console for React errors
- Check if `EnergyDashboard` component is receiving props
- Check if charts are rendering

**Solution:** Check the component props in React DevTools

## Database Quick Checks

Use these queries in Supabase SQL Editor:

### Check Organization

```sql
SELECT id, name, slug
FROM organizations
WHERE id = 'your-org-id';
```

### Check User Membership

```sql
SELECT id, email, name, organization_id, role
FROM app_users
WHERE auth_user_id = 'your-user-id';
```

### Check Energy Data

```sql
SELECT
  COUNT(*) as total_records,
  MIN(period_start) as earliest,
  MAX(period_end) as latest
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.organization_id = 'your-org-id'
  AND mc.category IN ('Purchased Energy', 'Electricity')
  AND md.period_start >= '2025-01-01'
  AND md.period_start < '2026-01-01';
```

### Check All Metrics Data

```sql
SELECT
  mc.category,
  COUNT(*) as record_count,
  SUM(md.value) as total_value
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.organization_id = 'your-org-id'
  AND md.period_start >= '2025-01-01'
GROUP BY mc.category
ORDER BY record_count DESC;
```

## Next Steps

1. **Run the dev server:** `npm run dev`
2. **Sign in** as your test user
3. **Navigate to a dashboard** (e.g., /sustainability/energy)
4. **Check the terminal** for debug logs
5. **Check browser DevTools** → Network tab
6. **Report findings** with the log output

## Known Data Status

Based on direct database query:

- **Total metrics_data records:** 2,975
- **Energy records:** 384
- **Organizations:** 5 (PLMJ, Demo Corporation, TechCorp, etc.)
- **Current test user:** José Pinto (jose.pinto@plmj.pt)
  - Organization: PLMJ ✅
  - Role: owner ✅
  - Has active sessions ✅
- **PLMJ has energy data for 2025** ✅

**The database is populated!** If data isn't showing, it's an API filtering or frontend rendering issue.
