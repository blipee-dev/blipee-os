/**
 * GRI 307: Environmental Compliance Service
 * Environmental laws and regulations compliance tracking
 * Target: 0% automation (fully manual - legal/regulatory tracking)
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

export interface EnvironmentalNonCompliance {
  organization_id: string
  site_id?: string | null
  period_start: Date
  period_end: Date

  // Non-compliance details (GRI 307-1)
  incident_date: Date
  incident_type:
    | 'fine'
    | 'penalty'
    | 'warning'
    | 'sanction'
    | 'lawsuit'
    | 'permit_violation'
    | 'emission_violation'
    | 'waste_violation'
    | 'water_violation'
    | 'other'

  // Severity
  severity: 'critical' | 'high' | 'medium' | 'low'

  // Financial impact
  fine_amount?: number
  fine_currency?: string
  total_cost?: number // Including legal fees, remediation, etc.

  // Legal/Regulatory details
  regulation_violated: string
  regulation_reference?: string
  regulatory_authority: string
  jurisdiction: string

  // Description
  description: string
  violation_details?: string

  // Resolution
  resolution_status: 'open' | 'in_progress' | 'resolved' | 'appealing'
  resolution_date?: Date
  corrective_actions?: string[]
  preventive_actions?: string[]

  // Metadata
  metadata?: Record<string, any>
}

export interface EnvironmentalPermit {
  organization_id: string
  site_id: string
  period_start: Date
  period_end: Date

  // Permit details
  permit_name: string
  permit_number: string
  permit_type:
    | 'emissions'
    | 'wastewater_discharge'
    | 'waste_management'
    | 'water_extraction'
    | 'environmental_impact'
    | 'operating_license'
    | 'other'

  // Status
  permit_status: 'active' | 'expired' | 'pending_renewal' | 'under_review'
  issue_date: Date
  expiry_date: Date

  // Authority
  issuing_authority: string
  jurisdiction: string

  // Conditions
  permit_conditions?: string[]
  monitoring_requirements?: string[]

  // Compliance
  compliant: boolean
  last_inspection_date?: Date
  next_inspection_date?: Date

  // Metadata
  metadata?: Record<string, any>
}

export interface EnvironmentalAudit {
  organization_id: string
  site_id?: string | null
  period_start: Date
  period_end: Date

  // Audit details
  audit_date: Date
  audit_type: 'internal' | 'external' | 'regulatory' | 'certification'
  audit_scope: string[]

  // Auditor
  auditor_name: string
  auditor_organization?: string
  certification_body?: string

  // Results
  audit_result: 'compliant' | 'minor_non_conformity' | 'major_non_conformity' | 'critical_non_conformity'
  findings_count: number
  critical_findings?: number
  major_findings?: number
  minor_findings?: number

  // Findings
  findings?: string[]
  recommendations?: string[]

  // Follow-up
  corrective_action_plan?: string
  follow_up_date?: Date

  // Metadata
  metadata?: Record<string, any>
}

export interface ComplianceResult {
  metric_id: string
  value: number
  unit: string
  data_quality: 'measured' | 'calculated' | 'estimated'
}

export interface ComplianceSummary {
  total_incidents: number
  critical_incidents: number
  total_fines_amount: number
  open_incidents: number
  resolved_incidents: number
  active_permits: number
  expired_permits: number
  pending_renewal_permits: number
  audits_conducted: number
  non_conformities: number
}

// ============================================================================
// GRI 307-1: NON-COMPLIANCE WITH ENVIRONMENTAL LAWS
// ============================================================================

/**
 * Record environmental non-compliance incident (GRI 307-1)
 */
export async function recordNonCompliance(incident: EnvironmentalNonCompliance): Promise<ComplianceResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_307_1_non_compliance')
      .single()

    if (!metric) throw new Error('GRI 307-1 metric not found in catalog')

    // Record incident
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: incident.organization_id,
      site_id: incident.site_id,
      period_start: incident.period_start.toISOString(),
      period_end: incident.period_end.toISOString(),
      value: incident.fine_amount || 0,
      unit: incident.fine_currency || 'EUR',
      co2e_emissions: 0,
      metadata: {
        incident_date: incident.incident_date.toISOString(),
        incident_type: incident.incident_type,
        severity: incident.severity,
        fine_amount: incident.fine_amount,
        fine_currency: incident.fine_currency,
        total_cost: incident.total_cost,
        regulation_violated: incident.regulation_violated,
        regulation_reference: incident.regulation_reference,
        regulatory_authority: incident.regulatory_authority,
        jurisdiction: incident.jurisdiction,
        description: incident.description,
        violation_details: incident.violation_details,
        resolution_status: incident.resolution_status,
        resolution_date: incident.resolution_date?.toISOString(),
        corrective_actions: incident.corrective_actions || [],
        preventive_actions: incident.preventive_actions || [],
        critical: incident.severity === 'critical',
        ...incident.metadata,
      },
      data_quality: 'measured',
      verification_status: 'verified',
    })

    return {
      metric_id: metric.id,
      value: incident.fine_amount || 0,
      unit: incident.fine_currency || 'EUR',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording non-compliance:', error)
    return null
  }
}

// ============================================================================
// ENVIRONMENTAL PERMITS TRACKING
// ============================================================================

/**
 * Record environmental permit
 */
export async function recordEnvironmentalPermit(permit: EnvironmentalPermit): Promise<ComplianceResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_307_1_non_compliance') // Using same metric catalog entry
      .single()

    if (!metric) throw new Error('GRI 307-1 metric not found in catalog')

    // Record permit
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: permit.organization_id,
      site_id: permit.site_id,
      period_start: permit.period_start.toISOString(),
      period_end: permit.period_end.toISOString(),
      value: 1, // Count of permits
      unit: 'permit',
      co2e_emissions: 0,
      metadata: {
        type: 'permit',
        permit_name: permit.permit_name,
        permit_number: permit.permit_number,
        permit_type: permit.permit_type,
        permit_status: permit.permit_status,
        issue_date: permit.issue_date.toISOString(),
        expiry_date: permit.expiry_date.toISOString(),
        issuing_authority: permit.issuing_authority,
        jurisdiction: permit.jurisdiction,
        permit_conditions: permit.permit_conditions || [],
        monitoring_requirements: permit.monitoring_requirements || [],
        compliant: permit.compliant,
        last_inspection_date: permit.last_inspection_date?.toISOString(),
        next_inspection_date: permit.next_inspection_date?.toISOString(),
        days_to_expiry: Math.floor(
          (permit.expiry_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
        ...permit.metadata,
      },
      data_quality: 'measured',
      verification_status: 'verified',
    })

    return {
      metric_id: metric.id,
      value: 1,
      unit: 'permit',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording environmental permit:', error)
    return null
  }
}

// ============================================================================
// ENVIRONMENTAL AUDITS TRACKING
// ============================================================================

/**
 * Record environmental audit
 */
export async function recordEnvironmentalAudit(audit: EnvironmentalAudit): Promise<ComplianceResult | null> {
  try {
    const { data: metric } = await getSupabase()
      .from('metrics_catalog')
      .select('id')
      .eq('code', 'gri_307_1_non_compliance') // Using same metric catalog entry
      .single()

    if (!metric) throw new Error('GRI 307-1 metric not found in catalog')

    // Record audit
    await getSupabase().from('metrics_data').insert({
      metric_id: metric.id,
      organization_id: audit.organization_id,
      site_id: audit.site_id,
      period_start: audit.period_start.toISOString(),
      period_end: audit.period_end.toISOString(),
      value: audit.findings_count,
      unit: 'findings',
      co2e_emissions: 0,
      metadata: {
        type: 'audit',
        audit_date: audit.audit_date.toISOString(),
        audit_type: audit.audit_type,
        audit_scope: audit.audit_scope,
        auditor_name: audit.auditor_name,
        auditor_organization: audit.auditor_organization,
        certification_body: audit.certification_body,
        audit_result: audit.audit_result,
        findings_count: audit.findings_count,
        critical_findings: audit.critical_findings || 0,
        major_findings: audit.major_findings || 0,
        minor_findings: audit.minor_findings || 0,
        findings: audit.findings || [],
        recommendations: audit.recommendations || [],
        corrective_action_plan: audit.corrective_action_plan,
        follow_up_date: audit.follow_up_date?.toISOString(),
        ...audit.metadata,
      },
      data_quality: 'measured',
      verification_status: 'verified',
    })

    return {
      metric_id: metric.id,
      value: audit.findings_count,
      unit: 'findings',
      data_quality: 'measured',
    }
  } catch (error) {
    console.error('Error recording environmental audit:', error)
    return null
  }
}

// ============================================================================
// COMPLIANCE SUMMARY & REPORTING
// ============================================================================

/**
 * Calculate compliance summary
 */
export async function calculateComplianceSummary(
  organizationId: string,
  year: number
): Promise<ComplianceSummary | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('value, unit, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    // Count incidents (exclude permits and audits)
    const incidents = data.filter((d) => d.metadata?.incident_type && d.metadata?.type !== 'permit' && d.metadata?.type !== 'audit')
    const totalIncidents = incidents.length

    // Count critical incidents
    const criticalIncidents = incidents.filter((d) => d.metadata?.critical === true).length

    // Sum total fines
    const totalFinesAmount = incidents
      .filter((d) => d.metadata?.fine_amount)
      .reduce((sum, d) => sum + (d.metadata.fine_amount || 0), 0)

    // Count open/resolved
    const openIncidents = incidents.filter((d) => d.metadata?.resolution_status === 'open' || d.metadata?.resolution_status === 'in_progress').length
    const resolvedIncidents = incidents.filter((d) => d.metadata?.resolution_status === 'resolved').length

    // Count permits by status
    const permits = data.filter((d) => d.metadata?.type === 'permit')
    const activePermits = permits.filter((d) => d.metadata?.permit_status === 'active').length
    const expiredPermits = permits.filter((d) => d.metadata?.permit_status === 'expired').length
    const pendingRenewalPermits = permits.filter((d) => d.metadata?.permit_status === 'pending_renewal').length

    // Count audits and findings
    const audits = data.filter((d) => d.metadata?.type === 'audit')
    const auditsConducted = audits.length
    const nonConformities = audits.reduce((sum, d) => sum + (d.metadata?.findings_count || 0), 0)

    return {
      total_incidents: totalIncidents,
      critical_incidents: criticalIncidents,
      total_fines_amount: totalFinesAmount,
      open_incidents: openIncidents,
      resolved_incidents: resolvedIncidents,
      active_permits: activePermits,
      expired_permits: expiredPermits,
      pending_renewal_permits: pendingRenewalPermits,
      audits_conducted: auditsConducted,
      non_conformities: nonConformities,
    }
  } catch (error) {
    console.error('Error calculating compliance summary:', error)
    return null
  }
}

/**
 * Get non-compliance incidents by severity
 */
export async function getIncidentsBySeverity(
  organizationId: string,
  year: number
): Promise<Record<string, number> | null> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)

    if (!data) return null

    const severityCounts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    data
      .filter((d) => d.metadata?.incident_type && d.metadata?.severity)
      .forEach((d) => {
        const severity = d.metadata.severity
        severityCounts[severity] = (severityCounts[severity] || 0) + 1
      })

    return severityCounts
  } catch (error) {
    console.error('Error getting incidents by severity:', error)
    return null
  }
}

/**
 * Get permits expiring soon (within next 90 days)
 */
export async function getPermitsExpiringSoon(
  organizationId: string,
  daysAhead: number = 90
): Promise<
  Array<{
    permit_name: string
    permit_number: string
    site_id: string
    expiry_date: string
    days_to_expiry: number
  }> | null
> {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data } = await getSupabase()
      .from('metrics_data')
      .select('site_id, metadata')
      .eq('organization_id', organizationId)
      .lte('period_end', futureDate.toISOString())

    if (!data) return null

    const expiringPermits = data
      .filter((d) => d.metadata?.type === 'permit' && d.metadata?.permit_status === 'active' && d.metadata?.days_to_expiry && d.metadata.days_to_expiry <= daysAhead)
      .map((d) => ({
        permit_name: d.metadata.permit_name,
        permit_number: d.metadata.permit_number,
        site_id: d.site_id,
        expiry_date: d.metadata.expiry_date,
        days_to_expiry: d.metadata.days_to_expiry,
      }))
      .sort((a, b) => a.days_to_expiry - b.days_to_expiry)

    return expiringPermits
  } catch (error) {
    console.error('Error getting permits expiring soon:', error)
    return null
  }
}

/**
 * Get open non-compliance incidents
 */
export async function getOpenIncidents(
  organizationId: string
): Promise<
  Array<{
    incident_date: string
    incident_type: string
    severity: string
    regulation_violated: string
    resolution_status: string
    site_id?: string
  }> | null
> {
  try {
    const { data } = await getSupabase()
      .from('metrics_data')
      .select('site_id, metadata')
      .eq('organization_id', organizationId)

    if (!data) return null

    const openIncidents = data
      .filter(
        (d) =>
          d.metadata?.incident_type &&
          (d.metadata?.resolution_status === 'open' || d.metadata?.resolution_status === 'in_progress')
      )
      .map((d) => ({
        incident_date: d.metadata.incident_date,
        incident_type: d.metadata.incident_type,
        severity: d.metadata.severity,
        regulation_violated: d.metadata.regulation_violated,
        resolution_status: d.metadata.resolution_status,
        site_id: d.site_id,
      }))
      .sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime())

    return openIncidents
  } catch (error) {
    console.error('Error getting open incidents:', error)
    return null
  }
}
