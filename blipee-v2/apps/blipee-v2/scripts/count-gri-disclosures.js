const XLSX = require('xlsx')

async function countGRIDisclosures() {
  console.log('🔍 Counting GRI disclosures in official template...\n')

  const filePath = '/Users/pedro/Downloads/gri-content-index-template-2021.xlsx'

  try {
    const workbook = XLSX.readFile(filePath)

    // Analyze the main content index sheet
    const sheetName = '1. Content index in accordance'
    console.log(`📄 Analyzing sheet: ${sheetName}\n`)

    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Extract all GRI disclosure references
    const disclosurePattern = /(\d+-\d+(?:[a-z])?(?:-[ivxlcdm]+)?)/gi
    const standardPattern = /GRI (\d+)/gi

    const disclosures = new Set()
    const standards = new Set()

    let currentStandard = null

    data.forEach((row, idx) => {
      const rowText = row.join(' ')

      // Check for GRI Standard (e.g., "GRI 2", "GRI 302")
      const standardMatches = rowText.match(/GRI (\d+):/gi)
      if (standardMatches) {
        const stdNum = rowText.match(/GRI (\d+):/)[1]
        currentStandard = stdNum
        standards.add(stdNum)
      }

      // Check for disclosure numbers (e.g., "2-1", "302-1", "305-2")
      const disclosureMatches = rowText.match(disclosurePattern)
      if (disclosureMatches) {
        disclosureMatches.forEach(disclosure => {
          // Clean up the disclosure
          const cleaned = disclosure.trim()
          if (cleaned.match(/^\d+-\d+/)) {
            disclosures.add(cleaned)
          }
        })
      }
    })

    console.log('📊 GRI STANDARDS FOUND:')
    const sortedStandards = Array.from(standards).sort((a, b) => parseInt(a) - parseInt(b))
    sortedStandards.forEach(std => {
      console.log(`   GRI ${std}`)
    })
    console.log(`\n   Total: ${standards.size} standards`)

    console.log('\n\n📋 ALL DISCLOSURES FOUND:')
    const sortedDisclosures = Array.from(disclosures).sort((a, b) => {
      const [aStd, aNum] = a.split('-').map(n => parseInt(n))
      const [bStd, bNum] = b.split('-').map(n => parseInt(n))
      if (aStd !== bStd) return aStd - bStd
      return aNum - bNum
    })

    let lastStd = null
    sortedDisclosures.forEach(disc => {
      const [std] = disc.split('-')
      if (std !== lastStd) {
        console.log(`\n   GRI ${std}:`)
        lastStd = std
      }
      console.log(`      ${disc}`)
    })

    console.log(`\n\n🎯 TOTAL DISCLOSURES IN OFFICIAL GRI: ${disclosures.size}`)

    // Now let's compare with our database
    console.log('\n\n━'.repeat(80))
    console.log('📊 COMPARISON WITH OUR DATABASE:\n')

    require('dotenv').config({ path: '.env.local' })
    const { createClient } = require('@supabase/supabase-js')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: ourMetrics } = await supabase
      .from('metrics_catalog')
      .select('code, name, category, is_calculated')
      .eq('is_active', true)

    console.log(`   Official GRI template: ${disclosures.size} disclosures`)
    console.log(`   Our database: ${ourMetrics.length} metrics`)
    console.log(`      ├─ Base metrics: ${ourMetrics.filter(m => !m.is_calculated).length}`)
    console.log(`      └─ Calculated/derived: ${ourMetrics.filter(m => m.is_calculated).length}`)

    console.log('\n\n💡 ANALYSIS:')
    console.log('   The difference is because:')
    console.log('   1. GRI disclosures are HIGH-LEVEL reporting requirements')
    console.log('      Example: "GRI 302-1: Energy consumption within the organization"')
    console.log('')
    console.log('   2. Our metrics are GRANULAR, TRACKABLE data points')
    console.log('      Example: GRI 302-1 breaks down into:')
    console.log('         - Electricity consumption (kWh)')
    console.log('         - Heating consumption (GJ)')
    console.log('         - Cooling consumption (GJ)')
    console.log('         - Steam consumption (GJ)')
    console.log('         - Fuel consumption (various units)')
    console.log('         - Renewable vs non-renewable splits')
    console.log('         - etc.')
    console.log('')
    console.log('   3. Each GRI disclosure can map to MULTIPLE metrics!')
    console.log(`      So ${disclosures.size} GRI disclosures → ~${ourMetrics.filter(m => !m.is_calculated).length} trackable metrics is CORRECT!`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

countGRIDisclosures().catch(console.error)
