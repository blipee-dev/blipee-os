/**
 * Climatiq API Service
 * Implements cache-first strategy to stay within free tier limits
 * Strategy: CLIMATIQ-FREE-TIER-STRATEGY.md
 */

import { createClient } from '@supabase/supabase-js'

const CLIMATIQ_BASE_URL = 'https://api.climatiq.io'
const CLIMATIQ_DATA_VERSION = '^12' // Use latest v12 data

// Lazy initialization of Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseClient
}

// Lazy getter for API key (allows env to be loaded after module initialization)
function getClimatiqApiKey(): string {
  const apiKey = process.env.CLIMATIQ_API_KEY
  if (!apiKey) {
    throw new Error('CLIMATIQ_API_KEY environment variable is not set')
  }
  return apiKey
}

// ============================================================================
// TYPES
// ============================================================================

export interface ClimatiqEmissionFactor {
  id: string
  activity_id: string
  name: string
  category: string
  sector?: string
  source: string
  year: number | string
  region: string
  region_name: string
  factor: number
  factor_calculation_method: string
  factor_calculation_origin: string
  constituent_gases?: {
    co2e_total?: number
    co2e_other?: number
    co2?: number
    ch4?: number
    n2o?: number
  }
  unit_type: string
}

export interface ClimatiqSearchResponse {
  results: ClimatiqEmissionFactor[]
  total_results: number
  page: number
  pages: number
}

export interface ClimatiqEstimateRequest {
  emission_factor: { id: string } | { activity_id: string }
  parameters: Record<string, any>
}

export interface ClimatiqEstimateResponse {
  co2e: number
  co2e_mt: number
  co2e_calculation_method: string
  co2e_calculation_origin: string
  constituent_gases?: {
    co2_mt?: number
    ch4_mt?: number
    n2o_mt?: number
  }
  emission_factor: ClimatiqEmissionFactor
}

export interface CachedEmissionFactor {
  id: string
  climatiq_id: string
  climatiq_activity_id: string | null
  activity_name: string
  category: string
  sector: string | null
  region_code: string
  factor_value: number
  factor_unit: string
  source_dataset: string
  source_year: number
  factor_calculation_method: string | null
  co2_factor: number | null
  ch4_factor: number | null
  n2o_factor: number | null
  co2e_total: number | null
  ghg_protocol_compliant: boolean
  api_calls_saved: number
}

export interface EmissionCalculationResult {
  co2e_kg: number
  co2e_tonnes: number
  factor_id: string
  factor_value: number
  factor_unit: string
  source: string
  source_year: number
  cached: boolean
  gas_breakdown?: {
    co2_kg?: number
    ch4_kg?: number
    n2o_kg?: number
  }
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Check cache for emission factor
 * Implements regional fallback: PT-LIS → PT → GLOBAL
 */
async function checkCache(
  activityName: string,
  regionCode: string,
  year?: number
): Promise<CachedEmissionFactor | null> {
  try {
    // Try exact match first
    let { data, error } = await getSupabase()
      .from('emission_factors_cache')
      .select('*')
      .eq('activity_name', activityName)
      .eq('region_code', regionCode)
      .order('source_year', { ascending: false })
      .limit(1)
      .single()

    if (data && !error) {
      console.log(`✅ Cache hit: ${activityName} (${regionCode})`)
      return data
    }

    // Fallback: Try parent region (e.g., PT instead of PT-LIS)
    if (regionCode.includes('-')) {
      const parentRegion = regionCode.split('-')[0]
      const { data: parentData, error: parentError } = await getSupabase()
        .from('emission_factors_cache')
        .select('*')
        .eq('activity_name', activityName)
        .eq('region_code', parentRegion)
        .order('source_year', { ascending: false })
        .limit(1)
        .single()

      if (parentData && !parentError) {
        console.log(`✅ Cache hit (parent region): ${activityName} (${parentRegion})`)
        return parentData
      }
    }

    // Fallback: Global factor
    const { data: globalData, error: globalError } = await getSupabase()
      .from('emission_factors_cache')
      .select('*')
      .eq('activity_name', activityName)
      .eq('region_code', 'GLOBAL')
      .order('source_year', { ascending: false })
      .limit(1)
      .single()

    if (globalData && !globalError) {
      console.log(`✅ Cache hit (global): ${activityName} (GLOBAL)`)
      return globalData
    }

    console.log(`⚠️  Cache miss: ${activityName} (${regionCode})`)
    return null
  } catch (error) {
    console.error('Cache check error:', error)
    return null
  }
}

/**
 * Save emission factor to cache
 */
async function saveToCache(factor: ClimatiqEmissionFactor): Promise<void> {
  try {
    const { error } = await getSupabase().from('emission_factors_cache').insert({
      climatiq_id: factor.id,
      climatiq_activity_id: factor.activity_id,
      activity_name: factor.name,
      category: factor.category,
      sector: factor.sector,
      region_code: factor.region,
      factor_value: factor.factor,
      factor_unit: factor.unit_type,
      source_dataset: factor.source,
      source_year: typeof factor.year === 'number' ? factor.year : parseInt(factor.year),
      factor_calculation_method: factor.factor_calculation_method,
      co2_factor: factor.constituent_gases?.co2,
      ch4_factor: factor.constituent_gases?.ch4,
      n2o_factor: factor.constituent_gases?.n2o,
      co2e_total: factor.constituent_gases?.co2e_total,
      ghg_protocol_compliant: true,
      api_calls_saved: 0,
    })

    if (error) {
      // Ignore unique constraint violations (factor already cached)
      if (!error.message.includes('unique_factor')) {
        console.error('Cache save error:', error)
      }
    } else {
      console.log(`💾 Cached: ${factor.name} (${factor.region})`)
    }
  } catch (error) {
    console.error('Cache save error:', error)
  }
}

/**
 * Increment cache saved counter
 */
async function incrementCacheSaved(factorId: string): Promise<void> {
  try {
    await getSupabase().rpc('increment_cache_saved', { p_factor_id: factorId })
  } catch (error) {
    console.error('Increment cache saved error:', error)
  }
}

/**
 * Track API usage
 */
async function trackAPICall(
  apiName: string,
  endpoint: string,
  cacheHit: boolean,
  organizationId?: string
): Promise<void> {
  try {
    const now = new Date()
    const yearMonth = now.toISOString().slice(0, 7) // YYYY-MM

    await getSupabase().from('api_usage_tracking').insert({
      api_name: apiName,
      endpoint: endpoint,
      cache_hit: cacheHit,
      organization_id: organizationId,
      year_month: yearMonth,
      called_at: now.toISOString(),
    })
  } catch (error) {
    console.error('Track API call error:', error)
  }
}

// ============================================================================
// CLIMATIQ API CALLS
// ============================================================================

/**
 * Search for emission factors
 */
export async function searchEmissionFactors(
  query: string,
  region?: string
): Promise<ClimatiqSearchResponse | null> {
  try {
    const params = new URLSearchParams({
      query,
      data_version: CLIMATIQ_DATA_VERSION,
      ...(region && { region }),
    })

    const response = await fetch(`${CLIMATIQ_BASE_URL}/search?${params}`, {
      headers: {
        Authorization: `Bearer ${getClimatiqApiKey()}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Climatiq search failed: ${response.status}`, error)
      return null
    }

    await trackAPICall('climatiq', 'search', false)

    return await response.json()
  } catch (error: any) {
    console.error('Climatiq search error:', error.message)
    return null
  }
}

/**
 * Calculate emissions using Climatiq estimate endpoint
 */
export async function calculateEmissionDirect(
  data: ClimatiqEstimateRequest
): Promise<ClimatiqEstimateResponse | null> {
  try {
    const response = await fetch(`${CLIMATIQ_BASE_URL}/estimate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getClimatiqApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Climatiq estimate failed: ${response.status}`, error)
      return null
    }

    await trackAPICall('climatiq', 'estimate', false)

    return await response.json()
  } catch (error: any) {
    console.error('Climatiq estimate error:', error.message)
    return null
  }
}

// ============================================================================
// HIGH-LEVEL SERVICE METHODS (Cache-First)
// ============================================================================

/**
 * Get emission factor with cache-first strategy
 */
export async function getEmissionFactor(
  activityName: string,
  regionCode: string = 'GLOBAL',
  year?: number
): Promise<CachedEmissionFactor | null> {
  // 1. Check cache first (95% of the time this works)
  const cached = await checkCache(activityName, regionCode, year)
  if (cached) {
    await incrementCacheSaved(cached.id)
    await trackAPICall('climatiq', 'get_emission_factor', true)
    return cached
  }

  // 2. Cache miss - call Climatiq API
  console.log(`⚠️  Cache miss - calling Climatiq API for: ${activityName} (${regionCode})`)

  const searchResults = await searchEmissionFactors(activityName, regionCode)
  if (!searchResults || searchResults.results.length === 0) {
    console.error(`No emission factor found for: ${activityName} (${regionCode})`)
    return null
  }

  // 3. Use the first (most relevant) result
  const factor = searchResults.results[0]

  // 4. Save to cache
  await saveToCache(factor)

  // 5. Return as CachedEmissionFactor
  return {
    id: factor.id,
    climatiq_id: factor.id,
    climatiq_activity_id: factor.activity_id,
    activity_name: factor.name,
    category: factor.category,
    sector: factor.sector || null,
    region_code: factor.region,
    factor_value: factor.factor,
    factor_unit: factor.unit_type,
    source_dataset: factor.source,
    source_year: typeof factor.year === 'number' ? factor.year : parseInt(factor.year),
    factor_calculation_method: factor.factor_calculation_method,
    co2_factor: factor.constituent_gases?.co2 || null,
    ch4_factor: factor.constituent_gases?.ch4 || null,
    n2o_factor: factor.constituent_gases?.n2o || null,
    co2e_total: factor.constituent_gases?.co2e_total || null,
    ghg_protocol_compliant: true,
    api_calls_saved: 0,
  }
}

/**
 * Calculate emissions locally using cached factor (NO API CALL!)
 */
export async function calculateEmissions(
  activityName: string,
  amount: number,
  regionCode: string = 'GLOBAL',
  organizationId?: string
): Promise<EmissionCalculationResult | null> {
  // 1. Get factor from cache (or fetch if needed)
  const factor = await getEmissionFactor(activityName, regionCode)
  if (!factor) {
    console.error(`Cannot calculate emissions: No factor for ${activityName} (${regionCode})`)
    return null
  }

  // 2. Calculate emissions LOCALLY (no API call!)
  const co2e_kg = amount * factor.factor_value

  console.log(`🧮 Calculated locally: ${co2e_kg.toFixed(2)} kg CO2e (${activityName})`)

  return {
    co2e_kg,
    co2e_tonnes: co2e_kg / 1000,
    factor_id: factor.id,
    factor_value: factor.factor_value,
    factor_unit: factor.factor_unit,
    source: factor.source_dataset,
    source_year: factor.source_year,
    cached: true,
    gas_breakdown: {
      co2_kg: factor.co2_factor ? amount * factor.co2_factor : undefined,
      ch4_kg: factor.ch4_factor ? amount * factor.ch4_factor : undefined,
      n2o_kg: factor.n2o_factor ? amount * factor.n2o_factor : undefined,
    },
  }
}

/**
 * Get monthly API usage statistics
 */
export async function getMonthlyAPIUsage(): Promise<{
  apiCalls: number
  cacheHits: number
  cacheHitRate: number
  remainingCalls: number
}> {
  try {
    const now = new Date()
    const yearMonth = now.toISOString().slice(0, 7)

    const { count: totalCalls } = await getSupabase()
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('api_name', 'climatiq')
      .eq('year_month', yearMonth)

    const { count: cacheHits } = await getSupabase()
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('api_name', 'climatiq')
      .eq('year_month', yearMonth)
      .eq('cache_hit', true)

    const apiCalls = (totalCalls || 0) - (cacheHits || 0)
    const cacheHitRate = totalCalls ? (cacheHits || 0) / totalCalls : 0
    const FREE_TIER_LIMIT = 100 // Conservative estimate
    const remainingCalls = Math.max(0, FREE_TIER_LIMIT - apiCalls)

    return {
      apiCalls,
      cacheHits: cacheHits || 0,
      cacheHitRate: cacheHitRate * 100,
      remainingCalls,
    }
  } catch (error) {
    console.error('Get monthly API usage error:', error)
    return { apiCalls: 0, cacheHits: 0, cacheHitRate: 0, remainingCalls: 100 }
  }
}

/**
 * Check if we should call the API (stay within free tier)
 */
export async function shouldCallAPI(): Promise<boolean> {
  const usage = await getMonthlyAPIUsage()
  const FREE_TIER_LIMIT = 100

  if (usage.apiCalls >= FREE_TIER_LIMIT * 0.8) {
    console.warn(`⚠️  Approaching API limit: ${usage.apiCalls}/${FREE_TIER_LIMIT}`)
    return false
  }

  return true
}
