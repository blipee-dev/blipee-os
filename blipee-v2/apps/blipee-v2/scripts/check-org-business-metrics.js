const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrgBusinessMetrics() {
  console.log('Checking organization business metrics...\n')

  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, annual_revenue, employee_count, floor_area_m2, business_metrics_year')
      .limit(5)

    if (error) {
      console.error('Error fetching organizations:', error)
      return
    }

    console.log('Organizations with business metrics:')
    console.log('================================================================================')
    orgs.forEach((org) => {
      console.log(`\nOrganization: ${org.name}`)
      console.log(`  ID: ${org.id}`)
      console.log(`  Annual Revenue: ${org.annual_revenue ? `$${org.annual_revenue.toLocaleString()}` : 'Not set'}`)
      console.log(`  Employee Count: ${org.employee_count || 'Not set'}`)
      console.log(`  Floor Area: ${org.floor_area_m2 ? `${org.floor_area_m2.toLocaleString()} m²` : 'Not set'}`)
      console.log(`  Metrics Year: ${org.business_metrics_year || 'Not set'}`)
    })
    console.log('\n================================================================================')
  } catch (err) {
    console.error('Error:', err)
  }
}

checkOrgBusinessMetrics()
