/**
 * Test Electricity Maps Past API
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

console.log('Testing Electricity Maps Past API...\n')

const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY!

// Test the API with a past date
async function testPastAPI() {
  try {
    const testDate = '2024-01-01T12:00:00.000Z'
    console.log(`📡 Testing /past endpoint for PT on ${testDate}...`)

    const url = `https://api.electricitymap.org/v3/power-breakdown/past?zone=PT&datetime=${testDate}`
    console.log(`URL: ${url}\n`)

    const response = await fetch(url, {
      headers: {
        'auth-token': API_KEY,
      },
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API returned error:')
      console.error(errorText)

      if (response.status === 401) {
        console.error('\n⚠️  401 Unauthorized - This may mean:')
        console.error('   1. The API key doesn\'t have access to historical data')
        console.error('   2. Historical data access requires a paid plan')
        console.error('   3. The endpoint URL or parameters are incorrect')
      }
    } else {
      const data = await response.json()
      console.log('✅ API response successful!')
      console.log('Data:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ Error calling API:', error)
  }
}

testPastAPI()
