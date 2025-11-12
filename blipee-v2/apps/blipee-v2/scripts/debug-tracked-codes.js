require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function debugTrackedCodes() {
  console.log('🔍 Debugging tracked metric codes...\n')

  // Test the exact query used in the function
  const { data: trackedMetrics, error } = await supabase
    .from('metrics_data')
    .select('metric:metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .not('metric_id', 'is', null)
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 Sample tracked metrics (first 10):`)
  console.log(JSON.stringify(trackedMetrics, null, 2))
  console.log()

  // Extract codes
  const codes = trackedMetrics
    .map(m => m.metric?.code)
    .filter(code => code !== undefined)

  console.log(`✅ Extracted codes:`, codes)
  console.log()

  // Get all tracked metrics
  const { data: allTracked } = await supabase
    .from('metrics_data')
    .select('metric:metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .not('metric_id', 'is', null)

  const allCodes = new Set(
    allTracked
      .map(m => m.metric?.code)
      .filter(code => code !== undefined)
  )

  console.log(`📋 Total unique tracked codes: ${allCodes.size}`)
  console.log(`   Codes:`, Array.from(allCodes).sort().join(', '))
  console.log()

  // Get a sample catalog metric and check if it's in the set
  const { data: sampleCatalog } = await supabase
    .from('metrics_catalog')
    .select('code, name, category')
    .eq('is_active', true)
    .limit(5)

  console.log(`🔍 Testing sample catalog metrics:`)
  sampleCatalog.forEach(metric => {
    const isTracked = allCodes.has(metric.code)
    console.log(`   ${metric.code} (${metric.category}): ${isTracked ? '✅ TRACKED' : '❌ NOT TRACKED'}`)
  })
}

debugTrackedCodes().catch(console.error)
