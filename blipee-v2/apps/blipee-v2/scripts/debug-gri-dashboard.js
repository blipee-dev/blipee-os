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

  // Step 4: Filter energy metrics (SAME LOGIC AS DASHBOARD)
  console.log('\n⚡ Step 4: Filtering Energy Metrics (GRI 302 Dashboard Logic)...')

  const energyData = metricsData.filter((m) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_302') ||
      code.startsWith('scope2_') ||
      code.includes('energy') ||
      code.includes('electricity')
    )
  })

  console.log(`\n✅ Energy metrics after filter: ${energyData.length}`)

  // Group by metric code
  const energyByCode = {}
  energyData.forEach(m => {
    const code = m.metric?.code || 'unknown'
    if (!energyByCode[code]) {
      energyByCode[code] = {
        count: 0,
        totalValue: 0,
        hasGridMix: 0,
        totalRenewable: 0,
        totalNonRenewable: 0,
        samples: []
      }
    }
    const entry = energyByCode[code]
    entry.count++
    entry.totalValue += m.value || 0

    if (m.metadata?.grid_mix) {
      entry.hasGridMix++
      entry.totalRenewable += m.metadata.grid_mix.renewable_kwh || 0
      entry.totalNonRenewable += m.metadata.grid_mix.non_renewable_kwh || 0
    }

    if (entry.samples.length < 2) {
      entry.samples.push({
        id: m.id.slice(0, 8),
        period: m.period_start,
        value: m.value,
        renewable: m.metadata?.grid_mix?.renewable_kwh,
        nonRenewable: m.metadata?.grid_mix?.non_renewable_kwh,
        metadata: m.metadata
      })
    }
  })

  console.log('\n📊 Energy Metrics Breakdown:')
  Object.entries(energyByCode).forEach(([code, data]) => {
    console.log(`\n  ${code}:`)
    console.log(`    Records: ${data.count}`)
    console.log(`    Total Value: ${data.totalValue.toFixed(2)} kWh`)
    console.log(`    With grid_mix metadata: ${data.hasGridMix}`)
    if (data.hasGridMix > 0) {
      console.log(`    Total Renewable: ${data.totalRenewable.toFixed(2)} kWh`)
      console.log(`    Total Non-Renewable: ${data.totalNonRenewable.toFixed(2)} kWh`)
    }
    console.log(`    Samples:`)
    data.samples.forEach(s => {
      console.log(`      ${s.period}: ${s.value.toFixed(2)} kWh`)
      if (s.renewable !== undefined) {
        console.log(`        → Renewable: ${s.renewable.toFixed(2)}, Non-renewable: ${s.nonRenewable.toFixed(2)}`)
      }
      if (s.metadata && Object.keys(s.metadata).length > 0) {
        console.log(`        → Metadata keys: ${Object.keys(s.metadata).join(', ')}`)
      } else {
        console.log(`        → No metadata`)
      }
    })
  })

  // Step 5: Calculate totals EXACTLY like dashboard
  console.log('\n💰 Step 5: Calculating Dashboard Totals (Exact Logic)...')

  let renewableTotal = 0
  let nonRenewableTotal = 0

  for (const metric of energyData) {
    const value = metric.value || 0
    const gridMix = metric.metadata?.grid_mix

    if (gridMix && typeof gridMix.renewable_kwh === 'number' && typeof gridMix.non_renewable_kwh === 'number') {
      renewableTotal += gridMix.renewable_kwh
      nonRenewableTotal += gridMix.non_renewable_kwh
    } else {
      // Fallback: treat as non-renewable
      nonRenewableTotal += value
    }
  }

  const totalEnergy = renewableTotal + nonRenewableTotal
  const renewablePercentage = totalEnergy > 0 ? (renewableTotal / totalEnergy) * 100 : 0

  console.log(`\n📈 CALCULATED TOTALS (what dashboard should show):`)
  console.log(`  Total Energy: ${totalEnergy.toFixed(2)} kWh`)
  console.log(`  Renewable: ${renewableTotal.toFixed(2)} kWh (${renewablePercentage.toFixed(2)}%)`)
  console.log(`  Non-Renewable: ${nonRenewableTotal.toFixed(2)} kWh`)

  console.log(`\n🔍 COMPARISON:`)
  console.log(`  Dashboard shows: 994,833 kWh (32.8% renewable)`)
  console.log(`  We calculated:   ${totalEnergy.toFixed(0)} kWh (${renewablePercentage.toFixed(1)}% renewable)`)
  console.log(`  Difference:      ${(994833 - totalEnergy).toFixed(0)} kWh`)
  console.log(`  Multiplier:      ${(994833 / totalEnergy).toFixed(2)}x`)
}

debugGRIDashboard().catch(console.error)
