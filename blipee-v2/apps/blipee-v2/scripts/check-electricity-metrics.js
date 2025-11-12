require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function checkElectricityMetrics() {
  console.log('🔍 Checking electricity metrics...\n')

  // 1. Get all electricity-related metrics from catalog
  const { data: electricityMetrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, subcategory, scope')
    .eq('is_active', true)
    .or('category.ilike.%electricity%,subcategory.ilike.%electricity%,name.ilike.%electricity%')
    .order('code')

  console.log(`📊 All electricity-related metrics in catalog (${electricityMetrics.length}):`)
  electricityMetrics.forEach(m => {
    console.log(`   ${m.code}`)
    console.log(`      Name: ${m.name}`)
    console.log(`      Category: ${m.category} ${m.subcategory ? '› ' + m.subcategory : ''}`)
    console.log(`      Scope: ${m.scope}`)
    console.log()
  })

  // 2. Get tracked metrics
  const limit = 1000
  let allData = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('metrics_data')
      .select('metric:metrics_catalog!inner(code)')
      .eq('organization_id', organizationId)
      .not('metric_id', 'is', null)
      .range(page * limit, (page + 1) * limit - 1)

    const { data } = await query

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData.push(...data)
      if (data.length < limit) {
        hasMore = false
      }
      page++
    }
  }

  const trackedCodes = new Set(
    allData
      .map((m) => m.metric?.code)
      .filter((code) => code !== undefined)
  )

  console.log(`\n✅ Tracked electricity metrics:`)
  electricityMetrics.forEach(m => {
    if (trackedCodes.has(m.code)) {
      console.log(`   ✅ ${m.code} - ${m.name}`)
    }
  })

  console.log(`\n💡 NOT tracked electricity metrics (opportunities):`)
  electricityMetrics.forEach(m => {
    if (!trackedCodes.has(m.code)) {
      console.log(`   ❌ ${m.code} - ${m.name}`)
    }
  })

  // 3. Look specifically for "Purchased Electricity"
  const purchasedElec = electricityMetrics.find(m =>
    m.name.toLowerCase().includes('purchased electricity')
  )

  if (purchasedElec) {
    console.log(`\n🔍 "Purchased Electricity Emissions" metric:`)
    console.log(`   Code: ${purchasedElec.code}`)
    console.log(`   Name: ${purchasedElec.name}`)
    console.log(`   Category: ${purchasedElec.category}`)
    console.log(`   Tracked: ${trackedCodes.has(purchasedElec.code) ? '✅ YES' : '❌ NO'}`)
  }
}

checkElectricityMetrics().catch(console.error)
