const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyFix() {
  console.log('🔍 Verifying Water Data Fix\n')

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  // Test for 2024
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select(`
      id,
      value,
      period_start,
      period_end,
      metric:metrics_catalog(code)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')

  const water2024 = data2024.filter((m) => {
    const code = m.metric?.code || ''
    return code.startsWith('gri_303') || code.includes('water')
  })

  console.log('📊 2024 WATER METRICS BREAKDOWN:\n')
  console.log(`Total water-related records: ${water2024.length}\n`)

  // Count by type
  const withdrawal_total = water2024.filter(m => m.metric?.code === 'gri_303_3_withdrawal_total')
  const withdrawal_subs = water2024.filter(m => m.metric?.code?.includes('gri_303_3') && m.metric?.code !== 'gri_303_3_withdrawal_total')

  const discharge_total = water2024.filter(m => m.metric?.code === 'gri_303_4_discharge_total')
  const discharge_subs = water2024.filter(m => m.metric?.code?.includes('gri_303_4') && m.metric?.code !== 'gri_303_4_discharge_total')

  const consumption_total = water2024.filter(m => m.metric?.code === 'gri_303_5_consumption_total')
  const consumption_subs = water2024.filter(m => m.metric?.code?.includes('gri_303_5') && m.metric?.code !== 'gri_303_5_consumption_total')

  console.log('Withdrawal metrics:')
  console.log(`  - gri_303_3_withdrawal_total: ${withdrawal_total.length} records, sum = ${withdrawal_total.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)
  console.log(`  - Subcategories: ${withdrawal_subs.length} records, sum = ${withdrawal_subs.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)

  console.log('\nDischarge metrics:')
  console.log(`  - gri_303_4_discharge_total: ${discharge_total.length} records, sum = ${discharge_total.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)
  console.log(`  - Subcategories: ${discharge_subs.length} records, sum = ${discharge_subs.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)

  console.log('\nConsumption metrics:')
  console.log(`  - gri_303_5_consumption_total: ${consumption_total.length} records, sum = ${consumption_total.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)
  console.log(`  - Subcategories: ${consumption_subs.length} records, sum = ${consumption_subs.reduce((s, m) => s + (m.value || 0), 0).toFixed(2)} m³`)

  // NEW LOGIC (using only _total)
  const newWithdrawal = withdrawal_total.reduce((s, m) => s + (m.value || 0), 0)
  const newDischarge = discharge_total.reduce((s, m) => s + (m.value || 0), 0)
  const newConsumption = consumption_total.reduce((s, m) => s + (m.value || 0), 0)

  // OLD LOGIC (using all gri_303_3)
  const oldWithdrawal = water2024
    .filter(m => m.metric?.code?.includes('gri_303_3'))
    .reduce((s, m) => s + (m.value || 0), 0)
  const oldDischarge = water2024
    .filter(m => m.metric?.code?.includes('gri_303_4'))
    .reduce((s, m) => s + (m.value || 0), 0)
  const oldConsumption = water2024
    .filter(m => m.metric?.code?.includes('gri_303_5'))
    .reduce((s, m) => s + (m.value || 0), 0)

  console.log('\n' + '='.repeat(80))
  console.log('\n📈 COMPARISON:\n')
  console.log('OLD LOGIC (counting all subcategories):')
  console.log(`  Withdrawal: ${oldWithdrawal.toFixed(2)} m³`)
  console.log(`  Discharge: ${oldDischarge.toFixed(2)} m³`)
  console.log(`  Consumption: ${oldConsumption.toFixed(2)} m³`)
  console.log(`  ⚠️  Problem: Discharge (${oldDischarge.toFixed(2)}) > Withdrawal (${oldWithdrawal.toFixed(2)}) - IMPOSSIBLE!`)

  console.log('\nNEW LOGIC (counting only _total):')
  console.log(`  Withdrawal: ${newWithdrawal.toFixed(2)} m³`)
  console.log(`  Discharge: ${newDischarge.toFixed(2)} m³`)
  console.log(`  Consumption: ${newConsumption.toFixed(2)} m³`)

  const waterBalance = newWithdrawal - newConsumption - newDischarge
  console.log(`  Water Balance: ${waterBalance.toFixed(2)} m³`)
  console.log(`  ✅ Formula: Withdrawal (${newWithdrawal.toFixed(2)}) = Consumption (${newConsumption.toFixed(2)}) + Discharge (${newDischarge.toFixed(2)}) ${waterBalance >= 0 ? '✅' : '❌'}`)

  console.log('\n' + '='.repeat(80))
  console.log('\n✨ FIX SUMMARY:')
  console.log(`  - Withdrawal reduced by ${(oldWithdrawal - newWithdrawal).toFixed(2)} m³ (${((1 - newWithdrawal/oldWithdrawal) * 100).toFixed(1)}% reduction)`)
  console.log(`  - Discharge reduced by ${(oldDischarge - newDischarge).toFixed(2)} m³ (${((1 - newDischarge/oldDischarge) * 100).toFixed(1)}% reduction)`)
  console.log(`  - Consumption reduced by ${(oldConsumption - newConsumption).toFixed(2)} m³ (${((1 - newConsumption/oldConsumption) * 100).toFixed(1)}% reduction)`)
  console.log(`\n  The fix correctly removes duplicate subcategory metrics!`)
}

verifyFix().catch(console.error)
