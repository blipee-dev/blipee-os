const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getPortugalGridMixReference(date) {
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1

  // Try monthly data first
  const { data: monthlyData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .eq('month', month)
    .is('quarter', null)
    .maybeSingle()

  if (monthlyData) return monthlyData.renewable_percentage

  // Try quarterly data
  const quarter = Math.ceil(month / 3)
  const { data: quarterlyData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .eq('quarter', quarter)
    .is('month', null)
    .maybeSingle()

  if (quarterlyData) return quarterlyData.renewable_percentage

  // Try annual data
  const { data: annualData } = await supabase
    .from('portugal_grid_mix_reference')
    .select('renewable_percentage')
    .eq('year', year)
    .is('quarter', null)
    .is('month', null)
    .maybeSingle()

  if (annualData) return annualData.renewable_percentage

  return null
}

function isPurchasedElectricity(metricCode) {
  const purchasedElectricityCodes = [
    'scope2_electricity_grid',
    'gri_302_1_electricity_consumption',
    'gri_305_2_purchased_electricity',
  ]

  if (purchasedElectricityCodes.includes(metricCode)) {
    return true
  }

  // NEW: Scope 2 purchased energy
  if (metricCode.startsWith('scope2_purchased_')) {
    return true
  }

  if (metricCode.includes('electricity')) {
    const selfGeneratedKeywords = ['solar', 'wind', 'renewable', 'self_generated']
    return !selfGeneratedKeywords.some(keyword => metricCode.includes(keyword))
  }

  return false
}

async function checkMetrics() {
  console.log('🔍 Testing new grid mix calculation with updated logic\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  const startDate = '2025-01-01'
  const endDate = '2025-12-31'

  // Fetch energy metrics
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      metadata,
      metric:metrics_catalog(code)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', startDate)
    .lte('period_end', endDate)

  const energyData = metricsData.filter((m) => {
    const code = m.metric?.code || ''
    return (
      code.startsWith('gri_302') ||
      code.startsWith('scope2_') ||
      code.includes('energy') ||
      code.includes('electricity')
    )
  })

  console.log(`📊 Found ${energyData.length} energy metrics\n`)

  let renewableTotal = 0
  let nonRenewableTotal = 0

  const metricSummary = {}

  for (const metric of energyData) {
    const metricCode = metric.metric?.code || ''
    const value = metric.value || 0
    const gridMix = metric.metadata?.grid_mix

    let renewableValue = 0
    let nonRenewableValue = 0
    let method = ''

    if (gridMix && typeof gridMix.renewable_kwh === 'number' && typeof gridMix.non_renewable_kwh === 'number') {
      // Use existing grid mix metadata
      renewableValue = gridMix.renewable_kwh
      nonRenewableValue = gridMix.non_renewable_kwh
      method = 'existing_grid_mix'
    } else if (isPurchasedElectricity(metricCode) && metric.period_start) {
      // NEW: Use reference table for purchased electricity without grid_mix
      const renewablePercentage = await getPortugalGridMixReference(metric.period_start)
      if (renewablePercentage !== null) {
        renewableValue = (value * renewablePercentage) / 100
        nonRenewableValue = (value * (100 - renewablePercentage)) / 100
        method = `reference_table_${renewablePercentage}%`
      } else {
        nonRenewableValue = value
        method = 'no_reference_data'
      }
    } else {
      // Fallback to binary renewable check
      const isRenewable = metric.metric?.is_renewable === true || metric.metadata?.renewable === true || metricCode.includes('renewable')
      if (isRenewable) {
        renewableValue = value
        method = 'binary_renewable'
      } else {
        nonRenewableValue = value
        method = 'binary_non_renewable'
      }
    }

    renewableTotal += renewableValue
    nonRenewableTotal += nonRenewableValue

    // Track by metric code
    if (!metricSummary[metricCode]) {
      metricSummary[metricCode] = {
        count: 0,
        totalValue: 0,
        totalRenewable: 0,
        totalNonRenewable: 0,
        methods: {}
      }
    }
    const summary = metricSummary[metricCode]
    summary.count++
    summary.totalValue += value
    summary.totalRenewable += renewableValue
    summary.totalNonRenewable += nonRenewableValue
    summary.methods[method] = (summary.methods[method] || 0) + 1
  }

  const totalEnergy = renewableTotal + nonRenewableTotal
  const renewablePercentage = totalEnergy > 0 ? (renewableTotal / totalEnergy) * 100 : 0

  console.log('📈 NEW CALCULATION RESULTS:\n')
  Object.entries(metricSummary).forEach(([code, data]) => {
    const pct = data.totalValue > 0 ? (data.totalRenewable / data.totalValue) * 100 : 0
    console.log(`  ${code}:`)
    console.log(`    Total: ${data.totalValue.toFixed(2)} kWh`)
    console.log(`    Renewable: ${data.totalRenewable.toFixed(2)} kWh (${pct.toFixed(1)}%)`)
    console.log(`    Non-Renewable: ${data.totalNonRenewable.toFixed(2)} kWh`)
    console.log(`    Methods used: ${Object.entries(data.methods).map(([m, c]) => `${m}(${c})`).join(', ')}`)
    console.log()
  })

  console.log('=' .repeat(80))
  console.log(`\n✨ TOTAL ENERGY: ${totalEnergy.toFixed(2)} kWh`)
  console.log(`   Renewable: ${renewableTotal.toFixed(2)} kWh (${renewablePercentage.toFixed(2)}%)`)
  console.log(`   Non-Renewable: ${nonRenewableTotal.toFixed(2)} kWh\n`)
  console.log('=' .repeat(80))
  console.log(`\n🔄 COMPARISON:`)
  console.log(`   Before fix: 32.8% renewable (heating/cooling = 100% non-renewable)`)
  console.log(`   After fix:  ${renewablePercentage.toFixed(1)}% renewable (heating/cooling use grid mix)`)
  console.log(`   Improvement: +${(renewablePercentage - 32.8).toFixed(1)} percentage points\n`)
}

checkMetrics().catch(console.error)
