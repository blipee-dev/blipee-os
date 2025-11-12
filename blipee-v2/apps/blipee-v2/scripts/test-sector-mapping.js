#!/usr/bin/env node
/**
 * Test SBTi Sector Mapping
 * Demonstrates how organization industries map to SBTi pathways
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
)

// Simplified mapping logic (same as TypeScript version)
const GRI_TO_SBTI = {
  'GRI 11': 'oil_gas',
  'GRI 13': 'flag',
}

const INDUSTRY_KEYWORDS = [
  { keywords: ['cement', 'concrete'], sector: 'cement' },
  { keywords: ['steel', 'iron'], sector: 'iron_steel' },
  { keywords: ['aluminum', 'aluminium'], sector: 'aluminum' },
  { keywords: ['paper', 'pulp'], sector: 'pulp_paper' },
  { keywords: ['power', 'electricity', 'renewable energy', 'solar', 'wind'], sector: 'power_generation' },
  { keywords: ['construction', 'building', 'real estate'], sector: 'buildings' },
  { keywords: ['agriculture', 'farming', 'forestry'], sector: 'flag' },
  { keywords: ['oil', 'gas', 'petroleum'], sector: 'oil_gas' },
]

function mapToSBTiSector(org) {
  // Try GRI code
  if (org.gri_sector_code && GRI_TO_SBTI[org.gri_sector_code]) {
    return {
      sector: GRI_TO_SBTI[org.gri_sector_code],
      confidence: 'high',
      method: 'GRI',
    }
  }

  // Try keyword matching
  const texts = [
    org.industry,
    org.industry_primary,
    org.industry_sector,
  ].filter(Boolean)

  for (const text of texts) {
    const lower = text.toLowerCase()
    for (const mapping of INDUSTRY_KEYWORDS) {
      if (mapping.keywords.some((k) => lower.includes(k))) {
        return {
          sector: mapping.sector,
          confidence: 'medium',
          method: 'Keyword',
        }
      }
    }
  }

  return {
    sector: 'cross_sector',
    confidence: 'low',
    method: 'Default',
  }
}

async function testMapping() {
  console.log('🧪 Testing SBTi Sector Mapping\n')
  console.log('=' .repeat(70))

  // Test cases
  const testOrgs = [
    {
      name: 'Global Cement Corp',
      industry: 'Cement Manufacturing',
      gri_sector_code: null,
    },
    {
      name: 'SteelTech Industries',
      industry: 'Iron and Steel Production',
      gri_sector_code: null,
    },
    {
      name: 'Green Power Solutions',
      industry: 'Renewable Energy',
      gri_sector_code: null,
    },
    {
      name: 'Construction & Buildings Ltd',
      industry: 'Real Estate Development',
      gri_sector_code: null,
    },
    {
      name: 'AgriTech Farms',
      industry: 'Agriculture',
      gri_sector_code: 'GRI 13',
    },
    {
      name: 'Tech Software Inc',
      industry: 'Software',
      gri_sector_code: null,
    },
    {
      name: 'Oil & Gas Exploration',
      industry: 'Oil and Gas',
      gri_sector_code: 'GRI 11',
    },
  ]

  console.log('\n📊 Testing Industry → SBTi Sector Mapping:\n')

  for (const org of testOrgs) {
    const mapping = mapToSBTiSector(org)

    console.log(`Organization: ${org.name}`)
    console.log(`  Industry: ${org.industry}`)
    if (org.gri_sector_code) {
      console.log(`  GRI Sector: ${org.gri_sector_code}`)
    }
    console.log(`  → SBTi Sector: ${mapping.sector}`)
    console.log(`  Confidence: ${mapping.confidence} (via ${mapping.method})`)

    // Check if pathway data exists
    const { data: pathways } = await supabase
      .from('sbti_pathways')
      .select('scenario')
      .eq('sector', mapping.sector)
      .limit(1)

    if (pathways && pathways.length > 0) {
      console.log(`  ✅ Pathway data available`)
    } else {
      console.log(`  ⚠️  No pathway data (will use cross_sector)`)
    }

    console.log('')
  }

  // Test with actual database organization
  console.log('\n' + '=' .repeat(70))
  console.log('\n📊 Testing with Actual Organizations:\n')

  const { data: orgs } = await supabase
    .from('organizations')
    .select('name, industry, industry_primary, gri_sector_code')
    .limit(5)

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      const mapping = mapToSBTiSector(org)

      console.log(`Organization: ${org.name}`)
      console.log(`  Industry: ${org.industry || org.industry_primary || 'Not set'}`)
      console.log(`  → SBTi Sector: ${mapping.sector}`)
      console.log(`  Confidence: ${mapping.confidence} (via ${mapping.method})`)

      // Get pathway example
      if (mapping.sector !== 'cross_sector') {
        const { data: example } = await supabase
          .from('sbti_pathways')
          .select('scenario, year, value')
          .eq('sector', mapping.sector)
          .eq('year', 2030)
          .limit(1)
          .single()

        if (example) {
          console.log(`  Example: ${example.scenario} 2030 target = ${example.value} MtCO2`)
        }
      }

      console.log('')
    }
  } else {
    console.log('No organizations found in database')
  }

  // Show pathway coverage
  console.log('\n' + '=' .repeat(70))
  console.log('\n📊 SBTi Pathway Coverage:\n')

  const { data: coverage } = await supabase
    .from('sbti_pathways')
    .select('sector, scenario')
    .order('sector')

  if (coverage) {
    const grouped = coverage.reduce((acc, row) => {
      if (!acc[row.sector]) acc[row.sector] = new Set()
      acc[row.sector].add(row.scenario)
      return acc
    }, {})

    Object.entries(grouped).forEach(([sector, scenarios]) => {
      console.log(`${sector}:`)
      Array.from(scenarios).forEach((scenario) => {
        console.log(`  ✓ ${scenario}`)
      })
    })
  }

  console.log('\n✅ Sector mapping test complete!')
  console.log('\n💡 Key Insights:')
  console.log('   • Organizations automatically mapped to correct SBTi pathway')
  console.log('   • GRI sector codes → Highest confidence mapping')
  console.log('   • Industry keywords → Medium confidence mapping')
  console.log('   • Default: cross_sector (universal pathway)')
  console.log('')
}

testMapping()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
