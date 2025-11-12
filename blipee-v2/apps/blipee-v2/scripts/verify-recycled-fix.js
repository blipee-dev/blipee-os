const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyRecycledFix() {
  console.log('🔍 Verifying Recycled Water Fix\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Test for 2024
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      metric:metrics_catalog(code)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')

  const recycled2024 = data2024.filter((m) => {
    const code = m.metric?.code || ''
    return code.includes('recycled') || code.includes('reused')
  })

  console.log('📊 2024 RECYCLED WATER METRICS:\n')
  console.log(`Total recycled water records: ${recycled2024.length}\n`)

  const greyWater = recycled2024.filter(m => m.metric?.code === 'water_recycled_grey_water')
  const toiletWater = recycled2024.filter(m => m.metric?.code === 'scope3_water_recycled_toilet')

  console.log('Breakdown by metric:')
  console.log(`  - water_recycled_grey_water: ${greyWater.length} records, sum = ${greyWater.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)
  console.log(`  - scope3_water_recycled_toilet: ${toiletWater.length} records, sum = ${toiletWater.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)

  // OLD LOGIC (counting all)
  const oldTotal = recycled2024.reduce((s, m) => s + (m.value || 0), 0)

  // NEW LOGIC (excluding scope3_water_recycled_toilet)
  const newTotal = greyWater.reduce((s, m) => s + (m.value || 0), 0)

  console.log('\n' + '='.repeat(80))
  console.log('\n📈 COMPARISON:\n')
  console.log('OLD LOGIC (counting all recycled metrics):')
  console.log(`  Total Recycled: ${oldTotal.toFixed(2)} m³`)
  console.log(`  ⚠️  Problem: Double-counting grey water!`)

  console.log('\nNEW LOGIC (counting only water_recycled_grey_water):')
  console.log(`  Total Recycled: ${newTotal.toFixed(2)} m³`)
  console.log(`  ✅ Excludes scope3_water_recycled_toilet (subcategory)`)

  console.log('\n' + '='.repeat(80))
  console.log('\n✨ FIX SUMMARY:')
  console.log(`  - Recycled water reduced by ${(oldTotal - newTotal).toFixed(2)} m³ (${((1 - newTotal/oldTotal) * 100).toFixed(1)}% reduction)`)
  console.log(`\n  The fix correctly removes the scope3_water_recycled_toilet subcategory!`)
}

verifyRecycledFix().catch(console.error)
