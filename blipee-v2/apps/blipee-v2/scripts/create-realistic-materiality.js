const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

// Define which GRI metrics to dismiss (mark as not material)
// Format: GRI standard code -> percentage to dismiss
const DISMISS_PATTERNS = {
  '304': 0.8, // Dismiss 80% of biodiversity metrics (not applicable for office-based business)
  '307': 0.5, // Dismiss 50% of compliance metrics
  '308': 0.6, // Dismiss 60% of supplier assessment metrics
  '301': 0.25, // Dismiss 25% of materials metrics
  '306': 0.2, // Dismiss 20% of waste metrics (mostly tracking this)
}

async function createRealisticMateriality() {
  console.log('🎯 Creating realistic materiality assessment...\n')

  // Get all GRI metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category')
    .like('code', 'gri_%')
    .order('code')

  if (metricsError) {
    console.error('❌ Error fetching metrics:', metricsError)
    return
  }

  console.log(`✅ Found ${metrics.length} GRI metrics\n`)

  // Delete existing recommendations
  await supabase.from('metric_recommendations').delete().eq('organization_id', ORG_ID)

  let dismissed = 0
  let accepted = 0

  for (const metric of metrics) {
    const griCodeMatch = metric.code.match(/gri_(\d{3})/)
    if (!griCodeMatch) continue

    const griCode = griCodeMatch[1]
    const dismissRate = DISMISS_PATTERNS[griCode] || 0
    const shouldDismiss = Math.random() < dismissRate

    const recommendation = {
      organization_id: ORG_ID,
      metric_catalog_id: metric.id,
      status: shouldDismiss ? 'dismissed' : 'accepted',
      recommendation_reason: shouldDismiss
        ? 'Not applicable for our business operations'
        : getReasonForGRI(griCode),
      priority: shouldDismiss ? 'low' : 'high',
      created_at: new Date().toISOString(),
    }

    if (shouldDismiss) {
      recommendation.dismissed_at = new Date().toISOString()
      recommendation.dismissed_category = griCode === '304' ? 'not_material' : 'not_priority'
      recommendation.dismissed_notes = griCode === '304'
        ? 'No significant biodiversity impact - office-based operations'
        : 'Deprioritized based on current operational scope'
      recommendation.is_reactivatable = griCode !== '304' // Biodiversity is permanent, others can be reactivated
      recommendation.affects_materiality = true
      dismissed++
    } else {
      accepted++
    }

    await supabase.from('metric_recommendations').insert(recommendation)
  }

  console.log(`\n📊 Created recommendations:`)
  console.log(`   ✅ Accepted (tracking): ${accepted}`)
  console.log(`   ⏭️  Dismissed (not material): ${dismissed}\n`)

  // Test materiality calculation
  const { data: materiality, error: matError } = await supabase.rpc('calculate_gri_materiality', {
    p_organization_id: ORG_ID,
  })

  if (matError) {
    console.error('❌ Error calculating materiality:', matError)
  } else {
    console.log('\n✅ GRI Materiality Assessment:')
    console.log('==========================================')
    materiality.forEach((std) => {
      const status = std.is_material ? '✅ MATERIAL' : '❌ NOT MATERIAL'
      console.log(`\nGRI ${std.gri_standard} - ${std.standard_name}: ${status}`)
      console.log(`   Tracking: ${std.material_metrics}/${std.total_metrics} metrics (${std.materiality_percentage.toFixed(0)}%)`)
    })
  }

  console.log('\n\n✅ Done! Refresh /dashboard/gri/materiality to see realistic results.')
}

function getReasonForGRI(code) {
  const reasons = {
    '301': 'Important for materials and circularity management',
    '302': 'Critical for energy management and efficiency',
    '303': 'Essential for water stewardship',
    '304': 'Biodiversity monitoring required',
    '305': 'Core emissions and climate change reporting',
    '306': 'Waste management and circularity',
    '307': 'Environmental compliance tracking',
    '308': 'Supply chain sustainability',
  }
  return reasons[code] || 'Important for sustainability reporting'
}

createRealisticMateriality().catch(console.error)
