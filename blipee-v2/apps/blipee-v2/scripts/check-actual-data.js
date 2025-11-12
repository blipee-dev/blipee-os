require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function checkActualData() {
  console.log('🔍 Checking which metrics actually have data...\n')

  // Get metrics with data counts
  const { data: metricsWithData } = await supabase
    .from('metrics_data')
    .select('metric_id, metric:metrics_catalog!inner(code, name, unit)')
    .eq('organization_id', organizationId)
    .not('metric_id', 'is', null)
    .limit(100)

  if (!metricsWithData || metricsWithData.length === 0) {
    console.log('❌ No data found')
    return
  }

  // Count by metric
  const metricCounts = {}
  metricsWithData.forEach(record => {
    const code = record.metric?.code
    if (code) {
      if (!metricCounts[code]) {
        metricCounts[code] = {
          code,
          name: record.metric.name,
          unit: record.metric.unit,
          count: 0
        }
      }
      metricCounts[code].count++
    }
  })

  console.log(`📊 Metrics with actual data (top 20 by record count):\n`)
  Object.values(metricCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .forEach((metric, i) => {
      console.log(`${i + 1}. ${metric.code}`)
      console.log(`   Name: ${metric.name}`)
      console.log(`   Unit: ${metric.unit}`)
      console.log(`   Records: ${metric.count}`)
      console.log()
    })

  // Check specifically for electricity
  const electricityCodes = Object.keys(metricCounts).filter(code =>
    code.includes('electricity') || code.includes('elec')
  )

  if (electricityCodes.length > 0) {
    console.log(`⚡ Electricity-related metrics with data:`)
    electricityCodes.forEach(code => {
      const metric = metricCounts[code]
      console.log(`   ${code}: ${metric.count} records`)
    })
  } else {
    console.log(`⚡ No electricity metrics have data yet`)
  }

  // Get one sample record to see the structure
  const { data: sampleRecord } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(1)
    .single()

  if (sampleRecord) {
    console.log(`\n📋 Sample record structure:`)
    console.log(`   Columns: ${Object.keys(sampleRecord).join(', ')}`)
    console.log(`\n   Has emissions_co2e column: ${sampleRecord.hasOwnProperty('emissions_co2e') ? 'YES' : 'NO'}`)
    if (sampleRecord.hasOwnProperty('emissions_co2e')) {
      console.log(`   emissions_co2e value: ${sampleRecord.emissions_co2e}`)
    }
  }
}

checkActualData().catch(console.error)
