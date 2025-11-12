require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

async function debugGapAnalysis() {
  console.log('🔍 Debugging Gap Analysis...\n')

  // 1. Get all metrics from catalog
  const { data: allMetrics, error: catalogError } = await supabase
    .from('metrics_catalog')
    .select('code, name, scope, category, subcategory, unit')
    .eq('is_active', true)
    .order('scope')
    .order('category')

  if (catalogError) {
    console.error('❌ Error fetching catalog:', catalogError)
    return
  }

  console.log(`📊 Total metrics in catalog: ${allMetrics.length}`)
  console.log(`   Scope 1: ${allMetrics.filter(m => m.scope === 'scope_1').length}`)
  console.log(`   Scope 2: ${allMetrics.filter(m => m.scope === 'scope_2').length}`)
  console.log(`   Scope 3: ${allMetrics.filter(m => m.scope === 'scope_3').length}\n`)

  // 2. Get tracked metrics - check table structure first
  const { data: sample, error: sampleError } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(5)

  if (sampleError) {
    console.error('❌ Error fetching sample metrics_data:', sampleError)
  } else {
    console.log(`📋 Sample metrics_data records (${sample.length} records):`)
    if (sample.length > 0) {
      console.log('   Columns:', Object.keys(sample[0]).join(', '))
      console.log('   Sample record:', JSON.stringify(sample[0], null, 2))
    }
    console.log()
  }

  // Now get all tracked metrics
  const { data: trackedMetrics, error: trackedError } = await supabase
    .from('metrics_data')
    .select('metric_id')
    .eq('organization_id', organizationId)

  if (trackedError) {
    console.error('❌ Error fetching tracked metrics:', trackedError)
    return
  }

  console.log(`📊 Total metrics_data records for org: ${trackedMetrics.length}`)

  const withMetricId = trackedMetrics.filter(m => m.metric_id !== null && m.metric_id !== undefined)
  const uniqueTrackedIds = [...new Set(withMetricId.map(m => m.metric_id))]

  console.log(`✅ Records with metric_id: ${withMetricId.length}`)
  console.log(`✅ Unique metric_ids: ${uniqueTrackedIds.length}\n`)

  // 3. Get organization info
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, industry_sector')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    console.error('❌ Error fetching org:', orgError)
    return
  }

  console.log(`🏢 Organization: ${org.name}`)
  console.log(`   Industry: ${org.industry_sector}\n`)

  // 4. Map metrics to GRI standards
  const griMapping = {
    'Materials': '301',
    'Energy': '302',
    'Water': '303',
    'Biodiversity': '304',
    'Emissions': '305',
    'Waste': '306',
    'Compliance': '307',
    'Supplier': '308'
  }

  const metricsByGRI = {}

  allMetrics.forEach(metric => {
    let gri = null

    // Map based on scope and category
    if (metric.scope === 'scope_1' || metric.scope === 'scope_2' || metric.scope === 'scope_3') {
      if (metric.category?.toLowerCase().includes('material') || metric.category?.toLowerCase().includes('packaging')) {
        gri = '301'
      } else if (metric.category?.toLowerCase().includes('energy') || metric.category?.toLowerCase().includes('electricity')) {
        gri = '302'
      } else if (metric.category?.toLowerCase().includes('water')) {
        gri = '303'
      } else if (metric.category?.toLowerCase().includes('biodiversity')) {
        gri = '304'
      } else if (metric.category?.toLowerCase().includes('emission') || metric.category?.toLowerCase().includes('combustion')) {
        gri = '305'
      } else if (metric.category?.toLowerCase().includes('waste')) {
        gri = '306'
      } else if (metric.category?.toLowerCase().includes('compliance')) {
        gri = '307'
      } else if (metric.category?.toLowerCase().includes('supplier')) {
        gri = '308'
      }
    }

    if (gri) {
      if (!metricsByGRI[gri]) {
        metricsByGRI[gri] = { total: 0, tracked: 0, metrics: [] }
      }
      metricsByGRI[gri].total++
      metricsByGRI[gri].metrics.push(metric.code)

      // Check if tracked
      const isTracked = trackedMetrics.some(t => t.metric_id === metric.code)
      if (isTracked) {
        metricsByGRI[gri].tracked++
      }
    }
  })

  console.log('📋 Metrics by GRI Standard:\n')
  Object.entries(metricsByGRI).sort().forEach(([gri, data]) => {
    const coverage = data.total > 0 ? Math.round((data.tracked / data.total) * 100) : 0
    console.log(`   GRI ${gri}: ${data.tracked}/${data.total} tracked (${coverage}% coverage)`)
  })

  console.log('\n📝 Sample tracked metric codes:')
  console.log(uniqueTrackedIds.slice(0, 10).join(', '))

  console.log('\n📝 Sample catalog codes (first 20):')
  console.log(allMetrics.slice(0, 20).map(m => m.code).join(', '))

  // Check for mismatch
  console.log('\n🔍 Checking for mismatches...')
  const catalogCodes = new Set(allMetrics.map(m => m.code))
  const orphanTracked = uniqueTrackedIds.filter(id => !catalogCodes.has(id))

  if (orphanTracked.length > 0) {
    console.log(`⚠️  Found ${orphanTracked.length} tracked metrics NOT in catalog:`)
    console.log(orphanTracked.slice(0, 10).join(', '))
  } else {
    console.log('✅ All tracked metrics exist in catalog')
  }
}

debugGapAnalysis().catch(console.error)
