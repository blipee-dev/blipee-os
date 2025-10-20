/**
 * Test Electricity Maps API for different dates to see if factors vary
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.ELECTRICITY_MAPS_API_KEY!;

async function fetchCarbonIntensity(zone: string, datetime: string) {
  try {
    const url = `https://api.electricitymap.org/v3/carbon-intensity/history?zone=${zone}&datetime=${datetime}`;
    console.log(`\n📡 Fetching: ${url}`);

    const response = await fetch(url, {
      headers: { 'auth-token': apiKey }
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`  ❌ Error ${response.status}: ${text}`);
      return null;
    }

    const data = await response.json();

    if (data.history && data.history.length > 0) {
      return data.history[0];
    }

    return null;
  } catch (error: any) {
    console.log(`  ❌ Exception: ${error.message}`);
    return null;
  }
}

async function fetchGridMix(zone: string, datetime: string) {
  try {
    const url = `https://api.electricitymap.org/v3/power-breakdown/history?zone=${zone}&datetime=${datetime}`;

    const response = await fetch(url, {
      headers: { 'auth-token': apiKey }
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`  ⚠️  Grid mix error ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.history && data.history.length > 0) {
      return data.history[0];
    }

    return null;
  } catch (error: any) {
    return null;
  }
}

async function testHistoricalData() {
  console.log('🔍 Testing Electricity Maps API for historical data variation\n');
  console.log('Zone: PT (Portugal)\n');

  const testDates = [
    '2022-01-15T00:00:00Z',
    '2022-06-15T00:00:00Z',
    '2023-01-15T00:00:00Z',
    '2023-06-15T00:00:00Z',
    '2023-12-15T00:00:00Z',
    '2024-01-15T00:00:00Z',
    '2024-06-15T00:00:00Z',
    '2024-12-15T00:00:00Z',
    '2025-01-15T00:00:00Z'
  ];

  console.log('Date                 | Carbon Intensity | Renewable % | Zone | API Datetime');
  console.log('---------------------|------------------|-------------|------|-------------');

  for (const datetime of testDates) {
    const carbonData = await fetchCarbonIntensity('PT', datetime);
    const gridMix = await fetchGridMix('PT', datetime);

    const carbonIntensity = carbonData?.carbonIntensity || 'N/A';
    const renewablePercentage = gridMix?.renewablePercentage !== null && gridMix?.renewablePercentage !== undefined
      ? `${gridMix.renewablePercentage.toFixed(1)}%`
      : 'N/A';
    const zone = carbonData?.zone || gridMix?.zone || 'N/A';
    const apiDatetime = carbonData?.datetime || gridMix?.datetime || 'N/A';

    console.log(
      `${datetime.substring(0, 10)} | ${String(carbonIntensity).padEnd(16)} | ${String(renewablePercentage).padEnd(11)} | ${zone.padEnd(4)} | ${apiDatetime.substring(0, 19)}`
    );

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n\n💡 Analysis:');
  console.log('If all dates show the same carbon intensity and renewable %, the API might be:');
  console.log('  1. Returning current/latest data instead of historical');
  console.log('  2. Portugal\'s grid mix is very stable (unlikely to be identical)');
  console.log('  3. The API doesn\'t have historical data for older dates');
  console.log('\n');
  console.log('Expected behavior: Carbon intensity and renewable % should vary by date.');
  console.log('Portugal typically has higher renewables in winter (hydro) and lower in summer.');
}

testHistoricalData();
