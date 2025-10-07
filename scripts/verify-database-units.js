const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== COMPREHENSIVE DATABASE VERIFICATION ===\n');

  // Get all metrics from catalog
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, unit');

  console.log('✅ Metrics Catalog:', allMetrics.length, 'metrics\n');

  // Get ALL data records
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit, organization_id, created_at');

  console.log('✅ Metrics Data:', allData.length, 'total records\n');

  // Check for mismatches
  const mismatches = allData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });

  console.log('📊 UNIT VERIFICATION:');
  console.log('  Total records:', allData.length);
  console.log('  Records with CORRECT unit:', allData.length - mismatches.length);
  console.log('  Records with WRONG unit:', mismatches.length);
  console.log('  Accuracy:', (((allData.length - mismatches.length) / allData.length) * 100).toFixed(2) + '%\n');

  if (mismatches.length > 0) {
    console.log('❌ FOUND MISMATCHES:\n');

    // Group by metric
    const byMetric = {};
    mismatches.forEach(m => {
      const metric = allMetrics.find(met => met.id === m.metric_id);
      if (metric) {
        const key = metric.code;
        if (!byMetric[key]) {
          byMetric[key] = {
            code: metric.code,
            shouldBe: metric.unit,
            actualUnits: new Set(),
            count: 0,
            records: []
          };
        }
        byMetric[key].actualUnits.add(m.unit);
        byMetric[key].count++;
        byMetric[key].records.push(m.id);
      }
    });

    Object.values(byMetric).forEach(m => {
      console.log('Metric:', m.code);
      console.log('  Should be:', m.shouldBe);
      console.log('  Actually is:', Array.from(m.actualUnits).join(', '));
      console.log('  Count:', m.count, 'records');
      console.log('  Sample IDs:', m.records.slice(0, 3).join(', '));
      console.log('');
    });
  } else {
    console.log('✅ PERFECT! All units match metrics_catalog\n');
  }

  // Check for NULL units
  const nullUnits = allData.filter(d => !d.unit || d.unit === null);
  console.log('🔍 NULL UNITS CHECK:');
  console.log('  Records with NULL unit:', nullUnits.length);
  if (nullUnits.length > 0) {
    console.log('  ❌ Sample NULL records:', nullUnits.slice(0, 3).map(d => d.id).join(', '));
  } else {
    console.log('  ✅ No NULL units found');
  }
  console.log('');

  // Check for empty string units
  const emptyUnits = allData.filter(d => d.unit === '');
  console.log('🔍 EMPTY STRING UNITS CHECK:');
  console.log('  Records with empty string unit:', emptyUnits.length);
  if (emptyUnits.length > 0) {
    console.log('  ❌ Sample empty records:', emptyUnits.slice(0, 3).map(d => d.id).join(', '));
  } else {
    console.log('  ✅ No empty units found');
  }
  console.log('');

  // Distribution of units
  const unitDistribution = {};
  allData.forEach(d => {
    unitDistribution[d.unit] = (unitDistribution[d.unit] || 0) + 1;
  });

  console.log('📈 UNIT DISTRIBUTION (Top 15):');
  Object.entries(unitDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([unit, count]) => {
      console.log('  ', unit.padEnd(15), ':', count, 'records');
    });
  console.log('');

  // Check specific categories
  console.log('🔍 CATEGORY-SPECIFIC CHECKS:\n');

  // Transportation
  const transportMetrics = allMetrics.filter(m =>
    m.code.includes('business_travel') || m.code.includes('fleet') || m.code.includes('hotel')
  );
  const transportData = allData.filter(d =>
    transportMetrics.some(m => m.id === d.metric_id)
  );
  const transportMismatches = transportData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });
  console.log('Transportation:');
  console.log('  Total records:', transportData.length);
  console.log('  Mismatches:', transportMismatches.length, transportMismatches.length === 0 ? '✅' : '❌');

  // Energy
  const energyMetrics = allMetrics.filter(m =>
    m.code.includes('electricity') || m.code.includes('heating') || m.code.includes('cooling')
  );
  const energyData = allData.filter(d =>
    energyMetrics.some(m => m.id === d.metric_id)
  );
  const energyMismatches = energyData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });
  console.log('Energy:');
  console.log('  Total records:', energyData.length);
  console.log('  Mismatches:', energyMismatches.length, energyMismatches.length === 0 ? '✅' : '❌');

  // Water & Waste
  const waterWasteMetrics = allMetrics.filter(m =>
    m.code.includes('water') || m.code.includes('waste')
  );
  const waterWasteData = allData.filter(d =>
    waterWasteMetrics.some(m => m.id === d.metric_id)
  );
  const waterWasteMismatches = waterWasteData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });
  console.log('Water & Waste:');
  console.log('  Total records:', waterWasteData.length);
  console.log('  Mismatches:', waterWasteMismatches.length, waterWasteMismatches.length === 0 ? '✅' : '❌');

  console.log('');

  // Final summary
  console.log('=== FINAL VERDICT ===');
  if (mismatches.length === 0 && nullUnits.length === 0 && emptyUnits.length === 0) {
    console.log('✅✅✅ DATABASE IS CLEAN! ✅✅✅');
    console.log('✅ All', allData.length, 'records have correct units');
    console.log('✅ All units match metrics_catalog');
    console.log('✅ No NULL or empty units');
  } else {
    console.log('❌ ISSUES FOUND:');
    if (mismatches.length > 0) console.log('  -', mismatches.length, 'unit mismatches');
    if (nullUnits.length > 0) console.log('  -', nullUnits.length, 'NULL units');
    if (emptyUnits.length > 0) console.log('  -', emptyUnits.length, 'empty units');
  }
})();
