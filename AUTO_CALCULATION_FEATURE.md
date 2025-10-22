# Auto-Calculation Feature - Autonomous Performance Scoring

## Overview
Implemented autonomous performance score calculation that automatically calculates and refreshes scores without user intervention, aligning with blipee's "AI employees that work 24/7" philosophy.

## Implementation

### 1. Auto-Calculate on First Load
**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx` (Lines 72-80)

```typescript
React.useEffect(() => {
  const autoCalculate = async () => {
    if (!scoreData && !isScoreLoading && isCurrentYear) {
      console.log('📊 No score found, auto-calculating...');
      await handleRecalculate();
    }
  };
  autoCalculate();
}, [scoreData, isScoreLoading, isCurrentYear]);
```

**Behavior**:
- When user visits dashboard for the first time
- If no score exists in database
- Automatically calculates score in background
- User sees loading state, then score appears

### 2. Auto-Refresh Every 5 Minutes
**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx` (Lines 82-96)

```typescript
React.useEffect(() => {
  if (!isCurrentYear) return; // Only auto-refresh for current year

  const interval = setInterval(() => {
    console.log('🔄 Auto-refreshing performance score...');
    if (isPortfolioView) {
      refetchPortfolioScore();
    } else if (selectedSite?.id) {
      refetchSiteScore();
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}, [isCurrentYear, isPortfolioView, selectedSite?.id, refetchPortfolioScore, refetchSiteScore]);
```

**Behavior**:
- Background polling every 5 minutes
- Automatically fetches latest score from database
- If score was recalculated by another process, user sees it
- Only for current year (historical years don't change)

### 3. "Last Updated" Timestamp Display
**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx` (Lines 225-240, 295-300)

```typescript
// Helper function
const formatLastUpdated = (timestamp: string) => {
  const now = new Date();
  const updated = new Date(timestamp);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  // ... more time formatting
};

// UI display
{data.calculatedAt && (
  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
    Updated {formatLastUpdated(data.calculatedAt)}
  </p>
)}
```

**Display Examples**:
- "Updated just now"
- "Updated 3 mins ago"
- "Updated 2 hours ago"
- "Updated 1 day ago"

**Visual Design**:
- Small green dot indicator (shows system is active)
- Subtle gray text (doesn't distract)
- Below subtitle line
- Builds trust without being intrusive

### 4. Superadmin-Only Manual Recalculate
**File**: `/src/hooks/useUserRole.ts` (NEW)

Created hook to check superadmin status:
```typescript
export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  // Fetches from /api/auth/user-role
  return { isSuperAdmin: userRole?.isSuperAdmin || false };
}
```

**File**: `/src/components/dashboard/OverviewDashboardWithScore.tsx` (Lines 252-261)

```typescript
{isSuperAdmin && (
  <button
    onClick={onRecalculate}
    disabled={isRecalculating}
    title="Recalculate Score (Super Admin Only)"
  >
    <RefreshCw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
  </button>
)}
```

**Access Control**:
- ❌ Regular users: Button hidden completely
- ✅ Super admins: Button visible for debugging/testing
- Tooltip explains it's admin-only

## User Experience

### Normal Users See:
```
blipee Performance Index™
Rendimento de sustentabilidade em toda a cartera em todos os sites
● Updated 2 mins ago

[Large circular score display: 40/100]
```

**No manual controls** - System feels autonomous and intelligent

### Super Admins See:
```
blipee Performance Index™                    [🔄]
Rendimento de sustentabilidade em toda a cartera em todos os sites
● Updated 2 mins ago

[Large circular score display: 40/100]
```

**Small refresh button** for manual recalculation when debugging

## Benefits

1. **Aligns with Brand Promise**
   - "Autonomous AI employees that work 24/7"
   - No manual button-clicking for normal users
   - System just works

2. **Builds Trust**
   - "Updated X mins ago" shows system is active
   - Green dot visual indicator
   - Fresh data without asking

3. **Performance Optimized**
   - Only recalculates when needed
   - 5-minute polling is efficient
   - Prevents unnecessary calculations

4. **Debugging Support**
   - Superadmins can force recalculation
   - Helps troubleshoot score issues
   - Doesn't expose complexity to users

## Future Enhancements

### Phase 2: Real-Time Updates (Recommended)
Instead of polling, implement push-based updates:

1. **Database Triggers**
   ```sql
   CREATE OR REPLACE FUNCTION notify_score_update()
   RETURNS trigger AS $$
   BEGIN
     PERFORM pg_notify('score_updated', NEW.id::text);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER score_update_trigger
   AFTER INSERT OR UPDATE ON performance_scores
   FOR EACH ROW EXECUTE FUNCTION notify_score_update();
   ```

2. **WebSocket Connection**
   - Listen for score updates
   - Push to connected clients
   - Real-time without polling

3. **Event-Driven Recalculation**
   - Trigger on `metrics_data` insert/update
   - Calculate score immediately
   - Notify all connected users

### Phase 3: Smart Caching
- Cache scores with TTL
- Invalidate on data changes
- Reduce database load

### Phase 4: Predictive Calculation
- Calculate next score before user asks
- Pre-warm cache for common queries
- Ultra-fast response times

## Configuration

Current settings (can be adjusted):

```typescript
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AUTO_CALCULATE_ON_MOUNT = true;
const SHOW_LAST_UPDATED = true;
const SUPER_ADMIN_ONLY_MANUAL = true;
```

## Testing

### Test Auto-Calculation on Mount
1. Delete score from database
2. Reload dashboard
3. Should see loading state
4. Score appears automatically
5. "Updated just now" appears

### Test Auto-Refresh
1. Open dashboard
2. Wait 5 minutes
3. Check console for "🔄 Auto-refreshing..."
4. Score updates if changed

### Test Last Updated
1. Check timestamp format
2. Wait and verify it updates
3. Check different time ranges

### Test Superadmin Button
1. Login as normal user → No button
2. Login as superadmin → Button visible
3. Click → Score recalculates
4. Spinner shows during calculation

## Rollback Plan

If issues arise, can easily disable:

```typescript
// Disable auto-calculate on mount
if (false && !scoreData && !isScoreLoading) {
  // ...
}

// Disable auto-refresh
if (false && isCurrentYear) {
  // ...
}
```

Or adjust polling interval:
```typescript
}, 30 * 60 * 1000); // Change to 30 minutes
```
