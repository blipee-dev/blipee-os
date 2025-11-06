/**
 * GRI 308: Supplier Environmental Assessment Service
 * Supplier screening and assessment for environmental impacts
 * Target: 20% automation (automated scoring, manual assessments)
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

export interface SupplierScreening {
  organization_id: string
  period_start: Date
  period_end: Date

  // Supplier details (GRI 308-1)
  supplier_name: string
  supplier_id?: string
  supplier_country: string
  supplier_category:
    | 'raw_materials'
    | 'packaging'
    | 'energy'
    | 'logistics'
    | 'waste_management'
    | 'services'
    | 'other'

  // Screening status
  screened: boolean
  screening_date?: Date
  screening_method?: 'questionnaire' | 'audit' | 'certification_review' | 'third_party_assessment'

  // Environmental criteria
  environmental_criteria_used?: string[]

  // Certifications
  iso_14001_certified?: boolean
  other_certifications?: string[]

  // Metadata
  metadata?: Record<string, any>
}

export interface SupplierAssessment {
  organization_id: string
  period_start: Date
  period_end: Date

  // Supplier details (GRI 308-2)
  supplier_name: string
  supplier_id?: string
  supplier_country: string

  // Assessment details
  assessment_date: Date
  assessment_type: 'initial' | 'periodic' | 'follow_up' | 'incident_triggered'
  assessor?: string

  // Impact identification
  negative_impacts_identified: boolean
  impact_severity?: 'high' | 'medium' | 'low'
  impact_areas?: string[] // e.g., ['emissions', 'waste', 'water', 'biodiversity']
  impact_description?: string

  // Specific environmental impacts
  emissions_impact?: boolean
  water_impact?: boolean
  waste_impact?: boolean
  biodiversity_impact?: boolean
  pollution_impact?: boolean

  // Actions taken
  improvement_plan_agreed?: boolean
  improvement_plan_details?: string
  relationship_terminated?: boolean
  termination_reason?: string

  // Timeline
  deadline_for_improvement?: Date
  follow_up_date?: Date

  // Metadata
  metadata?: Record<string, any>
}

export interface SupplierScore {
  supplier_name: string
  supplier_id?: string

  // Environmental performance score (0-100)
  environmental_score: number

  // Score breakdown
  emissions_score?: number
  waste_management_score?: number
  water_management_score?: number
  compliance_score?: number
  certifications_score?: number

  // Risk level
  risk_level: 'high' | 'medium' | 'low'

  // Recommendations
  recommendations?: string[]
}

export interface SupplierResult {
  metric_id: string
  value: number
  unit: string
  data_quality: 'measured' | 'calculated' | 'estimated'
}

export interface SupplierSummary {
  total_suppliers: number
  screened_suppliers: number
  screening_percentage: number
  suppliers_with_negative_impacts: number
  high_risk_suppliers: number
  improvement_plans_active: number
  relationships_terminated: number
  iso_14001_certified_suppliers: number
}

// ============================================================================
// GRI 308-1: NEW SUPPLIERS SCREENED USING ENVIRONMENTAL CRITERIA
// ============================================================================

/**
 * Record new supplier screening (GRI 308-1)
 */
export async function recordSupplierScreening(screening: SupplierScreening): Promise<SupplierResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_308_1_supplier_screening')
      .single()

    if (!metric) throw new Error('GRI 308-1 metric not found in catalog')

    // Record screening
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: screening.organization_id,
      site_id: null, // Supplier screening is organization-level
      period_start: screening.period_start.toISOString(),
      period_end: screening.period_end.toISOString(),
      value: screening.screened ? 1 : 0,
      unit: 'supplier',
      co2e_emissions: 0,
      metadata: {
        supplier_name: screening.supplier_name,
        supplier_id: screening.supplier_id,
        supplier_country: screening.supplier_country,
        supplier_category: screening.supplier_category,
        screened: screening.screened,
        screening_date: screening.screening_date?.toISOString(),
        screening_method: screening.screening_method,
        environmental_criteria_used: screening.environmental_criteria_used || [],
        iso_14001_certified: screening.iso_14001_certified || false,
        other_certifications: screening.other_certifications || [],
        ...screening.metadata,
      },
      data_quality: 'measured',
      verification_status: 'verified',
    })

    return {
      metric_id: metric.id,
      value: screening.screened ? 1 : 0,
      unit: 'supplier',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording supplier screening:', error)
    return null
  }
}

// ============================================================================
// GRI 308-2: NEGATIVE ENVIRONMENTAL IMPACTS IN SUPPLY CHAIN
// ============================================================================

/**
 * Record supplier assessment with negative impacts (GRI 308-2)
 */
export async function recordSupplierAssessment(assessment: SupplierAssessment): Promise<SupplierResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_308_2_supply_chain_impacts')
      .single()

    if (!metric) throw new Error('GRI 308-2 metric not found in catalog')

    // Record assessment
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: assessment.organization_id,
      site_id: null,
      period_start: assessment.period_start.toISOString(),
      period_end: assessment.period_end.toISOString(),
      value: assessment.negative_impacts_identified ? 1 : 0,
      unit: 'supplier',
      co2e_emissions: 0,
      metadata: {
        supplier_name: assessment.supplier_name,
        supplier_id: assessment.supplier_id,
        supplier_country: assessment.supplier_country,
        assessment_date: assessment.assessment_date.toISOString(),
        assessment_type: assessment.assessment_type,
        assessor: assessment.assessor,
        negative_impacts_identified: assessment.negative_impacts_identified,
        impact_severity: assessment.impact_severity,
        impact_areas: assessment.impact_areas || [],
        impact_description: assessment.impact_description,
        emissions_impact: assessment.emissions_impact || false,
        water_impact: assessment.water_impact || false,
        waste_impact: assessment.waste_impact || false,
        biodiversity_impact: assessment.biodiversity_impact || false,
        pollution_impact: assessment.pollution_impact || false,
        improvement_plan_agreed: assessment.improvement_plan_agreed || false,
        improvement_plan_details: assessment.improvement_plan_details,
        relationship_terminated: assessment.relationship_terminated || false,
        termination_reason: assessment.termination_reason,
        deadline_for_improvement: assessment.deadline_for_improvement?.toISOString(),
        follow_up_date: assessment.follow_up_date?.toISOString(),
        high_risk: assessment.impact_severity === 'high',
        ...assessment.metadata,
      },
      data_quality: 'measured',
      verification_status: 'verified',
    })

    return {
      metric_id: metric.id,
      value: assessment.negative_impacts_identified ? 1 : 0,
      unit: 'supplier',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording supplier assessment:', error)
    return null
  }
}

// ============================================================================
// SUPPLIER SCORING (20% AUTOMATED)
// ============================================================================

/**
 * Calculate environmental score for a supplier
 * Automated scoring based on data available
 */
export async function calculateSupplierScore(
  organizationId: string,
  supplierName: string,
  year: number
): Promise<SupplierScore | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Get supplier data
    const supplierData = data.filter(
      (d) => d.metadata?.supplier_name === supplierName || d.metadata?.supplier_id === supplierName
    )

    if (supplierData.length === 0) return null

    // Calculate scores (0-100)
    let environmentalScore = 100 // Start at 100, deduct for issues

    // Deduct for negative impacts
    const hasNegativeImpacts = supplierData.some((d) => d.metadata?.negative_impacts_identified === true)
    if (hasNegativeImpacts) {
      environmentalScore -= 30
    }

    // Deduct for high severity impacts
    const hasHighSeverityImpacts = supplierData.some((d) => d.metadata?.impact_severity === 'high')
    if (hasHighSeverityImpacts) {
      environmentalScore -= 20
    }

    // Add for certifications
    const hasISO14001 = supplierData.some((d) => d.metadata?.iso_14001_certified === true)
    if (hasISO14001) {
      environmentalScore = Math.min(100, environmentalScore + 15)
    }

    // Add for screening completed
    const isScreened = supplierData.some((d) => d.metadata?.screened === true)
    if (isScreened) {
      environmentalScore = Math.min(100, environmentalScore + 5)
    }

    // Calculate sub-scores
    const emissionsScore = supplierData.some((d) => d.metadata?.emissions_impact === true) ? 50 : 100
    const wasteScore = supplierData.some((d) => d.metadata?.waste_impact === true) ? 50 : 100
    const waterScore = supplierData.some((d) => d.metadata?.water_impact === true) ? 50 : 100
    const complianceScore = supplierData.some((d) => d.metadata?.relationship_terminated === true) ? 0 : 100
    const certificationsScore = hasISO14001 ? 100 : supplierData.some((d) => (d.metadata?.other_certifications || []).length > 0) ? 70 : 30

    // Determine risk level
    let riskLevel: 'high' | 'medium' | 'low'
    if (environmentalScore < 50) {
      riskLevel = 'high'
    } else if (environmentalScore < 75) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (!hasISO14001) {
      recommendations.push('Consider requiring ISO 14001 certification')
    }
    if (hasNegativeImpacts) {
      recommendations.push('Develop improvement plan with specific targets')
    }
    if (!isScreened) {
      recommendations.push('Complete environmental screening assessment')
    }
    if (emissionsScore < 100) {
      recommendations.push('Request emissions reduction targets')
    }

    return {
      supplier_name: supplierName,
      supplier_id: supplierData[0]?.metadata?.supplier_id,
      environmental_score: Math.round(environmentalScore),
      emissions_score: emissionsScore,
      waste_management_score: wasteScore,
      water_management_score: waterScore,
      compliance_score: complianceScore,
      certifications_score: certificationsScore,
      risk_level: riskLevel,
      recommendations,
    }
  } catch (error) {
    console.error('Error calculating supplier score:', error)
    return null
  }
}

// ============================================================================
// SUPPLIER SUMMARY & REPORTING
// ============================================================================

/**
 * Calculate supplier environmental summary
 */
export async function calculateSupplierSummary(
  organizationId: string,
  year: number
): Promise<SupplierSummary | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Get unique suppliers
    const supplierNames = new Set<string>()
    data.forEach((d) => {
      if (d.metadata?.supplier_name) {
        supplierNames.add(d.metadata.supplier_name)
      }
    })
    const totalSuppliers = supplierNames.size

    // Count screened suppliers
    const screenedSuppliers = new Set<string>()
    data.forEach((d) => {
      if (d.metadata?.screened === true && d.metadata?.supplier_name) {
        screenedSuppliers.add(d.metadata.supplier_name)
      }
    })
    const screenedCount = screenedSuppliers.size

    // Calculate screening percentage
    const screeningPercentage = totalSuppliers > 0 ? (screenedCount / totalSuppliers) * 100 : 0

    // Count suppliers with negative impacts
    const suppliersWithImpacts = new Set<string>()
    data.forEach((d) => {
      if (d.metadata?.negative_impacts_identified === true && d.metadata?.supplier_name) {
        suppliersWithImpacts.add(d.metadata.supplier_name)
      }
    })

    // Count high risk suppliers
    const highRiskSuppliers = new Set<string>()
    data.forEach((d) => {
      if (d.metadata?.high_risk === true && d.metadata?.supplier_name) {
        highRiskSuppliers.add(d.metadata.supplier_name)
      }
    })

    // Count improvement plans
    const improvementPlansActive = data.filter((d) => d.metadata?.improvement_plan_agreed === true).length

    // Count terminated relationships
    const relationshipsTerminated = data.filter((d) => d.metadata?.relationship_terminated === true).length

    // Count ISO 14001 certified
    const iso14001Certified = new Set<string>()
    data.forEach((d) => {
      if (d.metadata?.iso_14001_certified === true && d.metadata?.supplier_name) {
        iso14001Certified.add(d.metadata.supplier_name)
      }
    })

    return {
      total_suppliers: totalSuppliers,
      screened_suppliers: screenedCount,
      screening_percentage: screeningPercentage,
      suppliers_with_negative_impacts: suppliersWithImpacts.size,
      high_risk_suppliers: highRiskSuppliers.size,
      improvement_plans_active: improvementPlansActive,
      relationships_terminated: relationshipsTerminated,
      iso_14001_certified_suppliers: iso14001Certified.size,
    }
  } catch (error) {
    console.error('Error calculating supplier summary:', error)
    return null
  }
}

/**
 * Get list of high-risk suppliers
 */
export async function getHighRiskSuppliers(
  organizationId: string,
  year: number
): Promise<
  Array<{
    supplier_name: string
    supplier_country: string
    impact_severity: string
    impact_areas: string[]
    environmental_score?: number
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

    // Get high risk suppliers
    const highRiskData = data.filter((d) => d.metadata?.high_risk === true || d.metadata?.impact_severity === 'high')

    // Get unique suppliers
    const suppliers = new Map<string, any>()
    for (const d of highRiskData) {
      if (!d.metadata?.supplier_name) continue

      const name = d.metadata.supplier_name
      if (!suppliers.has(name)) {
        // Calculate score for this supplier
        const score = await calculateSupplierScore(organizationId, name, year)

        suppliers.set(name, {
          supplier_name: name,
          supplier_country: d.metadata.supplier_country,
          impact_severity: d.metadata.impact_severity,
          impact_areas: d.metadata.impact_areas || [],
          environmental_score: score?.environmental_score,
        })
      }
    }

    return Array.from(suppliers.values())
  } catch (error) {
    console.error('Error getting high risk suppliers:', error)
    return null
  }
}

/**
 * Get suppliers by certification status
 */
export async function getSuppliersByCertification(
  organizationId: string,
  year: number
): Promise<{
  iso_14001: string[]
  other_certifications: string[]
  no_certification: string[]
} | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    const iso14001: Set<string> = new Set()
    const otherCerts: Set<string> = new Set()
    const noCerts: Set<string> = new Set()
    const allSuppliers: Set<string> = new Set()

    data.forEach((d) => {
      if (!d.metadata?.supplier_name) return

      const name = d.metadata.supplier_name
      allSuppliers.add(name)

      if (d.metadata.iso_14001_certified === true) {
        iso14001.add(name)
      } else if ((d.metadata.other_certifications || []).length > 0) {
        otherCerts.add(name)
      }
    })

    // Suppliers with no certifications = all - (iso14001 + other)
    allSuppliers.forEach((name) => {
      if (!iso14001.has(name) && !otherCerts.has(name)) {
        noCerts.add(name)
      }
    })

    return {
      iso_14001: Array.from(iso14001),
      other_certifications: Array.from(otherCerts),
      no_certification: Array.from(noCerts),
    }
  } catch (error) {
    console.error('Error getting suppliers by certification:', error)
    return null
  }
}
