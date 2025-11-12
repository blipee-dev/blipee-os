const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeWasteMapping() {
  console.log('🔍 Analyzing Waste Metrics Mapping\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Get all metrics for 2025
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

  console.log(`📊 Total waste metrics found: ${waste2025.length}\n`)
  console.log('='.repeat(80))

  // Categorize scope3_waste metrics
  const diverted = [] // Recycling + Composting = Diverted from disposal
  const disposed = [] // Landfill + Incineration = Disposed
  const other = []

  waste2025.forEach(m => {
    const code = m.metric?.code || ''

    if (code.includes('recycling') || code.includes('composting')) {
      diverted.push(m)
    } else if (code.includes('landfill') || code.includes('incineration')) {
      disposed.push(m)
    } else if (code.includes('waste')) {
      other.push(m)
    }
  })

  console.log('\n♻️  DIVERTED (Recycling + Composting):')
  console.log(`Found ${diverted.length} records\n`)

  const divertedTypes = {}
  diverted.forEach(m => {
    const code = m.metric?.code
    if (!divertedTypes[code]) {
      divertedTypes[code] = { count: 0, total: 0 }
    }
    divertedTypes[code].count++
    divertedTypes[code].total += m.value || 0
  })

  Object.entries(divertedTypes).forEach(([code, data]) => {
    console.log(`  ${code}: ${data.count} records, ${data.total.toFixed(2)} kg`)
  })

  const totalDiverted = diverted.reduce((s, m) => s + (m.value || 0), 0)
  console.log(`\n  TOTAL DIVERTED: ${totalDiverted.toFixed(2)} kg`)

  console.log('\n🚮 DISPOSED (Landfill + Incineration):')
  console.log(`Found ${disposed.length} records\n`)

  const disposedTypes = {}
  disposed.forEach(m => {
    const code = m.metric?.code
    if (!disposedTypes[code]) {
      disposedTypes[code] = { count: 0, total: 0 }
    }
    disposedTypes[code].count++
    disposedTypes[code].total += m.value || 0
  })

  Object.entries(disposedTypes).forEach(([code, data]) => {
    console.log(`  ${code}: ${data.count} records, ${data.total.toFixed(2)} kg`)
  })

  const totalDisposed = disposed.reduce((s, m) => s + (m.value || 0), 0)
  console.log(`\n  TOTAL DISPOSED: ${totalDisposed.toFixed(2)} kg`)

  console.log('\n❓ OTHER WASTE METRICS:')
  console.log(`Found ${other.length} records\n`)

  if (other.length > 0) {
    other.forEach(m => {
      console.log(`  ${m.metric?.code}: ${m.value} kg`)
    })
  } else {
    console.log('  (none)')
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n📈 GRI 306 MAPPING:\n')

  const totalGenerated = totalDiverted + totalDisposed

  console.log(`GRI 306-3 (Waste Generated): ${totalGenerated.toFixed(2)} kg`)
  console.log(`  = Diverted + Disposed`)
  console.log(`  = ${totalDiverted.toFixed(2)} + ${totalDisposed.toFixed(2)}`)

  console.log(`\nGRI 306-4 (Waste Diverted): ${totalDiverted.toFixed(2)} kg`)
  console.log(`  = Recycling + Composting`)

  console.log(`\nGRI 306-5 (Waste Disposed): ${totalDisposed.toFixed(2)} kg`)
  console.log(`  = Landfill + Incineration`)

  const recyclingRate = totalGenerated > 0 ? (totalDiverted / totalGenerated) * 100 : 0
  console.log(`\nRecycling Rate: ${recyclingRate.toFixed(1)}%`)
  console.log(`  = (Diverted / Generated) × 100`)
  console.log(`  = (${totalDiverted.toFixed(2)} / ${totalGenerated.toFixed(2)}) × 100`)

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 RECOMMENDED SOLUTION:\n')
  console.log('Update getWasteDashboardData() to map scope3_waste_* metrics to GRI 306:')
  console.log('  • scope3_waste_recycling_* → GRI 306-4 (Diverted)')
  console.log('  • scope3_waste_composting_* → GRI 306-4 (Diverted)')
  console.log('  • scope3_waste_landfill → GRI 306-5 (Disposed)')
  console.log('  • scope3_waste_incineration → GRI 306-5 (Disposed)')
  console.log('  • scope3_waste_ewaste → GRI 306-5 (Disposed) *if not recycled*')
  console.log('\nGenerated = Diverted + Disposed')
}

analyzeWasteMapping().catch(console.error)
