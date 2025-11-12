require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function testLiveGapAnalysis() {
  console.log('🧪 Testing LIVE Gap Analysis logic...\n')

  // 1. Get all metrics
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('code, name, scope, category, subcategory, unit')
    .eq('is_active', true)
    .order('scope')
    .order('category')

  console.log(`📊 Total active metrics in catalog: ${allMetrics.length}`)

  // 2. Fetch tracked metrics with pagination (EXACTLY like the code)
  const limit = 1000
  let allData = []
  let page = 0
  let hasMore = true

  console.log('\n📥 Fetching tracked metrics with pagination...')

  while (hasMore) {
    console.log(`   Page ${page + 1}: Fetching range ${page * limit} to ${(page + 1) * limit - 1}...`)

    let query = supabase
      .from('metrics_data')
      .select('metric:metrics_catalog!inner(code)')
      .eq('organization_id', organizationId)
      .not('metric_id', 'is', null)
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('❌ Error:', error)
      break
    }

    if (!data || data.length === 0) {
      console.log(`   Page ${page + 1}: No data`)
      hasMore = false
    } else {
      console.log(`   Page ${page + 1}: Fetched ${data.length} records`)
      allData.push(...data)
      // Continue if we got a full page (there might be more)
      if (data.length < limit) {
        console.log(`   Page ${page + 1}: Last page (< limit)`)
        hasMore = false
      }
      page++
    }
  }

  console.log(`\n📊 Total records fetched: ${allData.length}`)

  // 3. Extract codes (EXACTLY like the code)
  const trackedMetricSet = new Set(
    allData
      .map((m) => m.metric?.code)
      .filter((code) => code !== undefined)
  )

  console.log(`✅ Unique tracked codes: ${trackedMetricSet.size}`)
  console.log('\n📋 Tracked codes:')
  console.log(Array.from(trackedMetricSet).sort().join('\n'))

  // 4. Filter opportunities (metrics NOT in tracked set)
  const opportunities = allMetrics.filter(metric => !trackedMetricSet.has(metric.code))

  console.log(`\n💡 Total opportunities (NOT tracked): ${opportunities.length}`)
  console.log(`   = ${allMetrics.length} total - ${trackedMetricSet.size} tracked`)

  // 5. Show some examples of tracked metrics that should NOT appear as opportunities
  console.log('\n✅ Examples of TRACKED metrics (should NOT be opportunities):')
  Array.from(trackedMetricSet).slice(0, 5).forEach(code => {
    const metric = allMetrics.find(m => m.code === code)
    if (metric) {
      console.log(`   - ${code}: ${metric.name}`)
    }
  })

  // 6. Show some examples of opportunity metrics
  console.log('\n💡 Examples of OPPORTUNITY metrics (NOT tracked):')
  opportunities.slice(0, 5).forEach(metric => {
    console.log(`   - ${metric.code}: ${metric.name}`)
  })

  // 7. Double check: are there any tracked metrics in opportunities?
  const trackedInOpportunities = opportunities.filter(opp => trackedMetricSet.has(opp.code))

  if (trackedInOpportunities.length > 0) {
    console.log('\n❌ ERROR: Found tracked metrics in opportunities!')
    console.log(trackedInOpportunities.map(m => m.code).join(', '))
  } else {
    console.log('\n✅ CORRECT: No tracked metrics in opportunities list')
  }
}

testLiveGapAnalysis().catch(console.error)
