require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGRICoverage() {
  console.log('🔍 Checking GRI coverage in our database...\n')

  // 1. Get all disclosures from official template
  const filePath = '/Users/pedro/Downloads/gri-content-index-template-2021.xlsx'
  const workbook = XLSX.readFile(filePath)
  const worksheet = workbook.Sheets['1. Content index in accordance']
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  const disclosurePattern = /(\d+-\d+(?:[a-z])?(?:-[ivxlcdm]+)?)/gi
  const officialDisclosures = new Set()

  data.forEach((row) => {
    const rowText = row.join(' ')
    const matches = rowText.match(disclosurePattern)
    if (matches) {
      matches.forEach(disclosure => {
        const cleaned = disclosure.trim()
        if (cleaned.match(/^\d+-\d+/)) {
          officialDisclosures.add(cleaned)
        }
      })
    }
  })

  console.log(`📋 Official GRI template: ${officialDisclosures.size} disclosures\n`)

  // 2. Get all our metrics
  const { data: ourMetrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, subcategory, is_calculated')
    .eq('is_active', true)

  if (metricsError) {
    console.error('❌ Error fetching metrics:', metricsError)
    return
  }

  if (!ourMetrics || ourMetrics.length === 0) {
    console.error('❌ No metrics found in database')
    return
  }

  console.log(`📊 Our database: ${ourMetrics.length} metrics`)
  console.log(`   └─ Base metrics: ${ourMetrics.filter(m => !m.is_calculated).length}\n`)

  // 3. Extract GRI references from our metrics
  // Our metrics use codes like: gri_302_1_electricity_consumption
  const ourGRIDisclosures = new Set()
  const metricsByDisclosure = new Map()

  ourMetrics.forEach(metric => {
    // Match patterns like gri_302_1, gri_305_2, etc.
    const griMatch = metric.code.match(/gri_(\d+)_(\d+)/)
    if (griMatch) {
      const disclosure = `${griMatch[1]}-${griMatch[2]}`
      ourGRIDisclosures.add(disclosure)

      if (!metricsByDisclosure.has(disclosure)) {
        metricsByDisclosure.set(disclosure, [])
      }
      metricsByDisclosure.get(disclosure).push(metric)
    }
  })

  console.log(`🎯 GRI disclosures we have metrics for: ${ourGRIDisclosures.size}\n`)

  // 4. Find gaps
  const missingDisclosures = []
  const coveredDisclosures = []

  Array.from(officialDisclosures).sort((a, b) => {
    const [aStd, aNum] = a.split('-').map(n => parseInt(n))
    const [bStd, bNum] = b.split('-').map(n => parseInt(n))
    if (aStd !== bStd) return aStd - bStd
    return aNum - bNum
  }).forEach(disclosure => {
    if (ourGRIDisclosures.has(disclosure)) {
      coveredDisclosures.push(disclosure)
    } else {
      missingDisclosures.push(disclosure)
    }
  })

  // 5. Show results by category
  console.log('━'.repeat(80))
  console.log('📊 COVERAGE BY GRI STANDARD:\n')

  const groupByStandard = (disclosures) => {
    const groups = new Map()
    disclosures.forEach(d => {
      const [std] = d.split('-')
      if (!groups.has(std)) groups.set(std, [])
      groups.get(std).push(d)
    })
    return groups
  }

  const coveredByStd = groupByStandard(coveredDisclosures)
  const missingByStd = groupByStandard(missingDisclosures)

  // Get all unique standards
  const allStandards = new Set([...coveredByStd.keys(), ...missingByStd.keys()])

  // GRI standard descriptions
  const stdDescriptions = {
    '2': 'General Disclosures',
    '3': 'Material Topics',
    '201': 'Economic Performance',
    '202': 'Market Presence',
    '203': 'Indirect Economic Impacts',
    '204': 'Procurement Practices',
    '205': 'Anti-corruption',
    '206': 'Anti-competitive Behavior',
    '207': 'Tax',
    '301': 'Materials',
    '302': 'Energy',
    '303': 'Water and Effluents',
    '304': 'Biodiversity',
    '305': 'Emissions',
    '306': 'Waste',
    '308': 'Supplier Environmental Assessment',
    '401': 'Employment',
    '402': 'Labor/Management Relations',
    '403': 'Occupational Health and Safety',
    '404': 'Training and Education',
    '405': 'Diversity and Equal Opportunity',
    '406': 'Non-discrimination',
    '407': 'Freedom of Association',
    '408': 'Child Labor',
    '409': 'Forced or Compulsory Labor',
    '410': 'Security Practices',
    '411': 'Rights of Indigenous Peoples',
    '413': 'Local Communities',
    '414': 'Supplier Social Assessment',
    '415': 'Public Policy',
    '416': 'Customer Health and Safety',
    '417': 'Marketing and Labeling',
    '418': 'Customer Privacy'
  }

  Array.from(allStandards).sort((a, b) => parseInt(a) - parseInt(b)).forEach(std => {
    const covered = coveredByStd.get(std) || []
    const missing = missingByStd.get(std) || []
    const total = covered.length + missing.length
    const percentage = total > 0 ? Math.round((covered.length / total) * 100) : 0

    const icon = percentage === 100 ? '✅' : percentage >= 50 ? '🟡' : '❌'
    const description = stdDescriptions[std] || 'Unknown'

    console.log(`${icon} GRI ${std}: ${description}`)
    console.log(`   Coverage: ${covered.length}/${total} (${percentage}%)`)

    if (covered.length > 0) {
      console.log(`   ✅ Have: ${covered.join(', ')}`)
    }
    if (missing.length > 0) {
      console.log(`   ❌ Missing: ${missing.join(', ')}`)
    }
    console.log()
  })

  // 6. Summary
  console.log('━'.repeat(80))
  console.log('📈 OVERALL SUMMARY:\n')

  const coveragePercentage = Math.round((coveredDisclosures.length / officialDisclosures.size) * 100)

  console.log(`   Total GRI disclosures: ${officialDisclosures.size}`)
  console.log(`   ✅ Covered: ${coveredDisclosures.length} (${coveragePercentage}%)`)
  console.log(`   ❌ Missing: ${missingDisclosures.length} (${100 - coveragePercentage}%)`)

  // Show which standards we have full coverage for
  console.log('\n   🎯 Full coverage (100%) for:')
  Array.from(allStandards).sort((a, b) => parseInt(a) - parseInt(b)).forEach(std => {
    const covered = (coveredByStd.get(std) || []).length
    const missing = (missingByStd.get(std) || []).length
    const total = covered + missing
    if (total > 0 && missing === 0) {
      console.log(`      ✅ GRI ${std}: ${stdDescriptions[std]}`)
    }
  })

  // Show which we're missing entirely
  console.log('\n   ⚠️  No coverage (0%) for:')
  Array.from(allStandards).sort((a, b) => parseInt(a) - parseInt(b)).forEach(std => {
    const covered = (coveredByStd.get(std) || []).length
    if (covered === 0) {
      console.log(`      ❌ GRI ${std}: ${stdDescriptions[std]}`)
    }
  })

  // 7. Show sample of what we have for covered standards
  console.log('\n\n━'.repeat(80))
  console.log('📋 SAMPLE: What metrics we have for covered disclosures\n')

  // Show a few examples
  const samples = ['302-1', '303-3', '305-1', '305-2', '306-3']
  samples.forEach(disclosure => {
    const metrics = metricsByDisclosure.get(disclosure)
    if (metrics && metrics.length > 0) {
      console.log(`\n🔹 GRI ${disclosure}:`)
      console.log(`   We have ${metrics.length} metrics:`)
      metrics.slice(0, 5).forEach(m => {
        console.log(`      - ${m.code}: ${m.name}`)
      })
      if (metrics.length > 5) {
        console.log(`      ... and ${metrics.length - 5} more`)
      }
    }
  })
}

checkGRICoverage().catch(console.error)
