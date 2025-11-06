const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMetrics() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

  console.log('Checking metrics data...\n')

  // Get distinct metric codes with their data counts
  const { data, error } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog (
        code,
        name,
        category
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error:', error)
    return
  }

  // Group by metric code
  const metricCounts = {}
  data.forEach(record => {
    const metric = record.metrics_catalog
    if (metric) {
      const code = metric.code
      if (!metricCounts[code]) {
        metricCounts[code] = {
          code,
          name: metric.name,
          category: metric.category,
          count: 0
        }
      }
      metricCounts[code].count++
    }
  })

  // Sort by count
  const sorted = Object.values(metricCounts).sort((a, b) => b.count - a.count)

  console.log('Metrics with data:')
  console.log('='.repeat(80))
  sorted.forEach(m => {
    console.log(`${m.code.padEnd(40)} | ${m.count.toString().padStart(5)} records | ${m.category}`)
  })
  console.log('='.repeat(80))
  console.log(`Total unique metrics: ${sorted.length}`)
  console.log(`Total records: ${data.length}`)

  // Check sample data
  console.log('\nSample records:')
  const { data: sampleData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(3)

  console.log(JSON.stringify(sampleData, null, 2))
}

checkMetrics().catch(console.error)
