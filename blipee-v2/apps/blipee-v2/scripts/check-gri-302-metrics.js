require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function checkGRI302Metrics() {
  console.log('🔍 Checking GRI 302 (Energy) metrics...\n')

  // Get tracked metrics
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
      if (data.length < limit) hasMore = false
      page++
    }
  }

  const trackedCodes = new Set(
    allData.map((m) => m.metric?.code).filter((code) => code !== undefined)
  )

  // Get GRI 302 and GRI 305-2 metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, is_calculated, parent:parent_metric_id(code)')
    .eq('is_active', true)
    .or('code.like.gri_302%,code.like.gri_305_2%')
    .order('code')

  console.log('📊 Energy & Emissions metrics comparison:\n')

  const gri302 = energyMetrics?.filter(m => m.code.startsWith('gri_302')) || []
  const gri305 = energyMetrics?.filter(m => m.code.startsWith('gri_305_2')) || []

  console.log('🔋 GRI 302 - Energy/Consumption metrics:')
  gri302.forEach(m => {
    const isTracked = trackedCodes.has(m.code)
    const parentTracked = m.parent?.code && trackedCodes.has(m.parent.code)
    const shouldShow = !isTracked && !(m.is_calculated && parentTracked)

    console.log(`\n   ${m.code}`)
    console.log(`      Name: ${m.name}`)
    console.log(`      Category: ${m.category}`)
    console.log(`      Tracked: ${isTracked ? '✅' : '❌'}`)
    console.log(`      Is calculated: ${m.is_calculated ? 'YES' : 'NO'}`)
    console.log(`      Should appear as opportunity: ${shouldShow ? '✅ YES' : '❌ NO (hidden)'}`)
  })

  console.log('\n\n💨 GRI 305-2 - Emissions metrics:')
  gri305.forEach(m => {
    const isTracked = trackedCodes.has(m.code)
    const parentTracked = m.parent?.code && trackedCodes.has(m.parent.code)
    const shouldShow = !isTracked && !(m.is_calculated && parentTracked)

    console.log(`\n   ${m.code}`)
    console.log(`      Name: ${m.name}`)
    console.log(`      Category: ${m.category}`)
    console.log(`      Tracked: ${isTracked ? '✅' : '❌'}`)
    console.log(`      Parent: ${m.parent?.code || 'none'}`)
    console.log(`      Parent tracked: ${parentTracked ? '✅' : '❌'}`)
    console.log(`      Is calculated: ${m.is_calculated ? 'YES' : 'NO'}`)
    console.log(`      Should appear as opportunity: ${shouldShow ? '✅ YES' : '❌ NO (hidden)'}`)
  })

  console.log('\n\n📝 Key difference:')
  console.log('   GRI 302 = Energy CONSUMPTION (kWh, GJ, %, etc.)')
  console.log('   GRI 305 = GHG EMISSIONS (tCO2e) - calculated from consumption')
  console.log('\nThey are DIFFERENT metrics serving different reporting needs!')
}

checkGRI302Metrics().catch(console.error)
