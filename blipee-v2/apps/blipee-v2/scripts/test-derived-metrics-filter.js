require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function testDerivedMetricsFilter() {
  console.log('🧪 Testing derived metrics filter logic...\n')

  // 1. Get metrics with calculated info
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, is_calculated, parent_metric_id, parent:parent_metric_id(code)')
    .eq('is_active', true)

  console.log(`📊 Total metrics in catalog: ${allMetrics?.length || 0}`)

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
      if (data.length < limit) hasMore = false
      page++
    }
  }

  const trackedMetricSet = new Set(
    allData.map((m) => m.metric?.code).filter((code) => code !== undefined)
  )

  console.log(`✅ Tracked metrics: ${trackedMetricSet.size}`)
  console.log()

  // 3. Test the filter logic
  const calculatedMetrics = allMetrics?.filter(m => m.is_calculated) || []

  console.log(`🔍 Calculated metrics (${calculatedMetrics.length}):`)
  calculatedMetrics.forEach(metric => {
    const isTracked = trackedMetricSet.has(metric.code)
    const parentCode = metric.parent?.code
    const isParentTracked = parentCode && trackedMetricSet.has(parentCode)
    const isCalculatedWithTrackedParent = metric.is_calculated && isParentTracked

    const shouldHide = isTracked || isCalculatedWithTrackedParent

    console.log(`\n   ${metric.code}`)
    console.log(`      Name: ${metric.name}`)
    console.log(`      Parent: ${parentCode || 'none'}`)
    console.log(`      Is tracked: ${isTracked ? '✅' : '❌'}`)
    console.log(`      Parent tracked: ${isParentTracked ? '✅' : '❌'}`)
    console.log(`      Should hide from opportunities: ${shouldHide ? '✅ YES' : '❌ NO'}`)
  })

  // 4. Count how many will be filtered
  const hiddenCount = calculatedMetrics.filter(metric => {
    const isTracked = trackedMetricSet.has(metric.code)
    const isParentTracked = metric.parent?.code && trackedMetricSet.has(metric.parent.code)
    return isTracked || (metric.is_calculated && isParentTracked)
  }).length

  console.log(`\n\n📈 Summary:`)
  console.log(`   Total calculated metrics: ${calculatedMetrics.length}`)
  console.log(`   Will be hidden from opportunities: ${hiddenCount}`)
  console.log(`   Will remain as opportunities: ${calculatedMetrics.length - hiddenCount}`)

  // 5. Check specifically for "gri_305_2_purchased_electricity"
  const electricityEmissions = allMetrics?.find(m => m.code === 'gri_305_2_purchased_electricity')
  if (electricityEmissions) {
    const parentTracked = electricityEmissions.parent?.code && trackedMetricSet.has(electricityEmissions.parent.code)
    console.log(`\n\n💡 Specific test: gri_305_2_purchased_electricity`)
    console.log(`   Parent: ${electricityEmissions.parent?.code}`)
    console.log(`   Parent tracked: ${parentTracked ? '✅ YES' : '❌ NO'}`)
    console.log(`   Will be hidden: ${parentTracked ? '✅ YES - CORRECT!' : '❌ NO - PROBLEM!'}`)
  }
}

testDerivedMetricsFilter().catch(console.error)
