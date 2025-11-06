/**
 * Test Electricity Maps API Key
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

console.log('Testing Electricity Maps API...\n')

const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY

if (!API_KEY) {
  console.error('❌ ELECTRICITY_MAPS_API_KEY not found in environment')
  process.exit(1)
}

console.log(`✅ API Key loaded: ${API_KEY.substring(0, 10)}...`)
console.log(`   Length: ${API_KEY.length} characters\n`)

// Test the API with a simple request
async function testAPI() {
  try {
    console.log('📡 Testing API with PT zone...')

    const response = await fetch(
      'https://api.electricitymap.org/v3/carbon-intensity/latest?zone=PT',
      {
        headers: {
          'auth-token': API_KEY!,
        },
      }
    )

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API returned error:', errorText)
    } else {
      const data = await response.json()
      console.log('✅ API response successful')
      console.log('Data:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ Error calling API:', error)
  }
}

testAPI()
