require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Universal mapping rules based on metric properties
// This works for ANY metric in ANY organization
function getDisclosureFromMetric(metric) {
  const { code, category, subcategory, scope } = metric

  // Rule 1: Extract from gri_XXX_Y_* pattern
  const griMatch = code.match(/^gri_(\d+)_(\d+)/)
  if (griMatch) {
    return {
      disclosure: `${griMatch[1]}-${griMatch[2]}`,
      source: 'code_pattern'
    }
  }

  // Rule 2: Map scope1/scope2/scope3 metrics based on category

  // IMPORTANT: Check category-specific mappings BEFORE scope-based mappings
  // to avoid mis-categorizing metrics like gri_301_* or gri_304_*

  // GRI 301: Materials (check before scope mapping)
  if (category.includes('Materials') || category.includes('Packaging') || category.includes('Reclamation')) {
    return {
      disclosure: '301-1',
      title: 'Materials used by weight or volume',
      source: 'category_mapping'
    }
  }

  // GRI 304: Biodiversity (check before scope mapping)
  if (category.includes('Biodiversity') || category.includes('Conservation') || category.includes('Habitat')) {
    return {
      disclosure: '304-1',
      title: 'Operational sites in or adjacent to protected areas',
      source: 'category_mapping'
    }
  }

  // GRI 308: Supplier assessment (check before scope mapping)
  if (category.includes('Supplier')) {
    return {
      disclosure: '308-1',
      title: 'New suppliers screened using environmental criteria',
      source: 'category_mapping'
    }
  }

  // GRI 303: Water (check before scope mapping)
  if (category.includes('Water')) {
    // Specific water subcategories
    if (category === 'Water Withdrawal' || subcategory === 'Source') {
      return { disclosure: '303-3', title: 'Water withdrawal', source: 'category_mapping' }
    }
    if (category === 'Water Discharge' || subcategory === 'Destination') {
      return { disclosure: '303-4', title: 'Water discharge', source: 'category_mapping' }
    }
    if (category === 'Water Consumption') {
      return { disclosure: '303-5', title: 'Water consumption', source: 'category_mapping' }
    }
    // Default water to 303-3
    return { disclosure: '303-3', title: 'Water withdrawal', source: 'category_mapping' }
  }

  // GRI 306: Waste (check before scope mapping)
  if (category.includes('Waste')) {
    if (category === 'Waste Generation' || subcategory === 'Generation') {
      return { disclosure: '306-3', title: 'Waste generated', source: 'category_mapping' }
    }
    if (category === 'Waste Diversion' || subcategory === 'Diversion') {
      return { disclosure: '306-4', title: 'Waste diverted from disposal', source: 'category_mapping' }
    }
    if (category === 'Waste Disposal' || subcategory === 'Disposal') {
      return { disclosure: '306-5', title: 'Waste directed to disposal', source: 'category_mapping' }
    }
    // Default waste to 306-3
    return { disclosure: '306-3', title: 'Waste generated', source: 'category_mapping' }
  }

  // GRI 302-1: Energy consumption (all energy sources)
  if (category.includes('Electricity') ||
      category.includes('Stationary Combustion') ||
      category.includes('Mobile Combustion') ||
      category.includes('Purchased Energy') && (subcategory?.includes('Heating') || subcategory?.includes('Cooling') || subcategory?.includes('Steam'))) {
    return {
      disclosure: '302-1',
      title: 'Energy consumption within the organization',
      source: 'category_mapping'
    }
  }

  // NOW check scope-based mappings (only for metrics not caught above)

  // GRI 305-1: Direct (Scope 1) GHG emissions
  if (scope === 'scope_1' || code.startsWith('scope1_')) {
    return {
      disclosure: '305-1',
      title: 'Direct (Scope 1) GHG emissions',
      source: 'scope_mapping'
    }
  }

  // GRI 305-2: Energy indirect (Scope 2) GHG emissions
  if (scope === 'scope_2' || code.startsWith('scope2_')) {
    return {
      disclosure: '305-2',
      title: 'Energy indirect (Scope 2) GHG emissions',
      source: 'scope_mapping'
    }
  }

  // GRI 305-3: Other indirect (Scope 3) GHG emissions
  if (scope === 'scope_3' || code.startsWith('scope3_')) {
    return {
      disclosure: '305-3',
      title: 'Other indirect (Scope 3) GHG emissions',
      source: 'scope_mapping'
    }
  }

  return null
}

// Official GRI disclosure descriptions
const DISCLOSURE_INFO = {
  '301-1': {
    title: 'Materials used by weight or volume',
    description: 'Report total weight or volume of materials used to produce and package products and services.'
  },
  '301-2': {
    title: 'Recycled input materials used',
    description: 'Report percentage of recycled input materials used to manufacture products and services.'
  },
  '301-3': {
    title: 'Reclaimed products and packaging materials',
    description: 'Report percentage of reclaimed products and their packaging materials for each product category.'
  },
  '302-1': {
    title: 'Energy consumption within the organization',
    description: 'Report total fuel consumption, electricity, heating, cooling, and steam purchased or generated.'
  },
  '302-2': {
    title: 'Energy consumption outside of the organization',
    description: 'Report energy consumption outside of the organization (e.g., employee commuting, business travel).'
  },
  '302-3': {
    title: 'Energy intensity',
    description: 'Report energy intensity ratio for the organization.'
  },
  '302-4': {
    title: 'Reduction of energy consumption',
    description: 'Report amount of reductions in energy consumption achieved as a direct result of conservation and efficiency initiatives.'
  },
  '302-5': {
    title: 'Reductions in energy requirements of products and services',
    description: 'Report reductions in energy requirements of sold products and services achieved during the reporting period.'
  },
  '303-3': {
    title: 'Water withdrawal',
    description: 'Report total water withdrawal from all sources, broken down by source type.'
  },
  '303-4': {
    title: 'Water discharge',
    description: 'Report total water discharge to all destinations, broken down by destination type.'
  },
  '303-5': {
    title: 'Water consumption',
    description: 'Report total water consumption from all sources.'
  },
  '304-1': {
    title: 'Operational sites in or adjacent to protected areas',
    description: 'Report operational sites owned, leased, managed in, or adjacent to, protected areas and areas of high biodiversity value.'
  },
  '304-2': {
    title: 'Significant impacts on biodiversity',
    description: 'Report nature of significant direct and indirect impacts on biodiversity.'
  },
  '304-3': {
    title: 'Habitats protected or restored',
    description: 'Report size and location of all habitat areas protected or restored.'
  },
  '304-4': {
    title: 'IUCN Red List species',
    description: 'Report total number of IUCN Red List species and national conservation list species with habitats in areas affected by operations.'
  },
  '305-1': {
    title: 'Direct (Scope 1) GHG emissions',
    description: 'Report gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent.'
  },
  '305-2': {
    title: 'Energy indirect (Scope 2) GHG emissions',
    description: 'Report gross location-based and market-based energy indirect (Scope 2) GHG emissions in metric tons of CO2 equivalent.'
  },
  '305-3': {
    title: 'Other indirect (Scope 3) GHG emissions',
    description: 'Report gross other indirect (Scope 3) GHG emissions in metric tons of CO2 equivalent.'
  },
  '305-4': {
    title: 'GHG emissions intensity',
    description: 'Report GHG emissions intensity ratio for the organization.'
  },
  '305-5': {
    title: 'Reduction of GHG emissions',
    description: 'Report GHG emissions reduced as a direct result of reduction initiatives, in metric tons of CO2 equivalent.'
  },
  '306-3': {
    title: 'Waste generated',
    description: 'Report total weight of waste generated, broken down by composition.'
  },
  '306-4': {
    title: 'Waste diverted from disposal',
    description: 'Report total weight of waste diverted from disposal, broken down by recovery operation.'
  },
  '306-5': {
    title: 'Waste directed to disposal',
    description: 'Report total weight of waste directed to disposal, broken down by disposal operation.'
  },
  '308-1': {
    title: 'New suppliers screened using environmental criteria',
    description: 'Report percentage of new suppliers that were screened using environmental criteria.'
  },
  '308-2': {
    title: 'Negative environmental impacts in the supply chain',
    description: 'Report number of suppliers assessed for environmental impacts and number identified as having significant actual and potential negative environmental impacts.'
  }
}

async function mapAllMetricsToDisclosures() {
  console.log('🔄 Mapping ALL metrics to GRI disclosures...\n')

  // Get ALL active metrics
  const { data: allMetrics, error } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category, subcategory, scope')
    .eq('is_active', true)
    .order('code')

  if (error) {
    console.error('❌ Error fetching metrics:', error)
    return
  }

  console.log(`📊 Total active metrics: ${allMetrics.length}\n`)

  let mapped = 0
  let unmapped = 0
  const disclosureGroups = new Map()

  // Map each metric
  for (const metric of allMetrics) {
    const mapping = getDisclosureFromMetric(metric)

    if (mapping) {
      const { disclosure, title, source } = mapping
      const info = DISCLOSURE_INFO[disclosure]

      if (info) {
        // Update the metric with disclosure info
        const { error: updateError } = await supabase
          .from('metrics_catalog')
          .update({
            gri_disclosure: disclosure,
            gri_disclosure_title: info.title,
            gri_disclosure_description: info.description
          })
          .eq('id', metric.id)

        if (updateError) {
          console.log(`❌ Error updating ${metric.code}: ${updateError.message}`)
        } else {
          mapped++

          // Group for reporting
          if (!disclosureGroups.has(disclosure)) {
            disclosureGroups.set(disclosure, {
              title: info.title,
              metrics: []
            })
          }
          disclosureGroups.get(disclosure).metrics.push({
            code: metric.code,
            name: metric.name,
            source
          })
        }
      } else {
        console.log(`⚠️  No disclosure info for: ${disclosure} (${metric.code})`)
        unmapped++
      }
    } else {
      console.log(`⚠️  Could not map: ${metric.code} (${metric.category})`)
      unmapped++
    }
  }

  console.log(`\n📈 Summary:`)
  console.log(`   ✅ Mapped: ${mapped} metrics`)
  console.log(`   ❌ Unmapped: ${unmapped} metrics`)
  console.log(`   📊 Disclosure groups: ${disclosureGroups.size}`)

  // Show groups
  console.log(`\n\n📋 DISCLOSURE GROUPS:\n`)
  Array.from(disclosureGroups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([disclosure, data]) => {
      console.log(`🔹 ${disclosure}: ${data.title}`)
      console.log(`   Total metrics: ${data.metrics.length}`)

      // Show first 3 as sample
      data.metrics.slice(0, 3).forEach(m => {
        console.log(`      - ${m.code}: ${m.name} (${m.source})`)
      })
      if (data.metrics.length > 3) {
        console.log(`      ... and ${data.metrics.length - 3} more`)
      }
      console.log()
    })
}

mapAllMetricsToDisclosures().catch(console.error)
