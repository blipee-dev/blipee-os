/**
 * Test script to verify Top Emitters calculation
 * Run with: node test-top-emitters.js
 */

// Simulate the data structure from the API
const mockScopeData = {
  scope_1: {
    total: 150.5,
    categories: {
      stationary_combustion: 85.2,
      mobile_combustion: 65.3,
      process_emissions: 0,
      fugitive_emissions: 0
    }
  },
  scope_2: {
    total: 220.8,
    categories: {
      purchased_electricity: 180.5,
      purchased_heat: 40.3,
      purchased_steam: 0,
      purchased_cooling: 0
    }
  },
  scope_3: {
    total: 28.0,
    categories: {
      purchased_goods: { value: 0, included: false, data_quality: 0 },
      capital_goods: { value: 0, included: false, data_quality: 0 },
      fuel_energy: { value: 5.2, included: true, data_quality: 100, name: 'Fuel & Energy Related' },
      upstream_transportation: { value: 0, included: false, data_quality: 0 },
      waste: { value: 8.3, included: true, data_quality: 100, name: 'Waste' },
      business_travel: { value: 14.5, included: true, data_quality: 100, name: 'Business Travel' },
      employee_commuting: { value: 0, included: false, data_quality: 0 },
      upstream_leased: { value: 0, included: false, data_quality: 0 },
      downstream_transportation: { value: 0, included: false, data_quality: 0 },
      processing: { value: 0, included: false, data_quality: 0 },
      use_of_products: { value: 0, included: false, data_quality: 0 },
      end_of_life: { value: 0, included: false, data_quality: 0 },
      downstream_leased: { value: 0, included: false, data_quality: 0 },
      franchises: { value: 0, included: false, data_quality: 0 },
      investments: { value: 0, included: false, data_quality: 0 }
    }
  }
};

// Replicate the Top Emitters logic from OverviewDashboard.tsx
const allCategories = [];
const currentTotal = mockScopeData.scope_1.total + mockScopeData.scope_2.total + mockScopeData.scope_3.total;

console.log('🔍 [Top Emitters Test] Starting category collection');
console.log('📊 Total emissions:', currentTotal.toFixed(2), 'tCO2e');
console.log('');

// Scope 1 categories
console.log('📍 Scope 1 categories:');
if (mockScopeData.scope_1?.categories) {
  Object.entries(mockScopeData.scope_1.categories).forEach(([key, value]) => {
    if (value > 0) {
      const categoryName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      allCategories.push({
        name: categoryName,
        emissions: value
      });
      console.log(`  ✓ ${categoryName}: ${value} tCO2e`);
    } else {
      console.log(`  ✗ ${key}: 0 tCO2e (skipped)`);
    }
  });
}
console.log('');

// Scope 2 categories
console.log('📍 Scope 2 categories:');
if (mockScopeData.scope_2?.categories) {
  Object.entries(mockScopeData.scope_2.categories).forEach(([key, value]) => {
    if (value > 0) {
      const categoryName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      allCategories.push({
        name: categoryName,
        emissions: value
      });
      console.log(`  ✓ ${categoryName}: ${value} tCO2e`);
    } else {
      console.log(`  ✗ ${key}: 0 tCO2e (skipped)`);
    }
  });
}
console.log('');

// Scope 3 categories
console.log('📍 Scope 3 categories:');
if (mockScopeData.scope_3?.categories) {
  Object.entries(mockScopeData.scope_3.categories).forEach(([key, value]) => {
    if (value.included && value.value > 0) {
      const categoryName = value.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      allCategories.push({
        name: categoryName,
        emissions: value.value
      });
      console.log(`  ✓ ${categoryName}: ${value.value} tCO2e`);
    } else {
      console.log(`  ✗ ${key}: ${value.value || 0} tCO2e (${value.included ? 'included' : 'not included'})`);
    }
  });
}
console.log('');

console.log('📊 Total categories collected:', allCategories.length);
console.log('');

// Sort by emissions and take top 5
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
  console.log(`     Emissions: ${emitter.emissions.toFixed(1)} tCO2e`);
  console.log(`     Percentage: ${emitter.percentage.toFixed(1)}%`);
  console.log('');
});

// Verify the calculation
console.log('✅ Verification:');
console.log(`  Total from top 5: ${topFive.reduce((sum, e) => sum + e.emissions, 0).toFixed(1)} tCO2e`);
console.log(`  Expected order (highest to lowest):`);
console.log(`    1. Purchased Electricity: 180.5 tCO2e (45.2%)`);
console.log(`    2. Stationary Combustion: 85.2 tCO2e (21.3%)`);
console.log(`    3. Mobile Combustion: 65.3 tCO2e (16.3%)`);
console.log(`    4. Purchased Heat: 40.3 tCO2e (10.1%)`);
console.log(`    5. Business Travel: 14.5 tCO2e (3.6%)`);
console.log('');

// Check if actual matches expected
const expectedOrder = ['Purchased Electricity', 'Stationary Combustion', 'Mobile Combustion', 'Purchased Heat', 'Business Travel'];
const actualOrder = topFive.map(e => e.name);

console.log('🔍 Order check:');
let allMatch = true;
for (let i = 0; i < expectedOrder.length; i++) {
  const match = actualOrder[i] === expectedOrder[i];
  console.log(`  ${i + 1}. ${match ? '✓' : '✗'} Expected: "${expectedOrder[i]}", Got: "${actualOrder[i]}"`);
  if (!match) allMatch = false;
}
console.log('');

if (allMatch) {
  console.log('✅ Top Emitters calculation is CORRECT!');
} else {
  console.log('❌ Top Emitters calculation has ISSUES!');
}
