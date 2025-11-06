const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearHardcodedMetrics() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2' // PLMJ

  console.log('Clearing hardcoded business metrics from organization...\n')

  // Clear all hardcoded organization-level metrics
  // Revenue, employee_count, floor_area_m2 should all be NULL
  // Employee count and floor area are now fetched from sites table
  // Revenue should only be set when real data is available
  const { data, error } = await supabase
    .from('organizations')
    .update({
      annual_revenue: null,
      employee_count: null,
      floor_area_m2: null,
      annual_customers: null,
      revenue_currency: null,
      business_metrics_year: null,
      business_metrics_updated_at: null
    })
    .eq('id', organizationId)
    .select()

  if (error) {
    console.error('Error updating organization:', error)
    return
  }

  console.log('Hardcoded metrics cleared successfully!')
  console.log('Organization is now using real data from sites table for employees and floor area.')
  console.log('Revenue and customer metrics will only show when real data is entered.\n')
  console.log(JSON.stringify(data, null, 2))
}

clearHardcodedMetrics()
