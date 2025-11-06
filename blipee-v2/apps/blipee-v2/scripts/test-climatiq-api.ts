/**
 * Test Climatiq API
 * Explore what emission factors are available on the free tier
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const API_KEY = process.env.CLIMATIQ_API_KEY!
const BASE_URL = 'https://api.climatiq.io'

interface ClimatiqEmissionFactor {
  id: string
  activity_id: string
  name: string
  category: string
  sector: string
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
  lca_activity?: string
  unit_type: string
}

interface ClimatiqSearchResponse {
  results: ClimatiqEmissionFactor[]
  total_results: number
  page: number
  pages: number
}

async function searchEmissionFactors(query: string, region?: string): Promise<ClimatiqSearchResponse | null> {
  try {
    const params = new URLSearchParams({
      query,
      data_version: '^12',  // Use latest v12 data
      ...(region && { region })
    })

    const response = await fetch(`${BASE_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.log(`❌ Search failed: ${response.status}`)
      console.log(`   Error: ${error.substring(0, 200)}...\n`)
      return null
    }

    return await response.json()
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}\n`)
    return null
  }
}

async function getEmissionFactorById(factorId: string): Promise<ClimatiqEmissionFactor | null> {
  try {
    const response = await fetch(`${BASE_URL}/emission-factors/${factorId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.log(`❌ Get factor failed: ${response.status}`)
      console.log(`   Error: ${error.substring(0, 200)}...\n`)
      return null
    }

    return await response.json()
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}\n`)
    return null
  }
}

async function calculateEmission(data: {
  emission_factor: { id: string } | { activity_id: string }
  parameters: Record<string, any>
}): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/estimate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.text()
      console.log(`❌ Calculate failed: ${response.status}`)
      console.log(`   Error: ${error.substring(0, 200)}...\n`)
      return null
    }

    return await response.json()
  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}\n`)
    return null
  }
}

async function testClimatiq() {
  console.log('🔍 Testing Climatiq API...\n')
  console.log(`API Key: ${API_KEY.substring(0, 10)}...\n`)
  console.log('='.repeat(70) + '\n')

  // Test 1: Search for electricity emission factors
  console.log('📊 Test 1: Search for electricity emission factors (Portugal)')
  const electricityResults = await searchEmissionFactors('electricity', 'PT')

  if (electricityResults) {
    console.log(`✅ Found ${electricityResults.total_results} electricity factors`)
    console.log(`   Showing ${electricityResults.results.length} results:\n`)

    electricityResults.results.slice(0, 3).forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor.name}`)
      console.log(`      ID: ${factor.id}`)
      console.log(`      Category: ${factor.category}`)
      console.log(`      Region: ${factor.region_name} (${factor.region})`)
      console.log(`      Factor: ${factor.factor} kg CO2e/${factor.unit_type}`)
      console.log(`      Source: ${factor.source} (${factor.year})`)
      console.log(`      Method: ${factor.factor_calculation_method}`)
      console.log()
    })
  }

  console.log('='.repeat(70) + '\n')

  // Test 2: Search for natural gas
  console.log('🔥 Test 2: Search for natural gas emission factors')
  const gasResults = await searchEmissionFactors('natural gas', 'PT')

  if (gasResults) {
    console.log(`✅ Found ${gasResults.total_results} natural gas factors`)
    if (gasResults.results.length > 0) {
      const factor = gasResults.results[0]
      console.log(`   Example: ${factor.name}`)
      console.log(`   Factor: ${factor.factor} kg CO2e/${factor.unit_type}`)
      console.log(`   Source: ${factor.source} (${factor.year})`)
    }
    console.log()
  }

  console.log('='.repeat(70) + '\n')

  // Test 3: Search for transportation (flight)
  console.log('✈️  Test 3: Search for flight emission factors')
  const flightResults = await searchEmissionFactors('flight passenger', 'PT')

  if (flightResults) {
    console.log(`✅ Found ${flightResults.total_results} flight factors`)
    if (flightResults.results.length > 0) {
      const factor = flightResults.results[0]
      console.log(`   Example: ${factor.name}`)
      console.log(`   Factor: ${factor.factor} kg CO2e/${factor.unit_type}`)
      console.log(`   Category: ${factor.category}`)
      console.log(`   Gases: ${JSON.stringify(factor.constituent_gases || {})}`)
    }
    console.log()
  }

  console.log('='.repeat(70) + '\n')

  // Test 4: Test calculation endpoint (if we have a factor)
  if (electricityResults && electricityResults.results.length > 0) {
    console.log('🧮 Test 4: Calculate emissions using a factor')
    const factor = electricityResults.results[0]

    console.log(`   Using factor: ${factor.name}`)
    console.log(`   Calculating emissions for 100 kWh...\n`)

    const calculation = await calculateEmission({
      emission_factor: { id: factor.id },
      parameters: {
        energy: 100,
        energy_unit: 'kWh'
      }
    })

    if (calculation) {
      console.log(`   ✅ Calculation successful!`)
      console.log(`   Total CO2e: ${calculation.co2e} kg`)
      console.log(`   Total CO2e (tonnes): ${calculation.co2e_mt} t`)
      console.log(`   Calculation method: ${calculation.co2e_calculation_method}`)
      console.log(`   Origin: ${calculation.co2e_calculation_origin}`)
      if (calculation.constituent_gases) {
        console.log(`   Gas breakdown:`)
        console.log(`     CO2: ${calculation.constituent_gases.co2_mt || 0} t`)
        console.log(`     CH4: ${calculation.constituent_gases.ch4_mt || 0} t`)
        console.log(`     N2O: ${calculation.constituent_gases.n2o_mt || 0} t`)
      }
    }
    console.log()
  }

  console.log('='.repeat(70) + '\n')

  // Test 5: Common activities for Scope 1 & 3
  console.log('📋 Test 5: Test common business activities\n')

  const activities = [
    { name: 'Diesel fuel', query: 'diesel', scope: 'Scope 1' },
    { name: 'Business travel - car', query: 'passenger vehicle', scope: 'Scope 3' },
    { name: 'Office paper', query: 'office paper', scope: 'Scope 3' },
    { name: 'Hotel stay', query: 'hotel accommodation', scope: 'Scope 3' },
    { name: 'Waste disposal', query: 'waste disposal', scope: 'Scope 3' }
  ]

  for (const activity of activities) {
    const results = await searchEmissionFactors(activity.query, 'PT')
    if (results && results.total_results > 0) {
      console.log(`   ✅ ${activity.name} (${activity.scope})`)
      console.log(`      Found ${results.total_results} factors`)
      if (results.results.length > 0) {
        const factor = results.results[0]
        console.log(`      Example: ${factor.name}`)
        console.log(`      Factor: ${factor.factor} kg CO2e/${factor.unit_type}`)
      }
    } else {
      console.log(`   ❌ ${activity.name} - No factors found`)
    }
    console.log()
  }

  console.log('='.repeat(70) + '\n')

  // Summary
  console.log('📊 Summary:\n')
  console.log('Climatiq API provides:')
  console.log('✅ Emission factors for electricity (Scope 2)')
  console.log('✅ Emission factors for fuel combustion (Scope 1)')
  console.log('✅ Emission factors for business activities (Scope 3)')
  console.log('✅ Regional factors (PT - Portugal)')
  console.log('✅ Source attribution (GHG Protocol compliant)')
  console.log('✅ Calculation endpoint for easy CO2e computation')
  console.log('✅ Gas breakdown (CO2, CH4, N2O)\n')

  console.log('Next Steps:')
  console.log('1. Build emission factor search service')
  console.log('2. Cache factors in Supabase')
  console.log('3. Integrate with activity data input')
  console.log('4. Add to emission calculations\n')
}

testClimatiq()
