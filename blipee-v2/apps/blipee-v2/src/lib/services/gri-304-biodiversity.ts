/**
 * GRI 304: Biodiversity Service
 * Biodiversity impact tracking and protected area management
 * Target: 10% automation (mostly manual assessments)
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

export interface OperationalSite {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Site location (GRI 304-1)
  location_name: string
  latitude: number
  longitude: number
  site_area_hectares: number

  // Protected area proximity
  in_protected_area?: boolean
  adjacent_to_protected_area?: boolean
  protected_area_name?: string
  protected_area_type?: 'unesco' | 'iucn' | 'ramsar' | 'national_park' | 'other'
  distance_to_protected_area_km?: number

  // Biodiversity value
  biodiversity_value?: 'high' | 'medium' | 'low'
  endemic_species_present?: boolean
  threatened_species_present?: boolean

  // Metadata
  metadata?: Record<string, any>
}

export interface SignificantImpact {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Impact details (GRI 304-2)
  impact_type:
    | 'habitat_destruction'
    | 'habitat_fragmentation'
    | 'pollution'
    | 'invasive_species'
    | 'water_extraction'
    | 'noise_disturbance'
    | 'light_pollution'
    | 'other'

  impact_severity: 'high' | 'medium' | 'low'
  impact_duration: 'permanent' | 'temporary' | 'periodic'

  // Affected areas
  affected_area_hectares?: number
  affected_species?: string[]
  threatened_species_affected?: string[]

  // Activities causing impact
  activity_description: string
  activity_type?: 'construction' | 'extraction' | 'processing' | 'transport' | 'waste_disposal' | 'other'

  // Metadata
  metadata?: Record<string, any>
}

export interface HabitatProtection {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Protection details (GRI 304-3)
  habitat_type: string
  protected_area_hectares: number
  restoration_area_hectares?: number

  // Protection status
  protection_status: 'protected' | 'restored' | 'ongoing_restoration' | 'planned'
  restoration_method?: string

  // Success metrics
  species_reintroduced?: number
  native_vegetation_coverage_percent?: number

  // Partnerships
  conservation_partners?: string[]

  // Metadata
  metadata?: Record<string, any>
}

export interface SpeciesImpact {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Species details (GRI 304-4)
  species_name: string
  common_name?: string
  scientific_name?: string

  // Conservation status (IUCN Red List)
  iucn_status: 'critically_endangered' | 'endangered' | 'vulnerable' | 'near_threatened' | 'least_concern'
  national_conservation_status?: string

  // Impact
  impact_type: 'positive' | 'negative' | 'neutral'
  population_trend?: 'increasing' | 'stable' | 'decreasing' | 'unknown'

  // Habitat
  habitat_affected_hectares?: number

  // Metadata
  metadata?: Record<string, any>
}

export interface BiodiversityResult {
  metric_id: string
  value: number
  unit: string
  data_quality: 'measured' | 'calculated' | 'estimated'
}

export interface BiodiversitySummary {
  total_sites: number
  sites_in_protected_areas: number
  total_affected_area_hectares: number
  total_protected_area_hectares: number
  threatened_species_count: number
  restoration_area_hectares: number
}

// ============================================================================
// GRI 304-1: OPERATIONAL SITES IN PROTECTED AREAS
// ============================================================================

/**
 * Record operational site in or near protected areas (GRI 304-1)
 */
export async function recordOperationalSite(site: OperationalSite): Promise<BiodiversityResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_304_1_protected_areas')
      .single()

    if (!metric) throw new Error('GRI 304-1 metric not found in catalog')

    // Record site
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: site.organization_id,
      site_id: site.site_id,
      period_start: site.period_start.toISOString(),
      period_end: site.period_end.toISOString(),
      value: site.site_area_hectares,
      unit: 'hectares',
      co2e_emissions: 0,
      metadata: {
        location_name: site.location_name,
        coordinates: {
          latitude: site.latitude,
          longitude: site.longitude,
        },
        in_protected_area: site.in_protected_area || false,
        adjacent_to_protected_area: site.adjacent_to_protected_area || false,
        protected_area_name: site.protected_area_name,
        protected_area_type: site.protected_area_type,
        distance_to_protected_area_km: site.distance_to_protected_area_km,
        biodiversity_value: site.biodiversity_value,
        endemic_species_present: site.endemic_species_present || false,
        threatened_species_present: site.threatened_species_present || false,
        ...site.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      value: site.site_area_hectares,
      unit: 'hectares',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording operational site:', error)
    return null
  }
}

// ============================================================================
// GRI 304-2: SIGNIFICANT IMPACTS ON BIODIVERSITY
// ============================================================================

/**
 * Record significant impact on biodiversity (GRI 304-2)
 */
export async function recordSignificantImpact(impact: SignificantImpact): Promise<BiodiversityResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_304_2_significant_impacts')
      .single()

    if (!metric) throw new Error('GRI 304-2 metric not found in catalog')

    // Record impact
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: impact.organization_id,
      site_id: impact.site_id,
      period_start: impact.period_start.toISOString(),
      period_end: impact.period_end.toISOString(),
      value: impact.affected_area_hectares || 0,
      unit: 'hectares',
      co2e_emissions: 0,
      metadata: {
        impact_type: impact.impact_type,
        impact_severity: impact.impact_severity,
        impact_duration: impact.impact_duration,
        activity_description: impact.activity_description,
        activity_type: impact.activity_type,
        affected_species: impact.affected_species || [],
        threatened_species_affected: impact.threatened_species_affected || [],
        affected_area_hectares: impact.affected_area_hectares || 0,
        ...impact.metadata,
      },
      data_quality: 'estimated',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      value: impact.affected_area_hectares || 0,
      unit: 'hectares',
      data_quality: 'estimated',
    }
  } catch (error) {
    console.error('Error recording significant impact:', error)
    return null
  }
}

// ============================================================================
// GRI 304-3: HABITATS PROTECTED OR RESTORED
// ============================================================================

/**
 * Record habitat protection or restoration (GRI 304-3)
 */
export async function recordHabitatProtection(habitat: HabitatProtection): Promise<BiodiversityResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_304_3_habitats_protected')
      .single()

    if (!metric) throw new Error('GRI 304-3 metric not found in catalog')

    // Record habitat protection
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: habitat.organization_id,
      site_id: habitat.site_id,
      period_start: habitat.period_start.toISOString(),
      period_end: habitat.period_end.toISOString(),
      value: habitat.protected_area_hectares + (habitat.restoration_area_hectares || 0),
      unit: 'hectares',
      co2e_emissions: 0,
      metadata: {
        habitat_type: habitat.habitat_type,
        protected_area_hectares: habitat.protected_area_hectares,
        restoration_area_hectares: habitat.restoration_area_hectares || 0,
        protection_status: habitat.protection_status,
        restoration_method: habitat.restoration_method,
        species_reintroduced: habitat.species_reintroduced || 0,
        native_vegetation_coverage_percent: habitat.native_vegetation_coverage_percent,
        conservation_partners: habitat.conservation_partners || [],
        positive_impact: true,
        ...habitat.metadata,
      },
      data_quality: 'measured',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      value: habitat.protected_area_hectares + (habitat.restoration_area_hectares || 0),
      unit: 'hectares',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording habitat protection:', error)
    return null
  }
}

// ============================================================================
// GRI 304-4: IUCN RED LIST SPECIES
// ============================================================================

/**
 * Record species on IUCN Red List affected by operations (GRI 304-4)
 */
export async function recordSpeciesImpact(species: SpeciesImpact): Promise<BiodiversityResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_304_4_iucn_species')
      .single()

    if (!metric) throw new Error('GRI 304-4 metric not found in catalog')

    // Record species impact
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: species.organization_id,
      site_id: species.site_id,
      period_start: species.period_start.toISOString(),
      period_end: species.period_end.toISOString(),
      value: 1, // Count of species
      unit: 'species',
      co2e_emissions: 0,
      metadata: {
        species_name: species.species_name,
        common_name: species.common_name,
        scientific_name: species.scientific_name,
        iucn_status: species.iucn_status,
        national_conservation_status: species.national_conservation_status,
        impact_type: species.impact_type,
        population_trend: species.population_trend,
        habitat_affected_hectares: species.habitat_affected_hectares,
        threatened: ['critically_endangered', 'endangered', 'vulnerable'].includes(species.iucn_status),
        ...species.metadata,
      },
      data_quality: 'estimated',
      verification_status: 'pending',
    })

    return {
      metric_id: metric.id,
      value: 1,
      unit: 'species',
      data_quality: 'estimated',
    }
  } catch (error) {
    console.error('Error recording species impact:', error)
    return null
  }
}

// ============================================================================
// BIODIVERSITY SUMMARY & REPORTING
// ============================================================================

/**
 * Calculate biodiversity summary
 */
export async function calculateBiodiversitySummary(
  organizationId: string,
  year: number
): Promise<BiodiversitySummary | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Count sites
    const totalSites = data.filter((d) => d.metadata?.location_name).length

    // Count sites in protected areas
    const sitesInProtectedAreas = data.filter(
      (d) => d.metadata?.in_protected_area === true || d.metadata?.adjacent_to_protected_area === true
    ).length

    // Sum affected area
    const totalAffectedArea = data
      .filter((d) => d.metadata?.impact_type && d.metadata?.affected_area_hectares)
      .reduce((sum, d) => sum + (d.metadata.affected_area_hectares || 0), 0)

    // Sum protected area
    const totalProtectedArea = data
      .filter((d) => d.metadata?.protected_area_hectares)
      .reduce((sum, d) => sum + (d.metadata.protected_area_hectares || 0), 0)

    // Count threatened species
    const threatenedSpecies = data.filter((d) => d.metadata?.threatened === true).length

    // Sum restoration area
    const restorationArea = data
      .filter((d) => d.metadata?.restoration_area_hectares)
      .reduce((sum, d) => sum + (d.metadata.restoration_area_hectares || 0), 0)

    return {
      total_sites: totalSites,
      sites_in_protected_areas: sitesInProtectedAreas,
      total_affected_area_hectares: totalAffectedArea,
      total_protected_area_hectares: totalProtectedArea,
      threatened_species_count: threatenedSpecies,
      restoration_area_hectares: restorationArea,
    }
  } catch (error) {
    console.error('Error calculating biodiversity summary:', error)
    return null
  }
}

/**
 * Get list of threatened species affected
 */
export async function getThreatenedSpeciesList(
  organizationId: string,
  year: number
): Promise<
  Array<{
    species_name: string
    common_name?: string
    iucn_status: string
    impact_type: string
  }> | null
> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    const species = data
      .filter((d) => d.metadata?.species_name && d.metadata?.threatened === true)
      .map((d) => ({
        species_name: d.metadata.species_name,
        common_name: d.metadata.common_name,
        iucn_status: d.metadata.iucn_status,
        impact_type: d.metadata.impact_type,
      }))

    return species
  } catch (error) {
    console.error('Error getting threatened species list:', error)
    return null
  }
}

/**
 * Get biodiversity impacts by site
 */
export async function getBiodiversityImpactsBySite(
  organizationId: string,
  year: number
): Promise<
  Array<{
    site_id: string
    location_name: string
    in_protected_area: boolean
    affected_area_hectares: number
    protected_area_hectares: number
  }> | null
> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('site_id, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Group by site
    const sites: Record<
      string,
      {
        location_name: string
        in_protected_area: boolean
        affected_area: number
        protected_area: number
      }
    > = {}

    data.forEach((d) => {
      if (!d.site_id) return

      if (!sites[d.site_id]) {
        sites[d.site_id] = {
          location_name: d.metadata?.location_name || 'Unknown',
          in_protected_area: d.metadata?.in_protected_area || false,
          affected_area: 0,
          protected_area: 0,
        }
      }

      sites[d.site_id].affected_area += d.metadata?.affected_area_hectares || 0
      sites[d.site_id].protected_area += d.metadata?.protected_area_hectares || 0
    })

    return Object.entries(sites).map(([site_id, data]) => ({
      site_id,
      location_name: data.location_name,
      in_protected_area: data.in_protected_area,
      affected_area_hectares: data.affected_area,
      protected_area_hectares: data.protected_area,
    }))
  } catch (error) {
    console.error('Error getting biodiversity impacts by site:', error)
    return null
  }
}
