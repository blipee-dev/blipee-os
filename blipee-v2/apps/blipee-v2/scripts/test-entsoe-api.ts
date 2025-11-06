/**
 * Test ENTSO-E Transparency Platform API
 * Check what data is available for Portugal
 */

// ENTSO-E API Details:
// - Registration required at: https://transparency.entsoe.eu/
// - Free API access
// - Security token required (get from user account settings)
// - Portugal EIC code: 10YPT-REN------W

const ENTSOE_API_URL = 'https://web-api.tp.entsoe.eu/api'

// You need to register and get a token from:
// https://transparency.entsoe.eu/ > Account Settings > Web API Security Token
const ENTSOE_API_TOKEN = process.env.ENTSOE_API_TOKEN || 'YOUR_TOKEN_HERE'

const PORTUGAL_EIC = '10YPT-REN------W' // Portugal area code

async function testEntsoE() {
  console.log('🔍 Testing ENTSO-E API for Portugal...\n')
  console.log('ℹ️  To use this API:')
  console.log('   1. Register at https://transparency.entsoe.eu/')
  console.log('   2. Get API token from Account Settings > Web API Security Token')
  console.log('   3. Set ENTSOE_API_TOKEN environment variable\n')

  if (ENTSOE_API_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('⚠️  No API token provided. Please register and set ENTSOE_API_TOKEN.')
    console.log('   Example: export ENTSOE_API_TOKEN="your-token-here"\n')
    return
  }

  // Get current date range (last 24 hours)
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)

  const formatDate = (date: Date) => {
    return date.toISOString().split('.')[0] + 'Z'
  }

  const startStr = formatDate(start).replace(/[-:]/g, '').slice(0, 12)
  const endStr = formatDate(end).replace(/[-:]/g, '').slice(0, 12)

  console.log(`Period: ${start.toISOString()} to ${end.toISOString()}\n`)

  // Test 1: Actual Generation Per Type (what we need!)
  console.log('📊 Test 1: Actual Generation Per Type')
  console.log('   This shows real-time generation breakdown by source\n')

  const generationUrl = `${ENTSOE_API_URL}?documentType=A75&processType=A16&in_Domain=${PORTUGAL_EIC}&periodStart=${startStr}&periodEnd=${endStr}&securityToken=${ENTSOE_API_TOKEN}`

  try {
    const response = await fetch(generationUrl)

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.log(`   ${text.substring(0, 200)}...\n`)
    } else {
      const xml = await response.text()
      console.log(`✅ Success! Received ${xml.length} bytes of XML data`)

      // Parse production types from XML
      const psrTypes = xml.match(/<PsrType>(.*?)<\/PsrType>/g) || []
      const uniqueTypes = [...new Set(psrTypes)]

      console.log(`   Found ${uniqueTypes.length} production types:`)
      uniqueTypes.forEach(type => {
        const code = type.match(/<PsrType>(.*?)<\/PsrType>/)?.[1]
        console.log(`   - ${code} ${getPsrTypeName(code)}`)
      })
      console.log()
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  // Test 2: Day-ahead Prices
  console.log('💰 Test 2: Day-ahead Prices')
  console.log('   This shows electricity prices\n')

  const priceUrl = `${ENTSOE_API_URL}?documentType=A44&in_Domain=${PORTUGAL_EIC}&out_Domain=${PORTUGAL_EIC}&periodStart=${startStr}&periodEnd=${endStr}&securityToken=${ENTSOE_API_TOKEN}`

  try {
    const response = await fetch(priceUrl)

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.log(`   ${text.substring(0, 200)}...\n`)
    } else {
      const xml = await response.text()
      console.log(`✅ Success! Received ${xml.length} bytes of XML data`)

      // Extract first price point as example
      const priceMatch = xml.match(/<price\.amount>([\d.]+)<\/price\.amount>/)
      if (priceMatch) {
        console.log(`   Example price: €${priceMatch[1]}/MWh`)
      }
      console.log()
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  console.log('=' . repeat(60))
  console.log('\n📋 Summary:\n')
  console.log('What ENTSO-E provides:')
  console.log('✅ Real-time generation by source (wind, solar, hydro, etc.)')
  console.log('✅ Day-ahead electricity prices')
  console.log('✅ Historical data (years of data available)')
  console.log('✅ FREE API access')
  console.log('✅ Official European grid operator data\n')

  console.log('What you need to calculate:')
  console.log('⚙️  Renewable percentage (sum renewable sources / total)')
  console.log('⚙️  Carbon intensity (requires carbon factors per source)\n')

  console.log('API Documentation:')
  console.log('📖 https://transparency.entsoe.eu/')
  console.log('📖 https://transparencyplatform.zendesk.com/hc/en-us/articles/15692855254548\n')
}

function getPsrTypeName(code: string | undefined): string {
  const types: Record<string, string> = {
    'B01': '(Biomass)',
    'B02': '(Fossil Brown coal/Lignite)',
    'B03': '(Fossil Coal-derived gas)',
    'B04': '(Fossil Gas)',
    'B05': '(Fossil Hard coal)',
    'B06': '(Fossil Oil)',
    'B07': '(Fossil Oil shale)',
    'B08': '(Fossil Peat)',
    'B09': '(Geothermal)',
    'B10': '(Hydro Pumped Storage)',
    'B11': '(Hydro Run-of-river and poundage)',
    'B12': '(Hydro Water Reservoir)',
    'B13': '(Marine)',
    'B14': '(Nuclear)',
    'B15': '(Other renewable)',
    'B16': '(Solar)',
    'B17': '(Waste)',
    'B18': '(Wind Offshore)',
    'B19': '(Wind Onshore)',
    'B20': '(Other)',
  }
  return types[code || ''] || ''
}

testEntsoE()
