const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateOrgRevenue() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2' // PLMJ

  console.log('Updating organization revenue...\n')

  const { data, error } = await supabase
    .from('organizations')
    .update({
      annual_revenue: 10000000, // 10M
      revenue_currency: 'USD',
      business_metrics_year: 2025,
      business_metrics_updated_at: new Date().toISOString()
    })
    .eq('id', organizationId)
    .select()

  if (error) {
    console.error('Error updating organization:', error)
    return
  }

  console.log('Organization updated successfully!')
  console.log(JSON.stringify(data, null, 2))
}

updateOrgRevenue()
