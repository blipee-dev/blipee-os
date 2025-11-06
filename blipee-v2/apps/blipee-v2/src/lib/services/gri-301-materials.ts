/**
 * GRI 301: Materials Service
 * Material usage tracking (renewable, non-renewable, recycled)
 * Target: 10% automation (mostly manual tracking)
 */

import { createClient } from '@supabase/supabase-js'

// Lazy Supabase initialization
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

// ============================================================================
// TYPES
// ============================================================================

export interface MaterialUsage {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Material details (GRI 301-1)
  material_name: string
  material_category:
    | 'raw_materials'
    | 'packaging_materials'
    | 'semi_manufactured_goods'
    | 'components'
    | 'other'

  // Material type
  material_type: 'renewable' | 'non_renewable'
  is_recycled?: boolean // Recycled content
  recycled_percentage?: number // % of recycled content

  // Amount
  weight_kg: number
  unit?: string // Additional unit if needed

  // Source tracking
  supplier?: string
  supplier_location?: string
  certification?: string // FSC, Cradle-to-Cradle, etc.

  // Metadata
  metadata?: Record<string, any>
}

export interface RecycledMaterial {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Material details (GRI 301-2)
  material_name: string
  recycled_input_percentage: number // % of recycled input materials
  weight_kg: number

  // Source
  recycling_source?: 'post_consumer' | 'post_industrial' | 'mixed'
  certification?: string

  // Metadata
  metadata?: Record<string, any>
}

export interface ReclaimedProduct {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Product details (GRI 301-3)
  product_name: string
  product_category: string

  // Reclaimed/recycled at end of life
  products_sold_quantity: number
  products_reclaimed_quantity: number
  reclaimed_percentage: number // % reclaimed

  // Reclaimed by category
  reuse_quantity?: number
  recycling_quantity?: number
  composting_quantity?: number
  energy_recovery_quantity?: number
  incineration_quantity?: number
  landfill_quantity?: number

  // Metadata
  metadata?: Record<string, any>
}

export interface MaterialResult {
  metric_id: string
  weight_kg: number
  weight_tonnes: number
  data_quality: 'measured' | 'calculated' | 'estimated'
}

export interface MaterialSummary {
  total_materials_kg: number
  renewable_materials_kg: number
  non_renewable_materials_kg: number
  recycled_materials_kg: number
  renewable_percentage: number
  recycled_percentage: number
}

// ============================================================================
// GRI 301-1: MATERIALS USED
// ============================================================================

/**
 * Record material usage by weight (GRI 301-1)
 */
export async function recordMaterialUsage(material: MaterialUsage): Promise<MaterialResult | null> {
  try {
    // Get metric code based on material type
    const metricCode =
      material.material_type === 'renewable'
        ? 'gri_301_1_renewable_materials'
        : 'gri_301_1_non_renewable_materials'

    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', metricCode)
      .single()

    if (!metric) throw new Error(`Metric ${metricCode} not found in catalog`)

    // Record material usage
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: material.organization_id,
      site_id: material.site_id,
      period_start: material.period_start.toISOString(),
      period_end: material.period_end.toISOString(),
      value: material.weight_kg,
      unit: material.unit || 'kg',
      co2e_emissions: 0, // No direct emissions for material usage tracking
      metadata: {
        material_name: material.material_name,
        material_category: material.material_category,
        material_type: material.material_type,
        is_recycled: material.is_recycled || false,
        recycled_percentage: material.recycled_percentage || 0,
        supplier: material.supplier,
        supplier_location: material.supplier_location,
        certification: material.certification,
        ...material.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    // Also record to total materials used
    const { data: totalMetric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_301_1_materials_used')
      .single()

    if (totalMetric) {
      await getSupabase().from('metrics_data').insert({
        metric_id: totalMetric.id,
        organization_id: material.organization_id,
        site_id: material.site_id,
        period_start: material.period_start.toISOString(),
        period_end: material.period_end.toISOString(),
        value: material.weight_kg,
        unit: material.unit || 'kg',
        co2e_emissions: 0,
        metadata: {
          material_name: material.material_name,
          material_type: material.material_type,
          is_recycled: material.is_recycled || false,
          ...material.metadata,
        },
        data_quality: 'measured',
        verification_status: 'pending',
      })
    }

    return {
      metric_id: metric.id,
      weight_kg: material.weight_kg,
      weight_tonnes: material.weight_kg / 1000,
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording material usage:', error)
    return null
  }
}

// ============================================================================
// GRI 301-2: RECYCLED INPUT MATERIALS
// ============================================================================

/**
 * Record recycled input materials used (GRI 301-2)
 */
export async function recordRecycledMaterial(material: RecycledMaterial): Promise<MaterialResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_301_2_recycled_input')
      .single()

    if (!metric) throw new Error('GRI 301-2 metric not found in catalog')

    // Record recycled material
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: material.organization_id,
      site_id: material.site_id,
      period_start: material.period_start.toISOString(),
      period_end: material.period_end.toISOString(),
      value: material.weight_kg,
      unit: 'kg',
      co2e_emissions: 0,
      metadata: {
        material_name: material.material_name,
        recycled_input_percentage: material.recycled_input_percentage,
        recycling_source: material.recycling_source,
        certification: material.certification,
        circular_economy: true,
        ...material.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      weight_kg: material.weight_kg,
      weight_tonnes: material.weight_kg / 1000,
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording recycled material:', error)
    return null
  }
}

// ============================================================================
// GRI 301-3: RECLAIMED PRODUCTS AND PACKAGING
// ============================================================================

/**
 * Record reclaimed products at end of life (GRI 301-3)
 */
export async function recordReclaimedProduct(product: ReclaimedProduct): Promise<MaterialResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_301_3_reclaimed_products')
      .single()

    if (!metric) throw new Error('GRI 301-3 metric not found in catalog')

    // Record reclaimed products
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: product.organization_id,
      site_id: product.site_id,
      period_start: product.period_start.toISOString(),
      period_end: product.period_end.toISOString(),
      value: product.products_reclaimed_quantity,
      unit: 'units',
      co2e_emissions: 0,
      metadata: {
        product_name: product.product_name,
        product_category: product.product_category,
        products_sold_quantity: product.products_sold_quantity,
        products_reclaimed_quantity: product.products_reclaimed_quantity,
        reclaimed_percentage: product.reclaimed_percentage,
        breakdown: {
          reuse: product.reuse_quantity || 0,
          recycling: product.recycling_quantity || 0,
          composting: product.composting_quantity || 0,
          energy_recovery: product.energy_recovery_quantity || 0,
          incineration: product.incineration_quantity || 0,
          landfill: product.landfill_quantity || 0,
        },
        circular_economy: true,
        ...product.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      weight_kg: product.products_reclaimed_quantity,
      weight_tonnes: product.products_reclaimed_quantity / 1000,
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording reclaimed product:', error)
    return null
  }
}

// ============================================================================
// MATERIAL SUMMARY & CIRCULAR ECONOMY METRICS
// ============================================================================

/**
 * Calculate material usage summary (circular economy metrics)
 */
export async function calculateMaterialSummary(
  organizationId: string,
  siteId: string,
  year: number
): Promise<MaterialSummary | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .eq('site_id', siteId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Sum total materials
    const totalMaterials = data
      .filter((d) => d.metadata?.material_name)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum renewable materials
    const renewableMaterials = data
      .filter((d) => d.metadata?.material_type === 'renewable')
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum non-renewable materials
    const nonRenewableMaterials = data
      .filter((d) => d.metadata?.material_type === 'non_renewable')
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Sum recycled materials
    const recycledMaterials = data
      .filter((d) => d.metadata?.is_recycled === true || d.metadata?.circular_economy === true)
      .reduce((sum, d) => sum + (d.value || 0), 0)

    // Calculate percentages
    const renewablePercentage = totalMaterials > 0 ? (renewableMaterials / totalMaterials) * 100 : 0
    const recycledPercentage = totalMaterials > 0 ? (recycledMaterials / totalMaterials) * 100 : 0

    return {
      total_materials_kg: totalMaterials,
      renewable_materials_kg: renewableMaterials,
      non_renewable_materials_kg: nonRenewableMaterials,
      recycled_materials_kg: recycledMaterials,
      renewable_percentage: renewablePercentage,
      recycled_percentage: recycledPercentage,
    }
  } catch (error) {
    console.error('Error calculating material summary:', error)
    return null
  }
}

/**
 * Get material breakdown by category
 */
export async function getMaterialBreakdownByCategory(
  organizationId: string,
  year: number
): Promise<Record<string, { weight_kg: number; percentage: number }> | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Group by material category
    const breakdown: Record<string, number> = {}
    let total = 0

    data
      .filter((d) => d.metadata?.material_category)
      .forEach((d) => {
        const category = d.metadata.material_category
        breakdown[category] = (breakdown[category] || 0) + (d.value || 0)
        total += d.value || 0
      })

    // Calculate percentages
    const result: Record<string, { weight_kg: number; percentage: number }> = {}
    Object.entries(breakdown).forEach(([category, weight]) => {
      result[category] = {
        weight_kg: weight,
        percentage: total > 0 ? (weight / total) * 100 : 0,
      }
    })

    return result
  } catch (error) {
    console.error('Error getting material breakdown:', error)
    return null
  }
}

/**
 * Get top materials by usage
 */
export async function getTopMaterials(
  organizationId: string,
  year: number,
  limit: number = 10
): Promise<Array<{ material_name: string; weight_kg: number; material_type: string }> | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Group by material name
    const materials: Record<string, { weight: number; type: string }> = {}

    data
      .filter((d) => d.metadata?.material_name)
      .forEach((d) => {
        const name = d.metadata.material_name
        if (!materials[name]) {
          materials[name] = {
            weight: 0,
            type: d.metadata.material_type || 'unknown',
          }
        }
        materials[name].weight += d.value || 0
      })

    // Convert to array and sort
    const sorted = Object.entries(materials)
      .map(([name, data]) => ({
        material_name: name,
        weight_kg: data.weight,
        material_type: data.type,
      }))
      .sort((a, b) => b.weight_kg - a.weight_kg)
      .slice(0, limit)

    return sorted
  } catch (error) {
    console.error('Error getting top materials:', error)
    return null
  }
}
