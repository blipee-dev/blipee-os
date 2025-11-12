#!/usr/bin/env node
/**
 * Test SBTi Pathways Data
 * Verifies pathway data is correctly imported and can be used for calculations
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
)

async function testPathways() {
  console.log('🧪 Testing SBTi Pathway Data...\n')

  // Test 1: Get pathway data for cement sector (1.5°C scenario)
  console.log('📊 Test 1: Cement Sector Pathway (SBTi 1.5°C)')
  console.log('=' .repeat(60))

  const { data: cementData, error: cementError } = await supabase
    .from('sbti_pathways')
    .select('year, value')
    .eq('sector', 'cement')
    .eq('scenario', 'SBTi_1.5C')
    .order('year', { ascending: true })

  if (cementError) {
    console.error('❌ Error:', cementError.message)
    return
  }

  console.log(`✅ Retrieved ${cementData.length} data points`)
  console.log('\nKey milestones:')
  const milestones = [2020, 2025, 2030, 2040, 2050]
  milestones.forEach((year) => {
    const dataPoint = cementData.find((d) => d.year === year)
    if (dataPoint) {
      console.log(`   ${year}: ${dataPoint.value.toFixed(0)} MtCO2`)
    }
  })

  // Calculate reduction from 2020 to 2050
  const year2020 = cementData.find((d) => d.year === 2020)
  const year2050 = cementData.find((d) => d.year === 2050)

  if (year2020 && year2050) {
    const reduction = ((year2020.value - year2050.value) / year2020.value) * 100
    console.log(`\n💡 Total reduction 2020→2050: ${reduction.toFixed(1)}%`)
  }

  // Test 2: Calculate target for a company
  console.log('\n\n📊 Test 2: Company Target Calculation')
  console.log('=' .repeat(60))

  // Sample company: Cement manufacturer
  const companyData = {
    sector: 'cement',
    baseYear: 2020,
    targetYear: 2030,
    baseYearEmissions: 50000, // tCO2e (50 ktCO2)
    scenario: 'SBTi_1.5C',
  }

  console.log('Company profile:')
  console.log(`   Sector: ${companyData.sector}`)
  console.log(`   Base year: ${companyData.baseYear}`)
  console.log(`   Target year: ${companyData.targetYear}`)
  console.log(`   Base year emissions: ${companyData.baseYearEmissions.toLocaleString()} tCO2e`)
  console.log(`   Scenario: ${companyData.scenario}`)

  // Get pathway values
  const { data: pathwayData, error: pathwayError } = await supabase
    .from('sbti_pathways')
    .select('year, value')
    .eq('sector', companyData.sector)
    .eq('scenario', companyData.scenario)
    .in('year', [companyData.baseYear, companyData.targetYear])

  if (pathwayError) {
    console.error('❌ Error:', pathwayError.message)
    return
  }

  const basePathway = pathwayData.find((d) => d.year === companyData.baseYear)
  const targetPathway = pathwayData.find((d) => d.year === companyData.targetYear)

  if (!basePathway || !targetPathway) {
    console.error('❌ Missing pathway data')
    return
  }

  console.log('\nPathway values (global):')
  console.log(`   ${companyData.baseYear}: ${basePathway.value.toFixed(0)} MtCO2`)
  console.log(`   ${companyData.targetYear}: ${targetPathway.value.toFixed(0)} MtCO2`)

  // Calculate required reduction
  const pathwayReduction = ((basePathway.value - targetPathway.value) / basePathway.value) * 100
  console.log(`\nRequired reduction (pathway): ${pathwayReduction.toFixed(1)}%`)

  // Apply to company
  const companyTargetEmissions =
    companyData.baseYearEmissions * (1 - pathwayReduction / 100)

  console.log('\n🎯 Company SBTi Target:')
  console.log(`   Target year emissions: ${companyTargetEmissions.toFixed(0).toLocaleString()} tCO2e`)
  console.log(`   Absolute reduction: ${(companyData.baseYearEmissions - companyTargetEmissions).toFixed(0).toLocaleString()} tCO2e`)
  console.log(`   Reduction percentage: ${pathwayReduction.toFixed(1)}%`)

  // Validation
  const yearsToTarget = companyData.targetYear - companyData.baseYear
  if (yearsToTarget >= 5 && yearsToTarget <= 10) {
    console.log('   ✅ Timeframe: Valid (5-10 years)')
  } else {
    console.log('   ❌ Timeframe: Invalid (must be 5-10 years)')
  }

  // Test 3: Available sectors and scenarios
  console.log('\n\n📊 Test 3: Available Data Coverage')
  console.log('=' .repeat(60))

  const { data: coverage, error: coverageError } = await supabase
    .from('sbti_pathways')
    .select('scenario, sector')
    .order('scenario')
    .order('sector')

  if (coverageError) {
    console.error('❌ Error:', coverageError.message)
    return
  }

  // Group by scenario
  const grouped = coverage.reduce((acc, row) => {
    if (!acc[row.scenario]) acc[row.scenario] = new Set()
    acc[row.scenario].add(row.sector)
    return acc
  }, {})

  Object.entries(grouped).forEach(([scenario, sectors]) => {
    console.log(`\n${scenario}:`)
    Array.from(sectors)
      .sort()
      .forEach((sector) => {
        console.log(`   ✓ ${sector}`)
      })
  })

  // Test 4: Criteria check
  console.log('\n\n📊 Test 4: SBTi Criteria Database')
  console.log('=' .repeat(60))

  const { data: criteria, error: criteriaError } = await supabase
    .from('sbti_criteria')
    .select('criteria_type, criterion_code, criterion_name')
    .order('criterion_code')

  if (criteriaError) {
    console.error('❌ Error:', criteriaError.message)
    return
  }

  const nearTerm = criteria.filter((c) => c.criteria_type === 'near_term')
  const longTerm = criteria.filter((c) => c.criteria_type === 'long_term')

  console.log(`\nNear-term criteria: ${nearTerm.length}`)
  console.log('Sample criteria:')
  nearTerm.slice(0, 5).forEach((c) => {
    console.log(`   ${c.criterion_code}: ${c.criterion_name}`)
  })

  console.log(`\nLong-term criteria: ${longTerm.length}`)
  longTerm.forEach((c) => {
    console.log(`   ${c.criterion_code}: ${c.criterion_name}`)
  })

  console.log('\n\n✅ All tests completed successfully!')
  console.log('=' .repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   • Total pathways: ${coverage.length} data points`)
  console.log(`   • Scenarios: ${Object.keys(grouped).length}`)
  console.log(`   • Sectors covered: ${new Set(coverage.map((r) => r.sector)).size}`)
  console.log(`   • Validation criteria: ${criteria.length}`)
  console.log('\n🚀 SBTi system is ready for use!')
}

// Run tests
testPathways()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
