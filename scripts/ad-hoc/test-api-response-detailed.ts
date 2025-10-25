/**
 * Detailed test of Electricity Maps API response
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.ELECTRICITY_MAPS_API_KEY!;

async function testDetailedResponse() {
  const testDate = '2023-06-15T12:00:00Z';
  const url = `https://api.electricitymap.org/v3/carbon-intensity/history?zone=PT&datetime=${testDate}`;

  console.log('🔍 Testing Electricity Maps API Response\n');
  console.log(`Requested date: ${testDate}`);
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: { 'auth-token': apiKey }
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const rawData = await response.text();
    console.log('Raw Response:');
    console.log(rawData);
    console.log('\n');

    const data = JSON.parse(rawData);

    if (data.history) {
      console.log(`History array length: ${data.history.length}\n`);

      if (data.history.length > 0) {
        console.log('First history entry:');
        console.log(JSON.stringify(data.history[0], null, 2));

        console.log('\n\nAll history datetimes:');
        data.history.forEach((entry: any, index: number) => {
          console.log(`  [${index}] ${entry.datetime} - ${entry.carbonIntensity} gCO2/kWh`);
        });
      }
    } else {
      console.log('No history array in response');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testDetailedResponse();
