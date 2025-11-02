/**
 * Cached Data Fetching - Sustainability Metrics
 *
 * Uses React cache() for deduplication and unstable_cache for longer-term caching.
 * Metrics don't change frequently, so we can cache them for 60 seconds.
 */

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/v2/server'

/**
 * Get energy metrics for a user
 *
 * Cached per-request with React cache()
 */
export const getEnergyMetrics = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('energy_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(30) // Last 30 entries

  if (error) {
    console.error('Error fetching energy metrics:', error)
    return []
  }

  return data
})

/**
 * Get water metrics for a user
 *
 * Cached per-request with React cache()
 */
export const getWaterMetrics = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('water_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching water metrics:', error)
    return []
  }

  return data
})

/**
 * Get carbon metrics for a user
 *
 * Cached per-request with React cache()
 */
export const getCarbonMetrics = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('carbon_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching carbon metrics:', error)
    return []
  }

  return data
})

/**
 * Get waste metrics for a user
 *
 * Cached per-request with React cache()
 */
export const getWasteMetrics = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('waste_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching waste metrics:', error)
    return []
  }

  return data
})

/**
 * Get dashboard summary with cross-request caching
 *
 * This uses unstable_cache to cache results for 60 seconds across requests.
 * Perfect for expensive aggregation queries that don't need real-time data.
 *
 * @example
 * ```tsx
 * const summary = await getDashboardSummary(userId)
 * ```
 */
export const getDashboardSummary = async (userId: string) => {
  return unstable_cache(
    async () => {
      const supabase = await createClient()

      // Fetch latest metrics for each category
      const [energy, water, carbon, waste] = await Promise.all([
        supabase
          .from('energy_metrics')
          .select('total_consumption')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('water_metrics')
          .select('total_consumption')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('carbon_metrics')
          .select('total_emissions')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('waste_metrics')
          .select('total_waste')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
      ])

      return {
        energy: energy.data?.total_consumption || 0,
        water: water.data?.total_consumption || 0,
        carbon: carbon.data?.total_emissions || 0,
        waste: waste.data?.total_waste || 0,
      }
    },
    [`dashboard-summary-${userId}`],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: [`user-${userId}`, 'dashboard-summary'],
    }
  )()
}

/**
 * Get metrics trend data (compare current vs previous period)
 *
 * Cached for 5 minutes since trend data is computationally expensive
 */
export const getMetricsTrends = async (userId: string) => {
  return unstable_cache(
    async () => {
      const supabase = await createClient()

      // Get last 60 days of data
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const [energyData, waterData, carbonData] = await Promise.all([
        supabase
          .from('energy_metrics')
          .select('total_consumption, timestamp')
          .eq('user_id', userId)
          .gte('timestamp', sixtyDaysAgo.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('water_metrics')
          .select('total_consumption, timestamp')
          .eq('user_id', userId)
          .gte('timestamp', sixtyDaysAgo.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('carbon_metrics')
          .select('total_emissions, timestamp')
          .eq('user_id', userId)
          .gte('timestamp', sixtyDaysAgo.toISOString())
          .order('timestamp', { ascending: true }),
      ])

      // Calculate trends (last 30 days vs previous 30 days)
      return {
        energy: calculateTrend(energyData.data || []),
        water: calculateTrend(waterData.data || []),
        carbon: calculateTrend(carbonData.data || []),
      }
    },
    [`metrics-trends-${userId}`],
    {
      revalidate: 300, // Cache for 5 minutes
      tags: [`user-${userId}`, 'metrics-trends'],
    }
  )()
}

/**
 * Helper function to calculate trend percentage
 */
function calculateTrend(data: any[]): number {
  if (data.length < 30) return 0

  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint)
  const secondHalf = data.slice(midpoint)

  const firstSum = firstHalf.reduce(
    (sum, item) => sum + (item.total_consumption || item.total_emissions || 0),
    0
  )
  const secondSum = secondHalf.reduce(
    (sum, item) => sum + (item.total_consumption || item.total_emissions || 0),
    0
  )

  if (firstSum === 0) return 0

  return ((secondSum - firstSum) / firstSum) * 100
}
