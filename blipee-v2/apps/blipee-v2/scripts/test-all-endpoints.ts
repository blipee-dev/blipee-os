/**
 * Test All Electricity Maps Endpoints
 * Figure out exactly what access we have
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY!
const BASE_URL = 'https://api.electricitymaps.com/v3'
const ZONE = 'PT'

const endpoints = [
  { name: 'Carbon Intensity Latest', url: `${BASE_URL}/carbon-intensity/latest?zone=${ZONE}` },
  { name: 'Carbon Intensity Past', url: `${BASE_URL}/carbon-intensity/past?zone=${ZONE}&datetime=2024-01-01T12:00:00Z` },
  { name: 'Power Breakdown Latest', url: `${BASE_URL}/power-breakdown/latest?zone=${ZONE}` },
  { name: 'Power Breakdown Past', url: `${BASE_URL}/power-breakdown/past?zone=${ZONE}&datetime=2024-01-01T12:00:00Z` },
  { name: 'Renewable Energy Latest', url: `${BASE_URL}/renewable-energy/latest?zone=${ZONE}` },
  { name: 'Renewable Energy History', url: `${BASE_URL}/renewable-energy/history?zone=${ZONE}` },
  { name: 'Price Day-ahead Latest', url: `${BASE_URL}/price-day-ahead/latest?zone=${ZONE}` },
  { name: 'Carbon-free Latest', url: `${BASE_URL}/carbon-free-energy/latest?zone=${ZONE}` },
]

async function testEndpoint(name: string, url: string) {
  try {
    const response = await fetch(url, {
      headers: { 'auth-token': API_KEY },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${name}`)
      console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...\n`)
      return { name, status: 'success', data }
    } else {
      const error = await response.text()
      console.log(`❌ ${name} - Status ${response.status}`)
      console.log(`   Error: ${error.substring(0, 80)}...\n`)
      return { name, status: 'error', code: response.status }
    }
  } catch (error: any) {
    console.log(`❌ ${name} - Exception`)
    console.log(`   ${error.message}\n`)
    return { name, status: 'exception' }
  }
}

async function testAll() {
  console.log('🔍 Testing all Electricity Maps endpoints...\n')
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`)
  console.log(`Zone: ${ZONE}\n`)
  console.log('='.repeat(70) + '\n')

  const results = []
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url)
    results.push(result)
  }

  console.log('='.repeat(70))
  console.log('\n📊 Summary:\n')

  const successes = results.filter(r => r.status === 'success')
  const errors = results.filter(r => r.status === 'error')

  console.log(`✅ Working endpoints: ${successes.length}`)
  successes.forEach(r => console.log(`   - ${r.name}`))

  console.log(`\n❌ Blocked endpoints: ${errors.length}`)
  errors.forEach(r => console.log(`   - ${r.name}`))
}

testAll()
