const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGRIDashboard() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  const currentYear = new Date().getFullYear()
  const startDate = `${currentYear}-01-01`
  const endDate = `${currentYear}-12-31`

  console.log('🔍 Debugging GRI Dashboard Data Flow')
  console.log('='.repeat(100))
  console.log(`Organization: ${organizationId}`)
  console.log(`Date Range: ${startDate} to ${endDate}`)
  console.log('='.repeat(100))

  // Step 1: Fetch raw data exactly like the dashboard does
  console.log('\n📥 Step 1: Fetching raw metrics data...')

  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      unit,
      co2e_emissions,
      period_start,
      period_end,
      metadata,
      metric:metrics_catalog(
        id,
        code,
        name,
        category
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', startDate)
    .lte('period_end', endDate)

  if (error) {
    console.error('❌ Error fetching data:', error)
    return
  }

  console.log(`✅ Fetched ${metricsData?.length || 0} total records`)

  if (!metricsData || metricsData.length === 0) {
    console.log('\n❌ NO DATA FOUND for current year!')
    console.log(`\nTrying to fetch ANY data for organization ${organizationId}...`)

    const { data: anyData } = await supabase
      .from('metrics_data')
      .select(`
        period_start,
        period_end,
        metric:metrics_catalog(code)
      `)
      .eq('organization_id', organizationId)
      .limit(10)

    if (anyData && anyData.length > 0) {
      console.log(`\n✅ Found ${anyData.length} records (sample):`)
      anyData.forEach(d => {
        console.log(`  ${d.metric?.code} | ${d.period_start} to ${d.period_end}`)
      })

      // Find date range
      const { data: dateRange } = await supabase
        .from('metrics_data')
        .select('period_start')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: true })
        .limit(1)

      const { data: dateRangeEnd } = await supabase
        .from('metrics_data')
        .select('period_start')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false })
        .limit(1)

      console.log(`\n📅 Your data range:`)
      console.log(`  Earliest: ${dateRange?.[0]?.period_start}`)
      console.log(`  Latest: ${dateRangeEnd?.[0]?.period_start}`)
      console.log(`\n⚠️  You're querying for ${currentYear}, but data might be in different years!`)
    } else {
      console.log('❌ NO DATA AT ALL for this organization')
    }
    return
  }

  // Step 2: Show what metrics we found
  console.log('\n📊 Step 2: Analyzing fetched metrics...')
  const metricCodes = {}
  metricsData.forEach(m => {
    const code = m.metric?.code || 'unknown'
    if (!metricCodes[code]) {
      metricCodes[code] = { count: 0, totalValue: 0, totalEmissions: 0 }
    }
    metricCodes[code].count++
    metricCodes[code].totalValue += parseFloat(m.value || 0)
    metricCodes[code].totalEmissions += parseFloat(m.co2e_emissions || 0)
  })

  console.log(`\nUnique metric codes found: ${Object.keys(metricCodes).length}`)
  Object.entries(metricCodes).forEach(([code, stats]) => {
    console.log(`  ${code.padEnd(50)} | ${stats.count.toString().padStart(3)} records | ${stats.totalValue.toFixed(2).padStart(12)} value | ${(stats.totalEmissions/1000).toFixed(2).padStart(10)} tCO2e`)
  })

  // Step 3: Simulate GRI standard mapping
  console.log('\n🗺️  Step 3: Mapping to GRI Standards...')

  const griStandards = [
    { code: '301', name: 'Materials' },
    { code: '302', name: 'Energy' },
    { code: '303', name: 'Water' },
    { code: '304', name: 'Biodiversity' },
    { code: '305', name: 'Emissions' },
    { code: '306', name: 'Waste' },
    { code: '307', name: 'Compliance' },
    { code: '308', name: 'Suppliers' },
  ]

  const standardsMap = new Map()
  griStandards.forEach(standard => {
    standardsMap.set(standard.code, {
      standard_code: standard.code,
      standard_name: standard.name,
      metrics_recorded: 0,
      key_metric_value: 0,
    })
  })

  metricsData.forEach(metric => {
    const metricCode = metric.metric?.code || ''
    let standardCode = ''

    // Mapping logic (same as in gri.ts)
    if (metricCode.startsWith('gri_')) {
      const parts = metricCode.split('_')
      if (parts.length >= 2) {
        standardCode = parts[1]
      }
    } else if (metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || metricCode.startsWith('scope3_')) {
      if (metricCode.includes('waste')) {
        standardCode = '306'
      } else if (metricCode.startsWith('scope2_')) {
        standardCode = '302'
      } else {
        standardCode = '305'
      }
    } else if (metricCode.includes('water')) {
      standardCode = '303'
    } else if (metricCode.includes('waste')) {
      standardCode = '306'
    } else if (metricCode.includes('energy') || metricCode.includes('electricity')) {
      standardCode = '302'
    }

    if (standardCode && standardsMap.has(standardCode)) {
      const standard = standardsMap.get(standardCode)
      standard.metrics_recorded++

      // Aggregate key metrics
      if (standardCode === '305') {
        standard.key_metric_value += (metric.co2e_emissions || 0) / 1000
      } else if (standardCode === '302') {
        standard.key_metric_value += (metric.value || 0)
      } else if (standardCode === '303') {
        standard.key_metric_value += (metric.value || 0)
      } else if (standardCode === '306') {
        standard.key_metric_value += (metric.value || 0)
      }
    }
  })

  console.log('\nGRI Standards Mapping Results:')
  standardsMap.forEach((standard, code) => {
    if (standard.metrics_recorded > 0) {
      console.log(`  GRI ${code} (${standard.standard_name.padEnd(15)}): ${standard.metrics_recorded.toString().padStart(4)} records | Key Metric: ${standard.key_metric_value.toFixed(2)}`)
    }
  })

  // Step 4: Calculate dashboard totals
  console.log('\n💰 Step 4: Calculating Dashboard Totals...')

  let totalEmissionsTonnes = 0
  let totalEnergyKwh = 0
  let totalWaterM3 = 0
  let totalWasteKg = 0

  metricsData.forEach(metric => {
    const metricCode = metric.metric?.code || ''

    if (metricCode.startsWith('gri_305') || metricCode.startsWith('scope1_') || metricCode.startsWith('scope2_') || (metricCode.startsWith('scope3_') && !metricCode.includes('waste'))) {
      totalEmissionsTonnes += (metric.co2e_emissions || 0) / 1000
    }

    if (metricCode.includes('gri_302_1_energy_consumption') || metricCode.startsWith('scope2_')) {
      totalEnergyKwh += metric.value || 0
    }

    if (metricCode.includes('gri_303_3_water_withdrawal') || metricCode.includes('gri_303_5_water_consumption')) {
      totalWaterM3 += metric.value || 0
    }

    if (metricCode.includes('gri_306_3_waste_generated') || metricCode.includes('waste')) {
      totalWasteKg += metric.value || 0
    }
  })

  console.log(`\n📊 Dashboard Totals (what should display):`)
  console.log(`  Total Emissions: ${totalEmissionsTonnes.toFixed(2)} tonnes CO2e`)
  console.log(`  Total Energy: ${totalEnergyKwh.toFixed(2)} kWh`)
  console.log(`  Total Water: ${totalWaterM3.toFixed(2)} m³`)
  console.log(`  Total Waste: ${totalWasteKg.toFixed(2)} kg`)

  if (totalEmissionsTonnes === 0 && totalEnergyKwh === 0 && totalWaterM3 === 0 && totalWasteKg === 0) {
    console.log('\n❌ ALL TOTALS ARE ZERO!')
    console.log('\nPossible reasons:')
    console.log('  1. Metric codes are not matching the filter logic')
    console.log('  2. Values or emissions are NULL in database')
    console.log('  3. Metric catalog join is failing')

    console.log('\n🔍 Checking a sample record in detail:')
    if (metricsData.length > 0) {
      const sample = metricsData[0]
      console.log(JSON.stringify(sample, null, 2))
    }
  }
}

debugGRIDashboard().catch(console.error)
