const XLSX = require('xlsx')
const path = require('path')

async function analyzeGRITemplate() {
  console.log('🔍 Analyzing official GRI template...\n')

  const filePath = '/Users/pedro/Downloads/gri-content-index-template-2021.xlsx'

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath)

    console.log('📊 Workbook Info:')
    console.log(`   Sheets: ${workbook.SheetNames.join(', ')}`)
    console.log()

    // Analyze each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n📄 Sheet: ${sheetName}`)
      console.log('━'.repeat(80))

      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      console.log(`   Total rows: ${data.length}`)

      // Show first few rows to understand structure
      console.log('\n   First 10 rows:')
      data.slice(0, 10).forEach((row, idx) => {
        if (row.length > 0) {
          console.log(`   ${idx + 1}: ${JSON.stringify(row).substring(0, 150)}...`)
        }
      })

      // Try to find GRI standard references
      const griReferences = data.filter(row => {
        return row.some(cell =>
          cell && typeof cell === 'string' &&
          (cell.match(/GRI \d+-\d+/i) || cell.match(/GRI \d{3}/i))
        )
      })

      if (griReferences.length > 0) {
        console.log(`\n   Found ${griReferences.length} rows with GRI references`)
      }
    })

    console.log('\n\n🎯 Summary:')
    console.log(`   This will help us understand the official GRI structure`)
    console.log(`   and compare with our 257 metrics catalog`)

  } catch (error) {
    console.error('❌ Error reading file:', error.message)
    console.log('\n💡 Installing xlsx library...')
    console.log('   Run: npm install xlsx')
  }
}

analyzeGRITemplate().catch(console.error)
