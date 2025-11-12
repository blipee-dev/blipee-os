/**
 * SBTi Calculator Engine
 * Validates targets and calculates reduction pathways based on SBTi criteria
 * Supports both near-term (5-10 years) and long-term (net-zero ≤2050) targets
 */

import { createClient } from '@/lib/supabase/v2/server'

// ============================================================================
// TYPES
// ============================================================================

export type TargetType = 'near_term' | 'long_term'
export type TargetScope = 'scope1' | 'scope1_2' | 'scope3' | 'scope1_2_3'
export type TargetMethod = 'absolute_contraction' | 'sda' | 're_procurement' | 'physical_intensity' | 'economic_intensity'
export type AmbitionLevel = '1.5C' | 'well_below_2C' | '2C'
export type Sector = 'cross_sector' | 'buildings' | 'flag' | 'power_generation' | 'cement' | 'iron_steel' | 'aluminum' | 'pulp_paper' | 'transport' | 'financial_institutions' | 'oil_gas'

export interface EmissionsInventory {
  scope1: number
  scope2_location: number
  scope2_market: number
  scope3: number
  scope3_categories?: Record<string, number>  // category_1: 30000, category_2: 5000, ...
  biogenic_net: number

  // For sector threshold checks
  flag_emissions?: number
  buildings_emissions?: number
  transport_emissions?: number
  power_revenue?: number
  total_revenue?: number
  is_cement_manufacturer?: boolean
  is_steel_manufacturer?: boolean
  is_oil_gas_distributor?: boolean
}

export interface TargetInput {
  organizationId: string
  targetType: TargetType
  scope: TargetScope
  method: TargetMethod
  baseYear: number
  targetYear: number
  ambition: AmbitionLevel
  sector?: Sector

  // Emissions
  baseYearEmissions: EmissionsInventory

  // Coverage
  coverage: {
    scope1_2_pct: number
    scope3_pct: number
  }

  // Activity data (for intensity methods)
  activityData?: {
    metric: string  // 'revenue', 'production', 'floor_area', 'mwh'
    unit: string
    baseYear: number
    targetYear: number
  }

  // Neutralization (for net-zero)
  neutralizationPlan?: {
    residualEmissions: number
    method: string
    volume: number
    permanence: string
  }
}

export interface ValidationResult {
  isValid: boolean
  criteriaResults: CriterionCheck[]
  errors: string[]
  warnings: string[]
  score: number  // Percentage of criteria passed
}

export interface CriterionCheck {
  code: string
  name: string
  status: 'pass' | 'fail' | 'warning' | 'not_applicable'
  message: string
  metadata?: Record<string, any>
}

export interface PathwayCalculation {
  requiredReductionPercentage: number
  targetYearEmissions: number
  annualReductionRate: number
  pathwayComparison: {
    companyTrajectory: TimeSeriesPoint[]
    sbtiPathway: TimeSeriesPoint[]
    variance: TimeSeriesPoint[]
  }
  compliant: boolean
  shortfall?: number
}

export interface TimeSeriesPoint {
  year: number
  emissions: number
  reductionFromBasePct?: number
}

export interface SectorRequirement {
  applies: boolean
  thresholdMet?: boolean
  percentage?: number
  requirement?: string
}

export interface SectorRequirements {
  flag: SectorRequirement
  buildings: SectorRequirement
  power: SectorRequirement
  cement: SectorRequirement
  steel: SectorRequirement
  transport: SectorRequirement
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Main validation function - checks all applicable SBTi criteria
 */
export async function validateTarget(input: TargetInput): Promise<ValidationResult> {
  const checks: CriterionCheck[] = []

  // C6: Coverage thresholds
  checks.push(checkCoverageC6(input))

  // C10: Biogenic accounting
  checks.push(checkBiogenicC10(input))

  // C11: FLAG disaggregation (if applicable)
  const flagCheck = await checkFLAGC11(input)
  if (flagCheck) checks.push(flagCheck)

  // C13: Timeframe
  checks.push(checkTimeframeC13(input))

  // C15: Scope 1+2 ambition
  if (input.scope !== 'scope3') {
    checks.push(checkS12AmbitionC15(input))
  }

  // C18/C22: Scope 3 ambition (differs for near-term vs long-term)
  if (input.scope === 'scope3' || input.scope === 'scope1_2_3') {
    checks.push(checkS3Ambition(input))
  }

  // C22: Fossil fuel sector special requirements
  if (input.baseYearEmissions.is_oil_gas_distributor) {
    checks.push(checkFossilFuelC22(input))
  }

  // C26: Recalculation policy (always pass for new targets)
  checks.push({
    code: 'C26',
    name: 'Recalculation policy',
    status: 'pass',
    message: 'Recalculation policy will be enforced for future changes >5%'
  })

  // C27: Review cycle (always pass for new targets)
  checks.push({
    code: 'C27',
    name: 'Review cycle',
    status: 'pass',
    message: '5-year mandatory review cycle acknowledged'
  })

  // Net-zero specific checks
  if (input.targetType === 'long_term') {
    // C28: Neutralization
    checks.push(checkNeutralizationC28(input))
  }

  // Calculate score
  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.status === 'pass').length
  const score = (passedChecks / totalChecks) * 100

  // Collect errors and warnings
  const errors = checks.filter(c => c.status === 'fail').map(c => `${c.code}: ${c.message}`)
  const warnings = checks.filter(c => c.status === 'warning').map(c => `${c.code}: ${c.message}`)

  const isValid = errors.length === 0

  return {
    isValid,
    criteriaResults: checks,
    errors,
    warnings,
    score
  }
}

/**
 * C6: Check coverage thresholds
 */
function checkCoverageC6(input: TargetInput): CriterionCheck {
  const s12Required = 95
  const s3Required = input.targetType === 'near_term' ? 67 : 90

  const hasS12 = input.scope === 'scope1' || input.scope === 'scope1_2' || input.scope === 'scope1_2_3'
  const hasS3 = input.scope === 'scope3' || input.scope === 'scope1_2_3'

  // Check Scope 1+2 coverage
  if (hasS12 && input.coverage.scope1_2_pct < s12Required) {
    return {
      code: 'C6',
      name: 'Coverage thresholds',
      status: 'fail',
      message: `Scope 1+2 coverage (${input.coverage.scope1_2_pct}%) is below required ${s12Required}%`
    }
  }

  // Check Scope 3 coverage
  if (hasS3 && input.coverage.scope3_pct < s3Required) {
    return {
      code: 'C6',
      name: 'Coverage thresholds',
      status: 'fail',
      message: `Scope 3 coverage (${input.coverage.scope3_pct}%) is below required ${s3Required}% for ${input.targetType}`
    }
  }

  return {
    code: 'C6',
    name: 'Coverage thresholds',
    status: 'pass',
    message: `Coverage meets requirements (S1+2: ${input.coverage.scope1_2_pct}%, S3: ${input.coverage.scope3_pct}%)`
  }
}

/**
 * C10: Check biogenic accounting
 */
function checkBiogenicC10(input: TargetInput): CriterionCheck {
  if (input.baseYearEmissions.biogenic_net === undefined || input.baseYearEmissions.biogenic_net === null) {
    return {
      code: 'C10',
      name: 'Biogenic accounting',
      status: 'fail',
      message: 'Biogenic CO₂ net emissions (releases - removals) must be included'
    }
  }

  return {
    code: 'C10',
    name: 'Biogenic accounting',
    status: 'pass',
    message: `Biogenic CO₂ net emissions included (${input.baseYearEmissions.biogenic_net.toFixed(0)} tCO2e)`
  }
}

/**
 * C11: Check FLAG disaggregation requirement
 */
async function checkFLAGC11(input: TargetInput): Promise<CriterionCheck | null> {
  const totalEmissions = input.baseYearEmissions.scope1 +
                          input.baseYearEmissions.scope2_market +
                          input.baseYearEmissions.scope3

  const flagEmissions = input.baseYearEmissions.flag_emissions || 0
  const flagPercentage = (flagEmissions / totalEmissions) * 100

  // Check if FLAG threshold met (≥20%)
  if (flagPercentage >= 20) {
    return {
      code: 'C11',
      name: 'FLAG disaggregation',
      status: 'warning',
      message: `FLAG emissions (${flagPercentage.toFixed(1)}%) ≥20%. Must set separate FLAG target.`,
      metadata: { flagPercentage, threshold: 20 }
    }
  }

  // Check specific sectors + ≥5%
  const specificFLAGSectors = ['agriculture', 'forestry', 'tobacco', 'food_beverage']
  // TODO: Check if organization is in specific sectors
  // For now, if FLAG ≥5% and sector could be FLAG-related, warn
  if (flagPercentage >= 5 && flagPercentage < 20) {
    return {
      code: 'C11',
      name: 'FLAG disaggregation',
      status: 'warning',
      message: `FLAG emissions (${flagPercentage.toFixed(1)}%). If in agriculture/forestry/tobacco sector, must disaggregate.`,
      metadata: { flagPercentage, threshold: 5 }
    }
  }

  return null  // Not applicable
}

/**
 * C13: Check timeframe
 */
function checkTimeframeC13(input: TargetInput): CriterionCheck {
  // Base year must be ≥2015
  if (input.baseYear < 2015) {
    return {
      code: 'C13',
      name: 'Timeframe',
      status: 'fail',
      message: `Base year (${input.baseYear}) must be ≥2015`
    }
  }

  // Near-term: 5-10 years
  if (input.targetType === 'near_term') {
    const years = input.targetYear - input.baseYear
    if (years < 5 || years > 10) {
      return {
        code: 'C13',
        name: 'Timeframe',
        status: 'fail',
        message: `Near-term target must be 5-10 years. Current: ${years} years (${input.baseYear}-${input.targetYear})`
      }
    }
  }

  // Long-term: ≤2050 (or ≤2040 for Power/Maritime)
  if (input.targetType === 'long_term') {
    const maxYear = (input.sector === 'power_generation') ? 2040 : 2050
    if (input.targetYear > maxYear) {
      return {
        code: 'C13',
        name: 'Timeframe',
        status: 'fail',
        message: `${input.sector} sector long-term target must be ≤${maxYear}. Current: ${input.targetYear}`
      }
    }
  }

  return {
    code: 'C13',
    name: 'Timeframe',
    status: 'pass',
    message: `Timeframe valid: ${input.targetYear - input.baseYear} years (${input.baseYear}-${input.targetYear})`
  }
}

/**
 * C15: Check Scope 1+2 ambition (must be 1.5°C)
 */
function checkS12AmbitionC15(input: TargetInput): CriterionCheck {
  if (input.ambition !== '1.5C') {
    return {
      code: 'C15',
      name: 'Scope 1+2 ambition',
      status: 'fail',
      message: 'Scope 1+2 targets must be aligned with 1.5°C pathway (most ambitious)'
    }
  }

  return {
    code: 'C15',
    name: 'Scope 1+2 ambition',
    status: 'pass',
    message: '1.5°C ambition confirmed for Scope 1+2'
  }
}

/**
 * C18/C22: Check Scope 3 ambition (differs for near-term vs long-term)
 */
function checkS3Ambition(input: TargetInput): CriterionCheck {
  if (input.targetType === 'near_term') {
    // Near-term: minimum well-below 2°C
    if (input.ambition === '2C') {
      return {
        code: 'C18',
        name: 'Scope 3 ambition (near-term)',
        status: 'fail',
        message: 'Scope 3 targets must be at least well-below 2°C (or 1.5°C)'
      }
    }

    return {
      code: 'C18',
      name: 'Scope 3 ambition (near-term)',
      status: 'pass',
      message: `Scope 3 ambition: ${input.ambition}`
    }
  } else {
    // Long-term: must be 1.5°C
    if (input.ambition !== '1.5C') {
      return {
        code: 'C22',
        name: 'Scope 3 ambition (long-term)',
        status: 'fail',
        message: 'Long-term Scope 3 targets must be aligned with 1.5°C'
      }
    }

    return {
      code: 'C22',
      name: 'Scope 3 ambition (long-term)',
      status: 'pass',
      message: '1.5°C ambition confirmed for long-term Scope 3'
    }
  }
}

/**
 * C22: Fossil fuel sector - Category 11 must be 1.5°C
 */
function checkFossilFuelC22(input: TargetInput): CriterionCheck {
  if (input.baseYearEmissions.is_oil_gas_distributor && input.scope !== 'scope1_2') {
    // Check if Category 11 is included and uses 1.5°C
    const cat11 = input.baseYearEmissions.scope3_categories?.['category_11'] || 0

    if (cat11 > 0 && input.ambition !== '1.5C') {
      return {
        code: 'C22',
        name: 'Fossil fuel sector requirement',
        status: 'fail',
        message: 'Oil & gas distributors must set 1.5°C target for Category 11 (use of sold products)'
      }
    }
  }

  return {
    code: 'C22',
    name: 'Fossil fuel sector requirement',
    status: 'pass',
    message: 'Fossil fuel sector requirements met (if applicable)'
  }
}

/**
 * C28: Neutralization requirement for net-zero targets
 */
function checkNeutralizationC28(input: TargetInput): CriterionCheck {
  if (!input.neutralizationPlan) {
    return {
      code: 'C28',
      name: 'Neutralization',
      status: 'fail',
      message: 'Net-zero targets require a neutralization plan for residual emissions'
    }
  }

  // Check permanence (>100 years required)
  const validPermanence = ['>100_years', 'geological_storage', 'mineralization']
  if (!validPermanence.includes(input.neutralizationPlan.permanence)) {
    return {
      code: 'C28',
      name: 'Neutralization',
      status: 'fail',
      message: 'Neutralization must have permanence >100 years (geological storage or mineralization)'
    }
  }

  // Check method is acceptable
  const validMethods = ['DACCS', 'BECCS', 'enhanced_weathering', 'biochar', 'ocean_alkalinity']
  if (!validMethods.includes(input.neutralizationPlan.method)) {
    return {
      code: 'C28',
      name: 'Neutralization',
      status: 'warning',
      message: `Neutralization method "${input.neutralizationPlan.method}" may not be accepted. Recommended: DACCS, BECCS, enhanced_weathering`
    }
  }

  return {
    code: 'C28',
    name: 'Neutralization',
    status: 'pass',
    message: `Neutralization plan confirmed: ${input.neutralizationPlan.volume.toFixed(0)} tCO2e/year via ${input.neutralizationPlan.method}`
  }
}

// ============================================================================
// PATHWAY CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate required reduction pathway based on SBTi scenarios
 */
export async function calculatePathway(input: TargetInput): Promise<PathwayCalculation> {
  const supabase = createClient()

  // Map ambition to scenario
  const scenarioMap: Record<AmbitionLevel, string> = {
    '1.5C': 'SBTi_1.5C',
    'well_below_2C': 'ETP_B2DS',
    '2C': 'ETP_2DS'
  }
  const scenario = scenarioMap[input.ambition]
  const sector = input.sector || 'cross_sector'

  // Get pathway data from database
  const pathway = await getPathwayData(scenario, sector, input.baseYear, input.targetYear)

  // Calculate required reduction rate
  const basePathwayValue = pathway[input.baseYear]
  const targetPathwayValue = pathway[input.targetYear]
  const requiredReductionPercentage = ((basePathwayValue - targetPathwayValue) / basePathwayValue) * 100

  // Calculate company's base year total emissions
  const baseYearTotal = input.baseYearEmissions.scope1 +
                         input.baseYearEmissions.scope2_market +
                         (input.scope === 'scope1_2_3' ? input.baseYearEmissions.scope3 : 0)

  // Apply reduction to company's emissions
  const targetYearEmissions = baseYearTotal * (1 - requiredReductionPercentage / 100)
  const annualReductionRate = (baseYearTotal - targetYearEmissions) / (input.targetYear - input.baseYear)

  // Generate trajectories
  const companyTrajectory = generateTrajectory(baseYearTotal, targetYearEmissions, input.baseYear, input.targetYear, 'linear')
  const sbtiPathway = generatePathwayTrajectory(pathway, input.baseYear, input.targetYear, baseYearTotal / basePathwayValue)

  // Calculate variance
  const variance = companyTrajectory.map((point, index) => ({
    year: point.year,
    emissions: point.emissions - sbtiPathway[index].emissions,
    reductionFromBasePct: ((point.emissions - sbtiPathway[index].emissions) / baseYearTotal) * 100
  }))

  const compliant = targetYearEmissions <= targetPathwayValue
  const shortfall = compliant ? undefined : targetYearEmissions - targetPathwayValue

  return {
    requiredReductionPercentage,
    targetYearEmissions,
    annualReductionRate,
    pathwayComparison: {
      companyTrajectory,
      sbtiPathway,
      variance
    },
    compliant,
    shortfall
  }
}

/**
 * Get pathway data from database with interpolation for missing years
 */
async function getPathwayData(
  scenario: string,
  sector: Sector,
  startYear: number,
  endYear: number
): Promise<Record<number, number>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sbti_pathways')
    .select('year, value')
    .eq('scenario', scenario)
    .eq('sector', sector)
    .eq('metric_type', 'Emissions')
    .gte('year', startYear)
    .lte('year', endYear)
    .order('year')

  if (error || !data) {
    throw new Error(`Failed to fetch pathway data: ${error?.message}`)
  }

  // Convert to map
  const pathway: Record<number, number> = {}
  data.forEach(row => {
    pathway[row.year] = row.value
  })

  // Interpolate missing years
  for (let year = startYear; year <= endYear; year++) {
    if (!pathway[year]) {
      pathway[year] = interpolatePathway(pathway, year)
    }
  }

  return pathway
}

/**
 * Linear interpolation for missing pathway years
 */
function interpolatePathway(pathway: Record<number, number>, year: number): number {
  const years = Object.keys(pathway).map(Number).sort((a, b) => a - b)

  let lowerYear = years[0]
  let upperYear = years[years.length - 1]

  for (const y of years) {
    if (y < year) lowerYear = y
    if (y > year) {
      upperYear = y
      break
    }
  }

  if (lowerYear === upperYear) return pathway[lowerYear]

  const lowerValue = pathway[lowerYear]
  const upperValue = pathway[upperYear]

  const weight = (year - lowerYear) / (upperYear - lowerYear)
  return lowerValue + (upperValue - lowerValue) * weight
}

/**
 * Generate year-by-year emissions trajectory
 */
function generateTrajectory(
  baseEmissions: number,
  targetEmissions: number,
  baseYear: number,
  targetYear: number,
  method: 'linear' | 'exponential'
): TimeSeriesPoint[] {
  const trajectory: TimeSeriesPoint[] = []
  const totalYears = targetYear - baseYear

  for (let year = baseYear; year <= targetYear; year++) {
    const yearsSinceBase = year - baseYear
    let emissions: number

    if (method === 'linear') {
      const yearlyReduction = (baseEmissions - targetEmissions) / totalYears
      emissions = baseEmissions - (yearlyReduction * yearsSinceBase)
    } else {
      const annualRate = Math.pow(targetEmissions / baseEmissions, 1 / totalYears)
      emissions = baseEmissions * Math.pow(annualRate, yearsSinceBase)
    }

    trajectory.push({
      year,
      emissions: Math.round(emissions),
      reductionFromBasePct: ((baseEmissions - emissions) / baseEmissions) * 100
    })
  }

  return trajectory
}

/**
 * Generate trajectory from pathway data (scaled to company size)
 */
function generatePathwayTrajectory(
  pathway: Record<number, number>,
  startYear: number,
  endYear: number,
  scaleFactor: number
): TimeSeriesPoint[] {
  const trajectory: TimeSeriesPoint[] = []

  for (let year = startYear; year <= endYear; year++) {
    const pathwayValue = pathway[year]
    const scaledEmissions = pathwayValue * scaleFactor

    trajectory.push({
      year,
      emissions: Math.round(scaledEmissions)
    })
  }

  return trajectory
}

// ============================================================================
// SECTOR THRESHOLD FUNCTIONS
// ============================================================================

/**
 * Check which sector-specific requirements apply to the organization
 */
export async function checkSectorRequirements(inventory: EmissionsInventory): Promise<SectorRequirements> {
  const totalEmissions = inventory.scope1 + inventory.scope2_market + inventory.scope3

  const requirements: SectorRequirements = {
    flag: { applies: false },
    buildings: { applies: false },
    power: { applies: false },
    cement: { applies: false },
    steel: { applies: false },
    transport: { applies: false }
  }

  // FLAG (≥20%)
  const flagPct = ((inventory.flag_emissions || 0) / totalEmissions) * 100
  if (flagPct >= 20) {
    requirements.flag = {
      applies: true,
      thresholdMet: true,
      percentage: flagPct,
      requirement: 'Must disaggregate FLAG target (C11)'
    }
  }

  // Buildings (≥20%)
  const buildingsPct = ((inventory.buildings_emissions || 0) / totalEmissions) * 100
  if (buildingsPct >= 20) {
    requirements.buildings = {
      applies: true,
      thresholdMet: true,
      percentage: buildingsPct,
      requirement: 'Must use SDA or physical intensity method'
    }
  }

  // Power (≥5% revenue)
  if (inventory.power_revenue && inventory.total_revenue) {
    const powerRevPct = (inventory.power_revenue / inventory.total_revenue) * 100
    if (powerRevPct >= 5) {
      requirements.power = {
        applies: true,
        thresholdMet: true,
        percentage: powerRevPct,
        requirement: 'Can use intensity (tCO2e/MWh) or RE method; long-term ≤2040'
      }
    }
  }

  // Cement
  if (inventory.is_cement_manufacturer) {
    requirements.cement = {
      applies: true,
      thresholdMet: true,
      requirement: 'Must use cement sector pathway'
    }
  }

  // Steel
  if (inventory.is_steel_manufacturer) {
    requirements.steel = {
      applies: true,
      thresholdMet: true,
      requirement: 'Must use iron & steel sector pathway'
    }
  }

  // Transport (≥50%)
  const transportPct = ((inventory.transport_emissions || 0) / totalEmissions) * 100
  if (transportPct >= 50) {
    requirements.transport = {
      applies: true,
      thresholdMet: true,
      percentage: transportPct,
      requirement: 'Can use intensity metric (tCO2e/tkm or pkm)'
    }
  }

  return requirements
}

/**
 * Calculate Scope 3 coverage percentage
 */
export function calculateScope3Coverage(scope3Categories: Record<string, number>): number {
  const totalScope3 = Object.values(scope3Categories).reduce((sum, val) => sum + val, 0)

  // Categories excluded from target (set to 0 or undefined will not count)
  const includedCategories = Object.entries(scope3Categories)
    .filter(([_, value]) => value > 0)

  const includedTotal = includedCategories.reduce((sum, [_, value]) => sum + value, 0)

  if (totalScope3 === 0) return 0
  return (includedTotal / totalScope3) * 100
}

/**
 * Generate target summary for display
 */
export function generateTargetSummary(input: TargetInput, calculation: PathwayCalculation) {
  const baseTotal = input.baseYearEmissions.scope1 +
                     input.baseYearEmissions.scope2_market +
                     (input.scope === 'scope1_2_3' ? input.baseYearEmissions.scope3 : 0)

  return {
    targetType: input.targetType,
    scope: input.scope,
    method: input.method,
    ambition: input.ambition,
    baseYear: input.baseYear,
    targetYear: input.targetYear,
    timeframe: input.targetYear - input.baseYear,

    emissions: {
      base: baseTotal,
      target: calculation.targetYearEmissions,
      reduction: baseTotal - calculation.targetYearEmissions,
      reductionPct: calculation.requiredReductionPercentage
    },

    annual: {
      reductionRate: calculation.annualReductionRate,
      reductionPct: calculation.requiredReductionPercentage / (input.targetYear - input.baseYear)
    },

    coverage: input.coverage,

    compliant: calculation.compliant,
    shortfall: calculation.shortfall
  }
}
