const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConsumption() {
  console.log('🔍 Checking Water Consumption Data\n')

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

  const water2024 = data2024.filter((m) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_303') || code.includes('water')
  })

  console.log('📊 ALL 2024 WATER METRICS:\n')
  console.log('='.repeat(80))

  // Group by category
  const withdrawal = water2024.filter(m => m.metric?.code?.includes('gri_303_3') || m.metric?.code?.includes('withdrawal'))
  const consumption = water2024.filter(m => m.metric?.code?.includes('gri_303_5') || m.metric?.code?.includes('consumption'))
  const discharge = water2024.filter(m => m.metric?.code?.includes('gri_303_4') || m.metric?.code?.includes('discharge'))
  const recycled = water2024.filter(m => m.metric?.code?.includes('recycled') || m.metric?.code?.includes('reused'))

  console.log('\n📤 WITHDRAWAL METRICS:')
  withdrawal.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} m³ (${m.period_start} to ${m.period_end})`)
  })
  console.log(`  TOTAL: ${withdrawal.reduce((s, m) => s + (m.value || 0), 0)} m³`)

  console.log('\n💧 CONSUMPTION METRICS:')
  consumption.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} m³ (${m.period_start} to ${m.period_end})`)
    console.log(`    Name: ${m.metric?.name}`)
  })
  console.log(`  TOTAL: ${consumption.reduce((s, m) => s + (m.value || 0), 0)} m³`)

  console.log('\n📥 DISCHARGE METRICS:')
  discharge.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} m³ (${m.period_start} to ${m.period_end})`)
  })
  console.log(`  TOTAL: ${discharge.reduce((s, m) => s + (m.value || 0), 0)} m³`)

  console.log('\n♻️  RECYCLED METRICS:')
  recycled.forEach(m => {
    console.log(`  - ${m.metric?.code}: ${m.value} m³ (${m.period_start} to ${m.period_end})`)
  })
  console.log(`  TOTAL: ${recycled.reduce((s, m) => s + (m.value || 0), 0)} m³`)

  console.log('\n' + '='.repeat(80))
  console.log('\n🧮 CURRENT LOGIC FOR CONSUMPTION:\n')

  // Show what the current logic counts
  const consumptionByCurrentLogic = consumption.filter(m => {
    const code = m.metric?.code || ''
    return code.includes('gri_303_5_consumption_total') ||
           (code.includes('gri_303_5') && !code.includes('_') && code.length <= 9)
  })

  console.log('Metrics counted by current logic:')
  consumptionByCurrentLogic.forEach(m => {
    console.log(`  ✓ ${m.metric?.code}: ${m.value} m³`)
  })
  console.log(`\nTOTAL by current logic: ${consumptionByCurrentLogic.reduce((s, m) => s + (m.value || 0), 0)} m³`)

  // Check if there are subcategories being excluded
  const excludedConsumption = consumption.filter(m => {
    const code = m.metric?.code || ''
    return !code.includes('gri_303_5_consumption_total') &&
           !(code.includes('gri_303_5') && !code.includes('_') && code.length <= 9)
  })

  if (excludedConsumption.length > 0) {
    console.log('\n❌ Metrics EXCLUDED by current logic:')
    excludedConsumption.forEach(m => {
      console.log(`  ✗ ${m.metric?.code}: ${m.value} m³`)
    })
    console.log(`\nEXCLUDED total: ${excludedConsumption.reduce((s, m) => s + (m.value || 0), 0)} m³`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 ANALYSIS:\n')

  const withdrawalTotal = withdrawal.filter(m => m.metric?.code === 'gri_303_3_withdrawal_total').reduce((s, m) => s + (m.value || 0), 0)
  const consumptionTotal = consumption.filter(m => m.metric?.code === 'gri_303_5_consumption_total').reduce((s, m) => s + (m.value || 0), 0)
  const dischargeTotal = discharge.filter(m => m.metric?.code === 'gri_303_4_discharge_total').reduce((s, m) => s + (m.value || 0), 0)

  console.log(`Withdrawal (total): ${withdrawalTotal} m³`)
  console.log(`Consumption (total): ${consumptionTotal} m³`)
  console.log(`Discharge (total): ${dischargeTotal} m³`)
  console.log(`\nWater Balance: ${withdrawalTotal} - ${consumptionTotal} - ${dischargeTotal} = ${(withdrawalTotal - consumptionTotal - dischargeTotal).toFixed(2)} m³`)
  console.log(`\nFormula check: ${withdrawalTotal} = ${consumptionTotal} + ${dischargeTotal} ?`)
  console.log(`Result: ${(withdrawalTotal === consumptionTotal + dischargeTotal) ? '✅ BALANCED' : '⚠️  NOT BALANCED'}`)
}

checkConsumption().catch(console.error)
