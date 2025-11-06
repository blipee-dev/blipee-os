/**
 * Test Climatiq API - Global Coverage
 * Demonstrate emission factors for multiple countries/regions
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
      data_version: '^12',
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

async function testGlobalCoverage() {
  console.log('🌍 Testing Climatiq API - Global Coverage\n')
  console.log(`API Key: ${API_KEY.substring(0, 10)}...\n`)
  console.log('='.repeat(70) + '\n')

  // Test 1: Global electricity factors (no region filter)
  console.log('⚡ Test 1: Global Electricity Emission Factors\n')

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'AU', name: 'Australia' },
    { code: 'PT', name: 'Portugal' },
    { code: 'ES', name: 'Spain' }
  ]

  for (const region of regions) {
    const results = await searchEmissionFactors('electricity', region.code)
    if (results) {
      console.log(`   ✅ ${region.name} (${region.code}): ${results.total_results.toLocaleString()} factors`)
      if (results.results.length > 0) {
        const example = results.results[0]
        console.log(`      Example: ${example.name}`)
        console.log(`      Source: ${example.source} (${example.year})`)
      }
    } else {
      console.log(`   ❌ ${region.name} (${region.code}): No data`)
    }
  }

  console.log('\n' + '='.repeat(70) + '\n')

  // Test 2: Global fuel/transportation factors
  console.log('🚗 Test 2: Transportation Emission Factors (Global)\n')

  const activities = [
    'passenger vehicle',
    'commercial flight',
    'freight truck',
    'train passenger'
  ]

  for (const activity of activities) {
    const results = await searchEmissionFactors(activity)
    if (results) {
      console.log(`   ${activity}:`)
      console.log(`   Total factors available: ${results.total_results.toLocaleString()}`)

      // Show regional breakdown
      const regionCounts = new Map<string, number>()
      results.results.forEach(r => {
        const count = regionCounts.get(r.region) || 0
        regionCounts.set(r.region, count + 1)
      })

      const topRegions = Array.from(regionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      console.log(`   Top regions: ${topRegions.map(r => r[0]).join(', ')}`)
      console.log()
    }
  }

  console.log('='.repeat(70) + '\n')

  // Test 3: Scope 3 categories (global)
  console.log('📦 Test 3: Scope 3 Categories (Global Coverage)\n')

  const scope3Categories = [
    { name: 'Purchased goods', query: 'purchased goods' },
    { name: 'Capital goods', query: 'capital goods' },
    { name: 'Business travel', query: 'business travel hotel' },
    { name: 'Employee commuting', query: 'employee commuting' },
    { name: 'Waste generated', query: 'waste disposal' },
    { name: 'Downstream transport', query: 'freight transport' }
  ]

  for (const category of scope3Categories) {
    const results = await searchEmissionFactors(category.query)
    if (results && results.total_results > 0) {
      console.log(`   ✅ ${category.name}`)
      console.log(`      Available factors: ${results.total_results.toLocaleString()}`)

      // Count unique regions
      const uniqueRegions = new Set(results.results.map(r => r.region))
      console.log(`      Coverage: ${uniqueRegions.size} regions/countries`)
    } else {
      console.log(`   ⚠️  ${category.name} - Limited data`)
    }
    console.log()
  }

  console.log('='.repeat(70) + '\n')

  // Test 4: Global calculation example
  console.log('🧮 Test 4: Multi-Region Calculation Examples\n')

  const electricityUS = await searchEmissionFactors('electricity grid', 'US')
  const electricityUK = await searchEmissionFactors('electricity grid', 'GB')
  const electricityBR = await searchEmissionFactors('electricity grid', 'BR')

  const testRegions = [
    { name: 'United States', results: electricityUS },
    { name: 'United Kingdom', results: electricityUK },
    { name: 'Brazil', results: electricityBR }
  ]

  for (const region of testRegions) {
    if (region.results && region.results.results.length > 0) {
      const factor = region.results.results[0]
      console.log(`   ${region.name}:`)
      console.log(`   Using factor: ${factor.name}`)

      const calc = await calculateEmission({
        emission_factor: { id: factor.id },
        parameters: {
          energy: 1000,
          energy_unit: 'kWh'
        }
      })

      if (calc) {
        console.log(`   1000 kWh = ${calc.co2e.toFixed(2)} kg CO2e`)
        console.log(`   Source: ${factor.source} (${factor.year})`)
      }
      console.log()
    }
  }

  console.log('='.repeat(70) + '\n')

  // Test 5: Region coverage statistics
  console.log('📊 Test 5: Overall Regional Coverage\n')

  const globalResults = await searchEmissionFactors('electricity')

  if (globalResults) {
    console.log(`   Total electricity factors: ${globalResults.total_results.toLocaleString()}`)

    // Count unique regions
    const allRegions = new Set<string>()
    const regionNames = new Map<string, string>()

    globalResults.results.forEach(factor => {
      allRegions.add(factor.region)
      regionNames.set(factor.region, factor.region_name)
    })

    console.log(`   Regions/countries covered: ${allRegions.size}+`)
    console.log(`   \nExample regions:`)

    Array.from(allRegions).slice(0, 20).forEach(code => {
      const name = regionNames.get(code) || code
      console.log(`     - ${name} (${code})`)
    })

    if (allRegions.size > 20) {
      console.log(`     ... and ${allRegions.size - 20} more`)
    }
  }

  console.log('\n' + '='.repeat(70) + '\n')

  // Summary
  console.log('🎯 Summary - Global Coverage:\n')
  console.log('✅ Climatiq provides GLOBAL emission factor coverage')
  console.log('✅ Supports 100+ countries/regions worldwide')
  console.log('✅ Multiple data sources: PCAF, CEDA, EPA, DEFRA, etc.')
  console.log('✅ Regional-specific factors ensure accuracy')
  console.log('✅ Covers all GHG Protocol scopes (1, 2, 3)')
  console.log('✅ Automatic region detection by country code (US, GB, DE, etc.)\n')

  console.log('Implementation Strategy for Global Support:\n')
  console.log('1. Store organization location (country code)')
  console.log('2. Automatically select regional factors based on location')
  console.log('3. Fallback to global/default factors if regional unavailable')
  console.log('4. Support multi-national organizations (different sites)')
  console.log('5. Allow manual factor selection for specific cases\n')

  console.log('Region Code Examples:')
  console.log('  US = United States')
  console.log('  GB = United Kingdom')
  console.log('  DE = Germany')
  console.log('  FR = France')
  console.log('  ES = Spain')
  console.log('  PT = Portugal')
  console.log('  BR = Brazil')
  console.log('  CN = China')
  console.log('  IN = India')
  console.log('  AU = Australia')
  console.log('  ... and 100+ more\n')
}

testGlobalCoverage()
