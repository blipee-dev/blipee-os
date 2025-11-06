const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Organization ID - change this to your organization
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

// GRI Standards with their metrics (based on actual GRI codes)
const GRI_RECOMMENDATIONS = [
  // GRI 301 - Materials
  {
    codes: ['301-1', '301-2', '301-3'],
    standard: '301',
    acceptedCount: 2, // 2 out of 3 metrics tracked
    reason: 'Important for manufacturing operations',
  },
  // GRI 302 - Energy
  {
    codes: ['302-1', '302-2', '302-3', '302-4', '302-5'],
    standard: '302',
    acceptedCount: 5, // All metrics tracked
    reason: 'Core energy management metrics',
  },
  // GRI 303 - Water
  {
    codes: ['303-1', '303-2', '303-3', '303-4', '303-5'],
    standard: '303',
    acceptedCount: 3, // 3 out of 5 metrics tracked
    reason: 'Water stewardship essential for operations',
  },
  // GRI 304 - Biodiversity
  {
    codes: ['304-1', '304-2', '304-3', '304-4'],
    standard: '304',
    acceptedCount: 0, // Not material
    reason: 'No significant biodiversity impact',
  },
  // GRI 305 - Emissions
  {
    codes: ['305-1', '305-2', '305-3', '305-4', '305-5', '305-6', '305-7'],
    standard: '305',
    acceptedCount: 7, // All metrics tracked
    reason: 'Critical for climate change reporting',
  },
  // GRI 306 - Waste
  {
    codes: ['306-1', '306-2', '306-3', '306-4', '306-5'],
    standard: '306',
    acceptedCount: 4, // 4 out of 5 metrics tracked
    reason: 'Waste management priority',
  },
  // GRI 307 - Environmental Compliance
  {
    codes: ['307-1'],
    standard: '307',
    acceptedCount: 1, // All metrics tracked
    reason: 'Compliance tracking required',
  },
  // GRI 308 - Supplier Assessment
  {
    codes: ['308-1', '308-2'],
    standard: '308',
    acceptedCount: 1, // 1 out of 2 metrics tracked
    reason: 'Supply chain sustainability monitoring',
  },
]

async function populateGRIMateriality() {
  console.log('🔍 Fetching metrics from catalog...')

  // Get all GRI metrics from metrics_catalog
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category')
    .or('code.like.301-%,code.like.302-%,code.like.303-%,code.like.304-%,code.like.305-%,code.like.306-%,code.like.307-%,code.like.308-%')
    .order('code')

  if (metricsError) {
    console.error('❌ Error fetching metrics:', metricsError)
    return
  }

  console.log(`✅ Found ${metrics.length} GRI metrics in catalog`)

  // Delete existing recommendations for this org
  console.log('🗑️ Cleaning up existing recommendations...')
  const { error: deleteError } = await supabase
    .from('metric_recommendations')
    .delete()
    .eq('organization_id', ORG_ID)

  if (deleteError) {
    console.error('❌ Error deleting existing recommendations:', deleteError)
  }

  console.log('✨ Creating new metric recommendations...')

  let totalCreated = 0
  let totalAccepted = 0
  let totalDismissed = 0

  for (const griGroup of GRI_RECOMMENDATIONS) {
    console.log(`\n📊 Processing GRI ${griGroup.standard}...`)

    // Find metrics for this GRI standard
    const standardMetrics = metrics.filter((m) =>
      griGroup.codes.some((code) => m.code.startsWith(code))
    )

    if (standardMetrics.length === 0) {
      console.log(`  ⚠️  No metrics found for GRI ${griGroup.standard}`)
      continue
    }

    console.log(`  Found ${standardMetrics.length} metrics`)

    // Create recommendations
    for (let i = 0; i < standardMetrics.length; i++) {
      const metric = standardMetrics[i]
      const isAccepted = i < griGroup.acceptedCount

      const recommendation = {
        organization_id: ORG_ID,
        metric_catalog_id: metric.id,
        status: isAccepted ? 'accepted' : 'dismissed',
        recommendation_reason: griGroup.reason,
        priority: isAccepted ? 'high' : 'medium',
        created_at: new Date().toISOString(),
      }

      // Add dismissal fields if not accepted
      if (!isAccepted) {
        recommendation.dismissed_at = new Date().toISOString()
        recommendation.dismissed_category = 'not_material'
        recommendation.dismissed_notes = `Not applicable for current operations`
        recommendation.is_reactivatable = true
        recommendation.affects_materiality = true
      }

      const { error: createError } = await supabase.from('metric_recommendations').insert(recommendation)

      if (createError) {
        console.error(`  ❌ Error creating recommendation for ${metric.code}:`, createError)
      } else {
        totalCreated++
        if (isAccepted) {
          console.log(`  ✅ ${metric.code} - ACCEPTED (tracking)`)
          totalAccepted++
        } else {
          console.log(`  ⏭️  ${metric.code} - DISMISSED (not material)`)
          totalDismissed++
        }
      }
    }
  }

  console.log('\n\n📈 Summary:')
  console.log(`  Total recommendations created: ${totalCreated}`)
  console.log(`  Accepted (tracking): ${totalAccepted}`)
  console.log(`  Dismissed (not material): ${totalDismissed}`)

  // Test the materiality calculation
  console.log('\n🧮 Testing GRI materiality calculation...')
  const { data: materiality, error: materialityError } = await supabase.rpc('calculate_gri_materiality', {
    p_organization_id: ORG_ID,
  })

  if (materialityError) {
    console.error('❌ Error calculating materiality:', materialityError)
  } else {
    console.log('\n✅ GRI Materiality Results:')
    console.log('==========================================')
    materiality.forEach((standard) => {
      const status = standard.is_material ? '✅ MATERIAL' : '❌ NOT MATERIAL'
      console.log(
        `\nGRI ${standard.gri_standard} - ${standard.standard_name}: ${status}`
      )
      console.log(
        `  Tracking: ${standard.material_metrics}/${standard.total_metrics} metrics (${standard.materiality_percentage.toFixed(
          0
        )}%)`
      )
      if (standard.peer_adoption_avg) {
        console.log(`  Peer adoption: ${standard.peer_adoption_avg.toFixed(0)}%`)
      }
    })
  }

  console.log('\n\n✅ Done! Visit /dashboard/gri/materiality to see your results.')
}

populateGRIMateriality().catch(console.error)
