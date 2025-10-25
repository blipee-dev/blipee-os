/**
 * Test if we have access to the /past endpoint
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.ELECTRICITY_MAPS_API_KEY!;

async function testPastEndpoint() {
  console.log('🔍 Testing /carbon-intensity/past endpoint\n');

  const testDate = '2023-06-15T12:00:00Z';
  const url = `https://api.electricitymaps.com/v3/carbon-intensity/past?zone=PT&datetime=${testDate}`;

  console.log(`Requested date: ${testDate}`);
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: { 'auth-token': apiKey }
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const text = await response.text();
    console.log('Response:');
    console.log(text);
    console.log('\n');

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ SUCCESS! We have access to historical data');
      console.log(`Carbon Intensity: ${data.carbonIntensity} gCO2/kWh`);
      console.log(`Datetime: ${data.datetime}`);
      console.log(`Renewable %: ${data.renewablePercentage || 'N/A'}`);
    } else {
      console.log('❌ FAILED - No access to historical data');
      console.log('This likely means the API key is on the free tier.');
      console.log('\nOptions:');
      console.log('  1. Upgrade to commercial plan for true historical data');
      console.log('  2. Use static historical emission factors from official sources');
      console.log('  3. Use current emission factors for all historical records');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  // Also test the power breakdown
  console.log('\n\n🔍 Testing /power-breakdown/past endpoint\n');

  const breakdownUrl = `https://api.electricitymaps.com/v3/power-breakdown/past?zone=PT&datetime=${testDate}`;
  console.log(`URL: ${breakdownUrl}\n`);

  try {
    const response = await fetch(breakdownUrl, {
      headers: { 'auth-token': apiKey }
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const text = await response.text();
    console.log('Response (first 500 chars):');
    console.log(text.substring(0, 500));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testPastEndpoint();
