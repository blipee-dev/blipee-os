const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWasteByType() {
  console.log('🗑️  Checking Waste By Type\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Get sample of 2025 waste metrics with metadata
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      metadata,
      period_start,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .limit(20)

  const waste2025 = data2025.filter((m) => {
    const code = m.metric?.code || ''
    return code.includes('scope3_waste')
  })

  console.log(`📊 Sample of ${waste2025.length} waste metrics:\n`)
  console.log('='.repeat(80))

  waste2025.forEach(m => {
    console.log(`\nMetric: ${m.metric?.code}`)
    console.log(`  Value: ${m.value} kg`)
    console.log(`  Metadata: ${JSON.stringify(m.metadata, null, 2)}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 ANALYSIS:\n')

  // Check if metadata.waste_type exists
  const withWasteType = waste2025.filter(m => m.metadata?.waste_type)
  const withoutWasteType = waste2025.filter(m => !m.metadata?.waste_type)

  console.log(`Metrics WITH metadata.waste_type: ${withWasteType.length}`)
  console.log(`Metrics WITHOUT metadata.waste_type: ${withoutWasteType.length}`)

  if (withoutWasteType.length > 0) {
    console.log('\n⚠️  Metrics are missing waste_type in metadata!')
    console.log('Need to extract type from metric code instead.\n')

    console.log('Example type extraction from metric codes:')
    const typeExamples = new Map()

    withoutWasteType.slice(0, 10).forEach(m => {
      const code = m.metric?.code || ''

      // Extract type from scope3_waste_* code
      let type = 'Other'

      if (code.includes('_recycling_')) {
        const match = code.match(/scope3_waste_recycling_(\w+)/)
        if (match) type = `Recycling - ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`
      } else if (code.includes('_composting_')) {
        const match = code.match(/scope3_waste_composting_(\w+)/)
        if (match) type = `Composting - ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`
      } else if (code.includes('_landfill')) {
        type = 'Landfill'
      } else if (code.includes('_incineration')) {
        type = 'Incineration'
      } else if (code.includes('_ewaste')) {
        type = 'E-Waste'
      }

      typeExamples.set(code, type)
    })

    typeExamples.forEach((type, code) => {
      console.log(`  ${code} → ${type}`)
    })
  } else {
    console.log('\n✅ All metrics have waste_type in metadata!')
  }

  // Get all waste data and categorize by type
  const { data: allData } = await supabase
    .from('metrics_data')
    .select(`
      value,
      metadata,
      metric:metrics_catalog(code)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')

  const allWaste = allData.filter((m) => {
    const code = m.metric?.code || ''
    return code.includes('scope3_waste')
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n📈 WASTE BY TYPE BREAKDOWN (All 2025 Data):\n')

  const byType = new Map()

  allWaste.forEach(m => {
    const code = m.metric?.code || ''
    const value = m.value || 0

    // Extract type from code
    let type = m.metadata?.waste_type || 'Other'

    if (!m.metadata?.waste_type) {
      if (code.includes('_recycling_paper')) {
        type = 'Paper'
      } else if (code.includes('_recycling_plastic')) {
        type = 'Plastic'
      } else if (code.includes('_recycling_metal')) {
        type = 'Metal'
      } else if (code.includes('_recycling_glass')) {
        type = 'Glass'
      } else if (code.includes('_recycling_mixed')) {
        type = 'Mixed Recycling'
      } else if (code.includes('_composting_food')) {
        type = 'Food Waste'
      } else if (code.includes('_composting_garden')) {
        type = 'Garden Waste'
      } else if (code.includes('_landfill')) {
        type = 'Landfill'
      } else if (code.includes('_incineration')) {
        type = 'Incineration'
      } else if (code.includes('_ewaste')) {
        type = 'E-Waste'
      }
    }

    byType.set(type, (byType.get(type) || 0) + value)
  })

  const total = Array.from(byType.values()).reduce((s, v) => s + v, 0)

  // Sort by value descending
  const sorted = Array.from(byType.entries()).sort((a, b) => b[1] - a[1])

  sorted.forEach(([type, value]) => {
    const percentage = ((value / total) * 100).toFixed(1)
    console.log(`  ${type.padEnd(20)} ${value.toFixed(2).padStart(10)} kg  (${percentage.padStart(5)}%)`)
  })

  console.log('\n' + '-'.repeat(80))
  console.log(`  ${'TOTAL'.padEnd(20)} ${total.toFixed(2).padStart(10)} kg  (100.0%)`)
}

checkWasteByType().catch(console.error)
