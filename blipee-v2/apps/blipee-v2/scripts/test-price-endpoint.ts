/**
 * Test Price Endpoint
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY!

async function testPrice() {
  console.log('Testing Price Day-ahead endpoint for Portugal...\n')

  const url = 'https://api.electricitymaps.com/v3/price-day-ahead/latest?zone=PT'
  console.log(`URL: ${url}\n`)

  try {
    const response = await fetch(url, {
      headers: { 'auth-token': API_KEY },
    })

    console.log(`Status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      console.error('Error:', text)
    } else {
      const data = await response.json()
      console.log('✅ Success!')
      console.log('Data:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testPrice()
