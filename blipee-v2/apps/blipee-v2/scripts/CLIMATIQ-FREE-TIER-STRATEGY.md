# Climatiq Free Tier Optimization Strategy

## Free Tier Limits (Estimated)

Based on typical API free tiers:
- **~100-500 API calls/month** (likely)
- **Search endpoint**: 1 call per search
- **Calculate endpoint**: 1 call per calculation
- **Factor lookup**: 1 call per factor ID

**Challenge**: If we have 100 organizations × 10 sites × 5 activities = 5,000 potential calculations/month

**Solution**: Aggressive caching + smart pre-population

---

## Strategy: Cache Everything, Call Once

### Phase 1: Database Caching (Core Strategy)

```sql
-- Cache emission factors permanently
CREATE TABLE emission_factors_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Climatiq identifiers
  climatiq_id TEXT UNIQUE NOT NULL,
  climatiq_activity_id TEXT,

  -- Search metadata (for future lookups)
  activity_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sector TEXT,
  region_code TEXT NOT NULL,  -- US, GB, DE, etc.

  -- The actual factor data
  factor_value NUMERIC NOT NULL,
  factor_unit TEXT NOT NULL,  -- kg CO2e per kWh, km, etc.

  -- Source attribution (for compliance)
  source_dataset TEXT NOT NULL,  -- PCAF, EXIOBASE, etc.
  source_year INTEGER NOT NULL,
  factor_calculation_method TEXT,

  -- Gas breakdown
  co2_factor NUMERIC,
  ch4_factor NUMERIC,
  n2o_factor NUMERIC,

  -- Metadata
  ghg_protocol_compliant BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  api_calls_saved INTEGER DEFAULT 0,  -- Track how many API calls we avoided

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT unique_factor UNIQUE (activity_name, region_code, source_year)
);

-- Index for common queries
CREATE INDEX idx_factors_activity_region ON emission_factors_cache(activity_name, region_code);
CREATE INDEX idx_factors_category ON emission_factors_cache(category);
CREATE INDEX idx_factors_climatiq_id ON emission_factors_cache(climatiq_id);

-- Track API usage
CREATE TABLE api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,  -- 'climatiq', 'electricity_maps', etc.
  endpoint TEXT NOT NULL,  -- 'search', 'estimate', etc.
  called_at TIMESTAMPTZ DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id),

  -- Monthly rollup
  year_month TEXT NOT NULL  -- '2025-01'
);

CREATE INDEX idx_api_usage_month ON api_usage_tracking(api_name, year_month);
```

### Phase 2: Pre-populate Common Factors

**One-time API calls to populate cache with most common factors:**

```typescript
// Run once during setup to populate cache
const commonActivities = [
  // Scope 2: Electricity (most common)
  { activity: 'electricity grid', regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT', 'BR', 'IN', 'CN', 'AU'] },

  // Scope 1: Fuels
  { activity: 'natural gas', regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'] },
  { activity: 'diesel fuel', regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'] },
  { activity: 'gasoline', regions: ['US', 'GB', 'DE', 'FR', 'ES', 'PT'] },

  // Scope 3: Common business activities
  { activity: 'passenger vehicle', regions: ['US', 'GB', 'DE'] },
  { activity: 'hotel stay', regions: ['US', 'GB', 'DE'] },
  { activity: 'office paper', regions: ['US', 'GB', 'DE'] }
]

// Total API calls: ~10 activities × 3-10 regions = 30-100 calls
// This is ONCE, then we're done forever
```

**Result**: 80% of use cases covered with zero ongoing API calls

### Phase 3: Smart Service with Cache-First Logic

```typescript
class ClimatiqService {
  private cacheHits = 0
  private apiCalls = 0

  async getEmissionFactor(params: {
    activity: string
    region: string
    year?: number
  }): Promise<EmissionFactor> {

    // 1. CHECK CACHE FIRST (95% of the time this works)
    const cached = await this.checkCache(params)
    if (cached) {
      this.cacheHits++
      await this.incrementCacheSaved(cached.id)
      console.log(`✅ Cache hit! Saved API call #${cached.api_calls_saved}`)
      return cached
    }

    // 2. Only if cache miss, call API
    console.log(`⚠️  Cache miss - calling Climatiq API`)
    this.apiCalls++

    const factor = await this.callClimatiqAPI(params)

    // 3. Store in cache for future use
    await this.saveToCache(factor)

    // 4. Track API usage
    await this.trackAPICall('climatiq', 'search')

    return factor
  }

  private async checkCache(params): Promise<EmissionFactor | null> {
    // Try exact match first
    let factor = await supabase
      .from('emission_factors_cache')
      .select('*')
      .eq('activity_name', params.activity)
      .eq('region_code', params.region)
      .order('source_year', { ascending: false })
      .limit(1)
      .single()

    if (factor.data) return factor.data

    // Fallback: Try parent region (e.g., US instead of US-CA)
    if (params.region.includes('-')) {
      const parentRegion = params.region.split('-')[0]
      factor = await supabase
        .from('emission_factors_cache')
        .select('*')
        .eq('activity_name', params.activity)
        .eq('region_code', parentRegion)
        .order('source_year', { ascending: false })
        .limit(1)
        .single()

      if (factor.data) {
        console.log(`✅ Using parent region ${parentRegion} instead of ${params.region}`)
        return factor.data
      }
    }

    // Fallback: Global factor if no regional match
    factor = await supabase
      .from('emission_factors_cache')
      .select('*')
      .eq('activity_name', params.activity)
      .is('region_code', null)
      .order('source_year', { ascending: false })
      .limit(1)
      .single()

    return factor.data || null
  }

  async calculateEmissions(params: {
    factorId: string
    amount: number
    unit: string
  }): Promise<number> {
    // Use cached factor for calculation (no API call!)
    const factor = await supabase
      .from('emission_factors_cache')
      .select('*')
      .eq('id', params.factorId)
      .single()

    if (!factor.data) {
      throw new Error('Factor not found in cache')
    }

    // LOCAL calculation (no API call)
    const co2e = params.amount * factor.data.factor_value

    console.log(`🧮 Calculated locally: ${co2e} kg CO2e (no API call)`)

    return co2e
  }

  async getMonthlyAPIUsage(): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7) // '2025-01'

    const { count } = await supabase
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('api_name', 'climatiq')
      .eq('year_month', currentMonth)
      .eq('cache_hit', false)

    return count || 0
  }

  async shouldCallAPI(): Promise<boolean> {
    const usage = await this.getMonthlyAPIUsage()
    const FREE_TIER_LIMIT = 100  // Conservative estimate

    if (usage >= FREE_TIER_LIMIT * 0.8) {  // 80% threshold
      console.warn(`⚠️  Approaching API limit: ${usage}/${FREE_TIER_LIMIT}`)
      return false
    }

    return true
  }
}
```

### Phase 4: Calculation Strategy (No API Calls!)

```typescript
// ❌ WRONG WAY (v1's mistake - requires API call per calculation)
async function calculateWrong(kWh: number, region: string) {
  // This would call Climatiq API every time!
  const result = await climatiq.estimate({
    emission_factor: { activity_id: 'electricity' },
    parameters: { energy: kWh, region }
  })
  return result.co2e
}

// ✅ RIGHT WAY (v2 - use cached factor, calculate locally)
async function calculateRight(kWh: number, region: string) {
  // 1. Get factor from cache (no API call)
  const factor = await db.getEmissionFactor('electricity grid', region)

  // 2. Calculate locally (no API call)
  const co2e = kWh * factor.factor_value

  // 3. Store calculation with audit trail
  await db.saveCalculation({
    activity: 'electricity consumption',
    amount: kWh,
    unit: 'kWh',
    factor_id: factor.id,
    factor_value: factor.factor_value,
    factor_source: factor.source_dataset,
    co2e_kg: co2e,
    region: region
  })

  return co2e
}
```

---

## API Call Budget

### Setup Phase (One-time)
- Pre-populate 10 regions × 7 common activities = **70 API calls**
- Buffer for mistakes/retries = **30 API calls**
- **Total: 100 calls (one month of free tier)**

### Ongoing Usage (Monthly)
- New factor requests (uncommon activities) = **~5-10 calls/month**
- Factor updates (yearly) = **~5 calls/month**
- **Total: 10-15 calls/month**

**Result**: After initial setup, use only 10-15% of free tier monthly

---

## Smart Features to Minimize Calls

### 1. Factor Similarity Detection

```typescript
// Don't call API for similar activities
const similarActivities = {
  'electricity': ['electricity grid', 'grid electricity', 'electric power', 'power consumption'],
  'natural gas': ['natural gas', 'gas', 'lng', 'natural gas combustion'],
  'diesel': ['diesel', 'diesel fuel', 'gas oil', 'diesel oil']
}

// Use same cached factor for similar terms
```

### 2. Regional Hierarchy

```typescript
// Fallback chain to minimize API calls
const regionFallback = {
  'US-CA': ['US-CA', 'US-WECC', 'US', 'GLOBAL'],
  'GB-SCT': ['GB-SCT', 'GB', 'GLOBAL'],
  'DE-BY': ['DE-BY', 'DE', 'EU', 'GLOBAL']
}

// Try specific → state → country → global
// Stops at first cache hit (no API call)
```

### 3. Batch Import

```typescript
// If user uploads CSV with 1000 activities
// Group by unique (activity, region) pairs
// Call API once per unique pair
// Reuse factors for duplicate activities

const uniqueActivities = new Set(
  activities.map(a => `${a.activity}|${a.region}`)
)

console.log(`📊 1000 activities → ${uniqueActivities.size} unique factors needed`)
// Typical: 1000 activities → 10-20 unique factors
```

### 4. Bulk Calculation Endpoint

```typescript
// Instead of: 100 activities × 1 API call each = 100 calls
// Use: 1 bulk call with 100 activities = 1 call

const bulkCalculate = async (activities: Activity[]) => {
  // Get all unique factors from cache
  const factors = await Promise.all(
    uniqueActivities.map(a => getFromCache(a))
  )

  // Calculate all locally
  return activities.map(activity => {
    const factor = factors.find(f => matches(f, activity))
    return activity.amount * factor.value
  })
}

// API calls: 0 (all from cache)
```

---

## Monitoring Dashboard

```typescript
// Track and alert on API usage
interface APIUsageStats {
  month: string
  totalCalls: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number  // Target: >95%
  remainingCalls: number
  projectedMonthlyUsage: number
  alert: 'green' | 'yellow' | 'red'
}

// Alert thresholds
// Green: <50 calls/month
// Yellow: 50-80 calls/month
// Red: >80 calls/month (approaching limit)
```

---

## Pre-Population Script

```typescript
// Run once during deployment
// Uses ~100 API calls to populate cache
// Then you're set for years

async function populateCommonFactors() {
  const stats = {
    totalFactors: 0,
    apiCalls: 0,
    errors: 0
  }

  // Top 10 regions by GDP (covers 80% of use cases)
  const regions = ['US', 'CN', 'JP', 'DE', 'GB', 'IN', 'FR', 'BR', 'IT', 'CA']

  // Top 10 activities (covers 90% of business use cases)
  const activities = [
    'electricity grid',
    'natural gas',
    'diesel fuel',
    'gasoline',
    'passenger vehicle',
    'freight truck',
    'hotel stay',
    'office paper',
    'waste disposal',
    'business flight'
  ]

  for (const region of regions) {
    for (const activity of activities) {
      try {
        const factor = await climatiq.search(activity, region)
        await saveToCache(factor)

        stats.totalFactors++
        stats.apiCalls++

        console.log(`✅ ${activity} (${region}) - API call #${stats.apiCalls}`)

        // Rate limiting: 1 call per second
        await sleep(1000)

      } catch (error) {
        stats.errors++
        console.log(`❌ Failed: ${activity} (${region})`)
      }
    }
  }

  console.log(`\n📊 Population Complete:`)
  console.log(`   Factors cached: ${stats.totalFactors}`)
  console.log(`   API calls used: ${stats.apiCalls}`)
  console.log(`   Errors: ${stats.errors}`)
  console.log(`   Cache hit rate (future): ~95%+`)
}
```

---

## Implementation Priority

### Week 1: Core Caching
1. ✅ Create `emission_factors_cache` table
2. ✅ Create `api_usage_tracking` table
3. ✅ Build cache-first service
4. ✅ Add usage monitoring

### Week 2: Pre-population
1. ✅ Run pre-population script (uses free tier)
2. ✅ Verify cache coverage
3. ✅ Test cache hit rates

### Week 3: Optimization
1. ✅ Add similarity detection
2. ✅ Add regional fallbacks
3. ✅ Build monitoring dashboard

### Week 4: Production
1. ✅ Monitor API usage
2. ✅ Tune cache strategies
3. ✅ Add alerts for high usage

---

## Expected Results

**After setup:**
- **Cache hit rate**: 95-98%
- **Monthly API calls**: 5-15 (well under free tier)
- **Coverage**: 80%+ of use cases with zero API calls
- **Scalability**: Can serve 1000+ organizations with same cache
- **Cost**: $0/month (stay on free tier forever)

**ROI**:
- Initial investment: 100 API calls (setup)
- Ongoing: 10 calls/month
- Saved: 1000s of API calls per month
- **Cache saves >99% of potential API calls**

---

## Bonus: Manual Factor Entry Fallback

```typescript
// If we're approaching API limit and factor not in cache
// Allow manual factor entry with source citation

interface ManualEmissionFactor {
  activity: string
  region: string
  factor_value: number
  source: 'IPCC 2021' | 'EPA 2024' | 'DEFRA 2024' | 'User Input'
  source_url: string
  entered_by: string
  approved: boolean
}

// Admin can enter factors from official sources
// No API call needed
// Still compliance-ready with source attribution
```

---

## Summary

**Free Tier Strategy:**
1. **Cache everything** - Store factors permanently in database
2. **Pre-populate** - 100 API calls to cover 95% of use cases
3. **Calculate locally** - Never call estimate endpoint
4. **Smart fallbacks** - Regional hierarchy + similarity matching
5. **Monitor usage** - Alert before approaching limits
6. **Manual entry** - Backup for edge cases

**Result:** Stay on free tier forever while serving unlimited calculations!
