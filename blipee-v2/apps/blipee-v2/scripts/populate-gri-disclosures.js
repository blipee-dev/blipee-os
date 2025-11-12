require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Official GRI disclosure information for the 25 environmental disclosures we support
const GRI_DISCLOSURES = [
  // GRI 301: Materials
  {
    code: '301-1',
    title: 'Materials used by weight or volume',
    description: 'Report total weight or volume of materials used to produce and package products and services.',
    pattern: 'gri_301_1'
  },
  {
    code: '301-2',
    title: 'Recycled input materials used',
    description: 'Report percentage of recycled input materials used to manufacture products and services.',
    pattern: 'gri_301_2'
  },
  {
    code: '301-3',
    title: 'Reclaimed products and packaging materials',
    description: 'Report percentage of reclaimed products and their packaging materials for each product category.',
    pattern: 'gri_301_3'
  },

  // GRI 302: Energy
  {
    code: '302-1',
    title: 'Energy consumption within the organization',
    description: 'Report total fuel consumption, electricity, heating, cooling, and steam purchased or generated.',
    pattern: 'gri_302_1'
  },
  {
    code: '302-2',
    title: 'Energy consumption outside of the organization',
    description: 'Report energy consumption outside of the organization (e.g., employee commuting, business travel).',
    pattern: 'gri_302_2'
  },
  {
    code: '302-3',
    title: 'Energy intensity',
    description: 'Report energy intensity ratio for the organization.',
    pattern: 'gri_302_3'
  },
  {
    code: '302-4',
    title: 'Reduction of energy consumption',
    description: 'Report amount of reductions in energy consumption achieved as a direct result of conservation and efficiency initiatives.',
    pattern: 'gri_302_4'
  },
  {
    code: '302-5',
    title: 'Reductions in energy requirements of products and services',
    description: 'Report reductions in energy requirements of sold products and services achieved during the reporting period.',
    pattern: 'gri_302_5'
  },

  // GRI 303: Water and Effluents
  {
    code: '303-3',
    title: 'Water withdrawal',
    description: 'Report total water withdrawal from all sources, broken down by source type.',
    pattern: 'gri_303_3'
  },
  {
    code: '303-4',
    title: 'Water discharge',
    description: 'Report total water discharge to all destinations, broken down by destination type.',
    pattern: 'gri_303_4'
  },
  {
    code: '303-5',
    title: 'Water consumption',
    description: 'Report total water consumption from all sources.',
    pattern: 'gri_303_5'
  },

  // GRI 304: Biodiversity
  {
    code: '304-1',
    title: 'Operational sites in or adjacent to protected areas',
    description: 'Report operational sites owned, leased, managed in, or adjacent to, protected areas and areas of high biodiversity value.',
    pattern: 'gri_304_1'
  },
  {
    code: '304-2',
    title: 'Significant impacts on biodiversity',
    description: 'Report nature of significant direct and indirect impacts on biodiversity.',
    pattern: 'gri_304_2'
  },
  {
    code: '304-3',
    title: 'Habitats protected or restored',
    description: 'Report size and location of all habitat areas protected or restored.',
    pattern: 'gri_304_3'
  },
  {
    code: '304-4',
    title: 'IUCN Red List species',
    description: 'Report total number of IUCN Red List species and national conservation list species with habitats in areas affected by operations.',
    pattern: 'gri_304_4'
  },

  // GRI 305: Emissions
  {
    code: '305-1',
    title: 'Direct (Scope 1) GHG emissions',
    description: 'Report gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent.',
    pattern: 'gri_305_1'
  },
  {
    code: '305-2',
    title: 'Energy indirect (Scope 2) GHG emissions',
    description: 'Report gross location-based and market-based energy indirect (Scope 2) GHG emissions in metric tons of CO2 equivalent.',
    pattern: 'gri_305_2'
  },
  {
    code: '305-3',
    title: 'Other indirect (Scope 3) GHG emissions',
    description: 'Report gross other indirect (Scope 3) GHG emissions in metric tons of CO2 equivalent.',
    pattern: 'gri_305_3'
  },
  {
    code: '305-4',
    title: 'GHG emissions intensity',
    description: 'Report GHG emissions intensity ratio for the organization.',
    pattern: 'gri_305_4'
  },
  {
    code: '305-5',
    title: 'Reduction of GHG emissions',
    description: 'Report GHG emissions reduced as a direct result of reduction initiatives, in metric tons of CO2 equivalent.',
    pattern: 'gri_305_5'
  },

  // GRI 306: Waste
  {
    code: '306-3',
    title: 'Waste generated',
    description: 'Report total weight of waste generated, broken down by composition.',
    pattern: 'gri_306_3'
  },
  {
    code: '306-4',
    title: 'Waste diverted from disposal',
    description: 'Report total weight of waste diverted from disposal, broken down by recovery operation.',
    pattern: 'gri_306_4'
  },
  {
    code: '306-5',
    title: 'Waste directed to disposal',
    description: 'Report total weight of waste directed to disposal, broken down by disposal operation.',
    pattern: 'gri_306_5'
  },

  // GRI 308: Supplier Environmental Assessment
  {
    code: '308-1',
    title: 'New suppliers screened using environmental criteria',
    description: 'Report percentage of new suppliers that were screened using environmental criteria.',
    pattern: 'gri_308_1'
  },
  {
    code: '308-2',
    title: 'Negative environmental impacts in the supply chain',
    description: 'Report number of suppliers assessed for environmental impacts and number identified as having significant actual and potential negative environmental impacts.',
    pattern: 'gri_308_2'
  }
]

async function populateGRIDisclosures() {
  console.log('🔄 Populating GRI disclosure information...\n')

  let totalUpdated = 0
  let totalErrors = 0

  for (const disclosure of GRI_DISCLOSURES) {
    console.log(`\n📊 Processing ${disclosure.code}: ${disclosure.title}`)

    // Update all metrics that match this disclosure pattern
    const { data: updated, error: updateError } = await supabase
      .from('metrics_catalog')
      .update({
        gri_disclosure: disclosure.code,
        gri_disclosure_title: disclosure.title,
        gri_disclosure_description: disclosure.description
      })
      .like('code', `${disclosure.pattern}%`)
      .select('code, name')

    if (updateError) {
      console.log(`   ❌ Error: ${updateError.message}`)
      totalErrors++
    } else if (updated && updated.length > 0) {
      console.log(`   ✅ Updated ${updated.length} metrics:`)
      updated.forEach(m => {
        console.log(`      - ${m.code}: ${m.name}`)
      })
      totalUpdated += updated.length
    } else {
      console.log(`   ⚠️  No metrics found matching pattern: ${disclosure.pattern}%`)
    }
  }

  console.log(`\n\n📈 Summary:`)
  console.log(`   ✅ Successfully updated: ${totalUpdated} metrics`)
  console.log(`   ❌ Errors: ${totalErrors}`)

  // Verify the updates
  console.log(`\n🔍 Verifying updates...`)
  const { data: disclosureGroups, error: verifyError } = await supabase
    .from('metrics_catalog')
    .select('gri_disclosure, gri_disclosure_title, code, name, is_calculated')
    .not('gri_disclosure', 'is', null)
    .eq('is_active', true)
    .order('gri_disclosure')
    .order('code')

  if (verifyError) {
    console.error('❌ Verification error:', verifyError)
    return
  }

  // Group by disclosure
  const grouped = new Map()
  disclosureGroups?.forEach(metric => {
    if (!grouped.has(metric.gri_disclosure)) {
      grouped.set(metric.gri_disclosure, {
        title: metric.gri_disclosure_title,
        metrics: []
      })
    }
    grouped.get(metric.gri_disclosure).metrics.push(metric)
  })

  console.log(`\n📋 Disclosure Groups (${grouped.size}):\n`)
  Array.from(grouped.entries()).forEach(([disclosure, data]) => {
    const baseMetrics = data.metrics.filter(m => !m.is_calculated).length
    const calculatedMetrics = data.metrics.filter(m => m.is_calculated).length

    console.log(`🔹 ${disclosure}: ${data.title}`)
    console.log(`   Total metrics: ${data.metrics.length} (${baseMetrics} base + ${calculatedMetrics} calculated)`)

    // Show first 3 metrics as sample
    const sample = data.metrics.slice(0, 3)
    sample.forEach(m => {
      console.log(`      ${m.is_calculated ? '🔄' : '📊'} ${m.code}: ${m.name}`)
    })
    if (data.metrics.length > 3) {
      console.log(`      ... and ${data.metrics.length - 3} more`)
    }
    console.log()
  })
}

populateGRIDisclosures().catch(console.error)
