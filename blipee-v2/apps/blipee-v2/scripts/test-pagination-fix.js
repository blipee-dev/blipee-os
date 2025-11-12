require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function testPaginationFix() {
  console.log('🧪 Testing pagination fix for tracked metrics...\n')

  // Test the pagination logic (Supabase max is 1000 records per request)
  const limit = 1000
  let allData = []
  let page = 0
  let hasMore = true

  console.log('📥 Fetching all tracked metrics with pagination...')

  while (hasMore) {
    console.log(`   Page ${page + 1}: Fetching records ${page * limit} to ${(page + 1) * limit - 1}...`)

    let query = supabase
      .from('metrics_data')
      .select('metric:metrics_catalog!inner(code)')
      .eq('organization_id', organizationId)
      .not('metric_id', 'is', null)
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log(`   Page ${page + 1}: No more data`)
      hasMore = false
    } else {
      console.log(`   Page ${page + 1}: Fetched ${data.length} records`)
      allData.push(...data)
      // Continue if we got a full page (there might be more)
      if (data.length < limit) {
        console.log(`   Page ${page + 1}: Last page (partial results)`)
        hasMore = false
      }
      page++
    }
  }

  console.log(`\n📊 Total records fetched: ${allData.length}`)

  // Extract unique codes
  const trackedMetricSet = new Set(
    allData
      .map((m) => m.metric?.code)
      .filter((code) => code !== undefined)
  )

  console.log(`✅ Unique tracked metric codes: ${trackedMetricSet.size}`)
  console.log('\n📋 All tracked codes (sorted):')
  console.log(Array.from(trackedMetricSet).sort().join('\n'))

  // Compare with expected
  console.log('\n📈 Summary:')
  console.log(`   Expected unique metrics: ~31`)
  console.log(`   Actually fetched: ${trackedMetricSet.size}`)
  console.log(`   Status: ${trackedMetricSet.size >= 30 ? '✅ PASS' : '❌ FAIL'}`)

  // Show some examples of the data structure
  console.log('\n🔍 Sample data structure (first 3 records):')
  allData.slice(0, 3).forEach((record, i) => {
    console.log(`   ${i + 1}. ${JSON.stringify(record)}`)
  })
}

testPaginationFix().catch(console.error)
