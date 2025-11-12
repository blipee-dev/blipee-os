require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in metrics_catalog...\n')

  // Get all active metrics
  const { data: allMetrics, error } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, scope, category')
    .eq('is_active', true)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 Total active records: ${allMetrics.length}`)

  // Check for duplicate codes
  const codeCount = {}
  const duplicateCodes = []

  allMetrics.forEach(metric => {
    if (!codeCount[metric.code]) {
      codeCount[metric.code] = []
    }
    codeCount[metric.code].push(metric)
  })

  Object.entries(codeCount).forEach(([code, metrics]) => {
    if (metrics.length > 1) {
      duplicateCodes.push({ code, count: metrics.length, metrics })
    }
  })

  const uniqueCodes = Object.keys(codeCount).length

  console.log(`✅ Unique codes: ${uniqueCodes}`)
  console.log(`${duplicateCodes.length > 0 ? '⚠️' : '✅'} Duplicate codes: ${duplicateCodes.length}`)

  if (duplicateCodes.length > 0) {
    console.log('\n⚠️  Found duplicate codes:')
    duplicateCodes.forEach(dup => {
      console.log(`\n   Code: ${dup.code} (${dup.count} times)`)
      dup.metrics.forEach(m => {
        console.log(`      - ID: ${m.id.substring(0, 8)}... | Name: ${m.name} | Scope: ${m.scope}`)
      })
    })
  }

  // Count by scope
  const scopeCount = {}
  allMetrics.forEach(metric => {
    scopeCount[metric.scope] = (scopeCount[metric.scope] || 0) + 1
  })

  console.log('\n📊 Metrics by scope:')
  Object.entries(scopeCount).sort().forEach(([scope, count]) => {
    console.log(`   ${scope}: ${count}`)
  })

  // Show some example metrics
  console.log('\n📋 Sample metrics (first 10):')
  allMetrics.slice(0, 10).forEach(m => {
    console.log(`   ${m.code} | ${m.scope} | ${m.category}`)
  })
}

checkDuplicates().catch(console.error)
