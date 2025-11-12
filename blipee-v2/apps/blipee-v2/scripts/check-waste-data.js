const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWasteData() {
  console.log('🗑️  Checking GRI 306 Waste Data\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Get all metrics for 2024
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')

  const waste2024 = data2024.filter((m) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_306') || code.includes('waste')
  })

  console.log('📊 ALL 2024 WASTE METRICS:\n')
  console.log('='.repeat(80))

  // Group by category
  const generated = waste2024.filter(m => m.metric?.code?.includes('gri_306_3') || m.metric?.code?.includes('generated'))
  const diverted = waste2024.filter(m => m.metric?.code?.includes('gri_306_4') || m.metric?.code?.includes('diverted'))
  const disposed = waste2024.filter(m => m.metric?.code?.includes('gri_306_5') || m.metric?.code?.includes('disposed'))

  console.log('\n♻️  GENERATED METRICS (GRI 306-3):')
  console.log(`Found ${generated.length} records\n`)
  generated.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} kg`)
    console.log(`    Period: ${m.period_start} to ${m.period_end}`)
  })
  console.log(`\n  TOTAL ALL: ${generated.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)

  console.log('\n🔄 DIVERTED METRICS (GRI 306-4):')
  console.log(`Found ${diverted.length} records\n`)
  diverted.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} kg`)
    console.log(`    Period: ${m.period_start} to ${m.period_end}`)
  })
  console.log(`\n  TOTAL ALL: ${diverted.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)

  console.log('\n🚮 DISPOSED METRICS (GRI 306-5):')
  console.log(`Found ${disposed.length} records\n`)
  disposed.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} kg`)
    console.log(`    Period: ${m.period_start} to ${m.period_end}`)
  })
  console.log(`\n  TOTAL ALL: ${disposed.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)

  console.log('\n' + '='.repeat(80))
  console.log('\n🧮 CURRENT LOGIC ANALYSIS:\n')

  // Check what the current logic counts
  const generatedByLogic = generated.filter(m => {
    const code = m.metric?.code || ''
    return code.includes('gri_306_3_waste_generated_total') ||
           code === 'gri_306_3_total' ||
           (code.includes('gri_306_3') && !code.includes('_') && code.length <= 9)
  })

  const divertedByLogic = diverted.filter(m => {
    const code = m.metric?.code || ''
    return code.includes('gri_306_4_diverted_total') ||
           code === 'gri_306_4_total' ||
           (code.includes('gri_306_4') && !code.includes('_') && code.length <= 9)
  })

  const disposedByLogic = disposed.filter(m => {
    const code = m.metric?.code || ''
    return code.includes('gri_306_5_disposed_total') ||
           code === 'gri_306_5_total' ||
           (code.includes('gri_306_5') && !code.includes('_') && code.length <= 9)
  })

  console.log('✅ GENERATED - Metrics counted by current logic:')
  if (generatedByLogic.length > 0) {
    generatedByLogic.forEach(m => {
      console.log(`  ✓ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  TOTAL: ${generatedByLogic.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  } else {
    console.log('  (none)')
  }

  const excludedGenerated = generated.filter(m => !generatedByLogic.includes(m))
  if (excludedGenerated.length > 0) {
    console.log('\n❌ GENERATED - Metrics EXCLUDED:')
    excludedGenerated.forEach(m => {
      console.log(`  ✗ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  EXCLUDED TOTAL: ${excludedGenerated.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  }

  console.log('\n✅ DIVERTED - Metrics counted by current logic:')
  if (divertedByLogic.length > 0) {
    divertedByLogic.forEach(m => {
      console.log(`  ✓ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  TOTAL: ${divertedByLogic.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  } else {
    console.log('  (none)')
  }

  const excludedDiverted = diverted.filter(m => !divertedByLogic.includes(m))
  if (excludedDiverted.length > 0) {
    console.log('\n❌ DIVERTED - Metrics EXCLUDED:')
    excludedDiverted.forEach(m => {
      console.log(`  ✗ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  EXCLUDED TOTAL: ${excludedDiverted.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  }

  console.log('\n✅ DISPOSED - Metrics counted by current logic:')
  if (disposedByLogic.length > 0) {
    disposedByLogic.forEach(m => {
      console.log(`  ✓ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  TOTAL: ${disposedByLogic.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  } else {
    console.log('  (none)')
  }

  const excludedDisposed = disposed.filter(m => !disposedByLogic.includes(m))
  if (excludedDisposed.length > 0) {
    console.log('\n❌ DISPOSED - Metrics EXCLUDED:')
    excludedDisposed.forEach(m => {
      console.log(`  ✗ ${m.metric?.code}: ${m.value} kg`)
    })
    console.log(`  EXCLUDED TOTAL: ${excludedDisposed.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} kg`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 WASTE BALANCE ANALYSIS:\n')

  const generatedTotal = generatedByLogic.reduce((s, m) => s + (m.value || 0), 0)
  const divertedTotal = divertedByLogic.reduce((s, m) => s + (m.value || 0), 0)
  const disposedTotal = disposedByLogic.reduce((s, m) => s + (m.value || 0), 0)

  console.log(`Generated (total): ${generatedTotal.toFixed(2)} kg`)
  console.log(`Diverted (recycled/reused): ${divertedTotal.toFixed(2)} kg`)
  console.log(`Disposed (landfill/incineration): ${disposedTotal.toFixed(2)} kg`)
  console.log(`\nWaste Balance: ${generatedTotal.toFixed(2)} = ${divertedTotal.toFixed(2)} + ${disposedTotal.toFixed(2)} ?`)
  console.log(`Sum: ${(divertedTotal + disposedTotal).toFixed(2)} kg`)

  const diff = Math.abs(generatedTotal - (divertedTotal + disposedTotal))
  if (diff < 0.01) {
    console.log(`Result: ✅ BALANCED (difference: ${diff.toFixed(4)} kg)`)
  } else {
    console.log(`Result: ⚠️  NOT BALANCED (difference: ${diff.toFixed(2)} kg)`)
  }

  console.log('\n' + '='.repeat(80))

  // Check for 2025 as well
  console.log('\n\n📅 CHECKING 2025 DATA:\n')

  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')

  const waste2025 = data2025.filter((m) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_306') || code.includes('waste')
  })

  console.log(`Found ${waste2025.length} waste records for 2025\n`)

  if (waste2025.length > 0) {
    waste2025.forEach(m => {
      console.log(`  - ${m.metric?.code}: ${m.value} kg (${m.period_start} to ${m.period_end})`)
    })
  }
}

checkWasteData().catch(console.error)
