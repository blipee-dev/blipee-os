import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAllSitesAPI() {
  console.log('🧪 Testing API with site=all parameter...\n');

  const apiUrl = `http://localhost:3000/api/sustainability/dashboard?range=2025&site=all`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': 'sb-access-token=YOUR_TOKEN_HERE' // You'd need a valid session
      }
    });

    if (response.ok) {
      const data = await response.json();

      console.log('✅ API Response received\n');
      console.log('📊 Site Comparison Data:');
      console.log('Number of sites:', data.siteComparison?.length || 0);

      if (data.siteComparison && data.siteComparison.length > 0) {
        console.log('\nSites included:');
        data.siteComparison.forEach((site: any) => {
          console.log(`  - ${site.site}: ${site.intensity} kgCO2e/m² (${site.performance})`);
          console.log(`    Total: ${site.total || site.totalEmissions} tCO2e`);
        });
      }

      // Check metrics totals
      console.log('\n📈 Overall Metrics:');
      console.log(`  Total Emissions: ${data.metrics?.totalEmissions?.value} ${data.metrics?.totalEmissions?.unit}`);
      console.log(`  Carbon Intensity: ${data.metrics?.carbonIntensity?.value} ${data.metrics?.carbonIntensity?.unit}`);

    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Could not connect to API (server may not be running)');
    console.log('Error:', error);
  }
}

console.log('Note: This test requires the dev server to be running (npm run dev)');
console.log('It will attempt to call the API endpoint directly.\n');

testAllSitesAPI().catch(console.error);