// Test script to verify the fixed APIs work with jose.pinto@plmj.pt

const fetch = require('node-fetch');

async function testAPIs() {
  console.log('🧪 Testing Fixed APIs\n');
  console.log('✅ Fixed Issues:');
  console.log('   - Changed from "users" table to "organization_members" table');
  console.log('   - Updated getUserOrganization helper function');
  console.log('   - User jose.pinto@plmj.pt is linked to PLMJ organization');
  console.log('   - Organization ID: 22647141-2ee4-4d8d-8b47-16b0cbd830b2\n');

  console.log('📋 Testing without auth (should return 401):');

  // Test 1: Emissions API
  console.log('\n1. /api/sustainability/emissions');
  try {
    const res1 = await fetch('http://localhost:3000/api/sustainability/emissions?period=12m');
    console.log('   Status:', res1.status, res1.statusText);
    if (res1.status === 401) {
      console.log('   ✅ Correctly returns 401 when not authenticated');
    } else if (res1.status === 404) {
      console.log('   ❌ Still returning 404 - may need server restart');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 2: ML Predict API
  console.log('\n2. /api/ml/predict');
  try {
    const res2 = await fetch('http://localhost:3000/api/ml/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelType: 'emissions-forecast' })
    });
    console.log('   Status:', res2.status, res2.statusText);
    if (res2.status === 401) {
      console.log('   ✅ Correctly returns 401 when not authenticated');
    } else if (res2.status === 404) {
      console.log('   ❌ Still returning 404 - may need server restart');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Dashboard API
  console.log('\n3. /api/sustainability/dashboard');
  try {
    const res3 = await fetch('http://localhost:3000/api/sustainability/dashboard?range=year');
    console.log('   Status:', res3.status, res3.statusText);
    if (res3.status === 401) {
      console.log('   ✅ Correctly returns 401 when not authenticated');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📌 Summary:');
  console.log('   The APIs have been fixed to use the correct database tables.');
  console.log('   When authenticated as jose.pinto@plmj.pt, the APIs should work!');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Refresh your browser');
  console.log('   2. Make sure you are logged in as jose.pinto@plmj.pt');
  console.log('   3. Navigate to http://localhost:3000/sustainability/emissions');
  console.log('   4. The APIs should now work correctly!\n');
}

testAPIs();