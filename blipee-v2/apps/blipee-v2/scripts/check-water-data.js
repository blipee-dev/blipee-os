const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWaterData() {
  console.log('🔍 Checking GRI 303 Water Data\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Get all water metrics
  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metadata,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: true })

  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  // Filter water metrics
  const waterData = metricsData.filter((m) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_303') || code.includes('water')
  })

  console.log(`📊 Found ${waterData.length} water metric records\n`)

  // Group by year
  const byYear = {}

  waterData.forEach((metric) => {
    const year = new Date(metric.period_start).getFullYear()

    if (!byYear[year]) {
      byYear[year] = {
        withdrawal: 0,
        consumption: 0,
        discharge: 0,
        recycled: 0,
        records: []
      }
    }

    const code = metric.metric?.code || ''
    const value = metric.value || 0

    if (code.includes('gri_303_3') || code.includes('withdrawal')) {
      byYear[year].withdrawal += value
    } else if (code.includes('gri_303_5') || code.includes('consumption')) {
      byYear[year].consumption += value
    } else if (code.includes('gri_303_4') || code.includes('discharge')) {
      byYear[year].discharge += value
    } else if (code.includes('recycled') || code.includes('reused')) {
      byYear[year].recycled += value
    }

    byYear[year].records.push({
      code: code,
      value: value,
      period_start: metric.period_start,
      period_end: metric.period_end
    })
  })

  // Display summary
  console.log('📈 WATER DATA BY YEAR:\n')
  console.log('=' .repeat(80))

  Object.keys(byYear).sort().forEach((year) => {
    const data = byYear[year]
    console.log(`\n${year}:`)
    console.log(`  Withdrawal: ${data.withdrawal.toLocaleString()} m³`)
    console.log(`  Consumption: ${data.consumption.toLocaleString()} m³`)
    console.log(`  Discharge: ${data.discharge.toLocaleString()} m³`)
    console.log(`  Recycled: ${data.recycled.toLocaleString()} m³`)
    console.log(`  Total records: ${data.records.length}`)

    console.log(`\n  Record details:`)
    data.records.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.code}: ${r.value} (${r.period_start} to ${r.period_end})`)
    })
  })

  console.log('\n' + '=' .repeat(80))

  // Show detailed breakdown for 2024
  console.log('\n\n🔬 DETAILED 2024 ANALYSIS:\n')

  const { data: water2024, error: error2024 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metadata,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')

  if (water2024) {
    const water2024Filtered = water2024.filter((m) => {
      const code = m.metric?.code || ''
      return code.startsWith('gri_303') || code.includes('water')
    })

    console.log(`Found ${water2024Filtered.length} water records for 2024 using:`)
    console.log(`  Filter: period_start >= '2024-01-01' AND period_end <= '2024-12-31'\n`)

    water2024Filtered.forEach((m) => {
      console.log(`  - ${m.metric?.code || 'unknown'}: ${m.value} (${m.period_start} to ${m.period_end})`)
    })
  }

  // Show detailed breakdown for 2025
  console.log('\n\n🔬 DETAILED 2025 ANALYSIS:\n')

  const { data: water2025, error: error2025 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metadata,
      metric:metrics_catalog(code, name)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')

  if (water2025) {
    const water2025Filtered = water2025.filter((m) => {
      const code = m.metric?.code || ''
      return code.startsWith('gri_303') || code.includes('water')
    })

    console.log(`Found ${water2025Filtered.length} water records for 2025 using:`)
    console.log(`  Filter: period_start >= '2025-01-01' AND period_end <= '2025-12-31'\n`)

    water2025Filtered.forEach((m) => {
      console.log(`  - ${m.metric?.code || 'unknown'}: ${m.value} (${m.period_start} to ${m.period_end})`)
    })
  }
}

checkWaterData().catch(console.error)
