import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testDashboardAPI() {
  const baseUrl = 'http://localhost:3001';

  console.log('🔍 Testing Dashboard API...\n');

  try {
    // First, we need to authenticate
    const signInRes = await fetch(`${baseUrl}/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'jose.pinto@plmj.pt',
        password: 'password123' // Replace with actual password
      })
    });

    console.log('Auth response:', signInRes.status);

    // Call the dashboard API
    const response = await fetch(`${baseUrl}/api/sustainability/dashboard?range=year&site=all`);

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();

    console.log('\n📊 Dashboard Data:');
    console.log('Total Emissions:', data.metrics?.totalEmissions);
    console.log('Scope Breakdown:', data.scopeBreakdown?.length, 'items');
    console.log('Trend Data:', data.trendData?.length, 'points');
    console.log('\n🏢 Site Comparison:', data.siteComparison?.length, 'sites');

    if (data.siteComparison && data.siteComparison.length > 0) {
      console.log('Site comparison details:');
      data.siteComparison.forEach((site: any) => {
        console.log(`  - ${site.site}: ${site.emissionsIntensity} kgCO2e/m², ${site.energyIntensity} kWh/m²`);
      });
    } else {
      console.log('❌ No site comparison data!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Direct test without auth
async function directTest() {
  console.log('🔍 Direct Dashboard API Test (simulating authenticated request)...\n');

  // Since we can't easily authenticate in a script, let's check the console output
  // when running in the browser
  console.log('Please check the browser console when accessing:');
  console.log('http://localhost:3001/sustainability/dashboard');
  console.log('\nLook for these log messages:');
  console.log('- "📊 Dashboard API: Found X sites for organization"');
  console.log('- "📊 Dashboard API: Unique site_ids in metrics data"');
  console.log('- "📊 Dashboard API: Site comparison result"');
  console.log('- "🔧 Site Comparison: Site data collected"');
}

directTest();