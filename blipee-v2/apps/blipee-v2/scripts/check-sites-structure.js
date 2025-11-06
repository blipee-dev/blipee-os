const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSitesStructure() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2' // PLMJ

  console.log('Checking sites structure...\n')

  // Get all sites for this organization
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Sample sites (first 3):')
  console.log('================================================================================')
  console.log(JSON.stringify(sites, null, 2))

  // Check if sites have employee_count and floor_area
  console.log('\n\nChecking for employee_count and floor_area fields...')
  sites.forEach((site, idx) => {
    console.log(`\nSite ${idx + 1}: ${site.name}`)
    console.log(`  Has employee_count: ${site.employee_count !== undefined}`)
    console.log(`  Has floor_area: ${site.floor_area_m2 !== undefined || site.floor_area !== undefined}`)
  })

  // Sum totals if fields exist
  if (sites.length > 0 && sites[0].employee_count !== undefined) {
    const { data: allSites } = await supabase
      .from('sites')
      .select('employee_count, floor_area_m2')
      .eq('organization_id', organizationId)

    const totalEmployees = allSites?.reduce((sum, s) => sum + (s.employee_count || 0), 0) || 0
    const totalFloorArea = allSites?.reduce((sum, s) => sum + (s.floor_area_m2 || 0), 0) || 0

    console.log('\n\nTotals across all sites:')
    console.log('================================================================================')
    console.log(`Total Employees: ${totalEmployees}`)
    console.log(`Total Floor Area: ${totalFloorArea} m²`)
  }
}

checkSitesStructure()
