/**
 * Test script to check real Top Emitters data from API
 * Run with: node test-real-top-emitters.js
 */

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const startDate = '2025-01-01';
const endDate = '2025-12-31';

async function testTopEmitters() {
  try {
    console.log('🔍 Testing Top Emitters with real API data');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`Period: ${startDate} to ${endDate}`);
    console.log('');

    // Simulate fetching from the scope-analysis API
    const url = `http://localhost:3002/api/sustainability/scope-analysis?start_date=${startDate}&end_date=${endDate}`;
    console.log(`📡 Fetching: ${url}`);
    console.log('');

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received');
    console.log('');

    const extractedScopeData = data.scopeData || data;

    console.log('📊 Scope Totals:');
    console.log(`  Scope 1: ${extractedScopeData.scope_1?.total || 0} tCO2e`);
    console.log(`  Scope 2: ${extractedScopeData.scope_2?.total || 0} tCO2e`);
    console.log(`  Scope 3: ${extractedScopeData.scope_3?.total || 0} tCO2e`);
    const currentTotal = (extractedScopeData.scope_1?.total || 0) +
                         (extractedScopeData.scope_2?.total || 0) +
                         (extractedScopeData.scope_3?.total || 0);
    console.log(`  Total: ${currentTotal} tCO2e`);
    console.log('');

    // Collect all categories
    const allCategories = [];

    console.log('📍 Scope 1 Categories:');
    if (extractedScopeData.scope_1?.categories) {
      console.log('  Raw data:', JSON.stringify(extractedScopeData.scope_1.categories, null, 2));
      Object.entries(extractedScopeData.scope_1.categories).forEach(([key, value]) => {
        if (value > 0) {
          const categoryName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          allCategories.push({ name: categoryName, emissions: value });
          console.log(`  ✓ ${categoryName}: ${value} tCO2e`);
        }
      });
    } else {
      console.log('  ⚠️  No Scope 1 categories found');
    }
    console.log('');

    console.log('📍 Scope 2 Categories:');
    if (extractedScopeData.scope_2?.categories) {
      console.log('  Raw data:', JSON.stringify(extractedScopeData.scope_2.categories, null, 2));
      Object.entries(extractedScopeData.scope_2.categories).forEach(([key, value]) => {
        if (value > 0) {
          const categoryName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          allCategories.push({ name: categoryName, emissions: value });
          console.log(`  ✓ ${categoryName}: ${value} tCO2e`);
        }
      });
    } else {
      console.log('  ⚠️  No Scope 2 categories found');
    }
    console.log('');

    console.log('📍 Scope 3 Categories:');
    if (extractedScopeData.scope_3?.categories) {
      console.log('  Raw data:', JSON.stringify(extractedScopeData.scope_3.categories, null, 2));
      Object.entries(extractedScopeData.scope_3.categories).forEach(([key, value]) => {
        if (value.included && value.value > 0) {
          const categoryName = value.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          allCategories.push({ name: categoryName, emissions: value.value });
          console.log(`  ✓ ${categoryName}: ${value.value} tCO2e`);
        }
      });
    } else {
      console.log('  ⚠️  No Scope 3 categories found');
    }
    console.log('');

    console.log(`📊 Total categories collected: ${allCategories.length}`);
    console.log('');

    if (allCategories.length === 0) {
      console.log('❌ No categories with emissions found!');
      console.log('   This means the Top Emitters section will be empty.');
      console.log('   Check if there is actual emissions data in the database.');
      return;
    }

    // Sort and get top 5
    const topFive = allCategories
      .sort((a, b) => b.emissions - a.emissions)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        percentage: currentTotal > 0 ? (cat.emissions / currentTotal) * 100 : 0
      }));

    console.log('🏆 Top 5 Emitters:');
    topFive.forEach((emitter, index) => {
      console.log(`  ${index + 1}. ${emitter.name}`);
      console.log(`     ${emitter.emissions.toFixed(1)} tCO2e (${emitter.percentage.toFixed(1)}%)`);
    });
    console.log('');

    console.log('✅ Top Emitters calculation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTopEmitters();
