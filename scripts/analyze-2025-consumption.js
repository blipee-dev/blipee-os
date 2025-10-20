const fs = require('fs');

const data = JSON.parse(fs.readFileSync(0, 'utf-8'));

if (data.success && data.data) {
  console.log('\n📊 2025 PROJECTED ANNUAL CONSUMPTION BY CATEGORY & METRIC\n');
  console.log('='.repeat(100));

  // Group by category
  const byCategory = {};
  data.data.forEach(target => {
    if (!byCategory[target.category]) {
      byCategory[target.category] = [];
    }
    byCategory[target.category].push(target);
  });

  Object.keys(byCategory).sort().forEach(category => {
    console.log(`\n📁 ${category.toUpperCase()}`);
    console.log('-'.repeat(100));

    let categoryTotalYtd = 0;
    let categoryTotalProjected = 0;

    byCategory[category].forEach(metric => {
      const ytd = metric.currentValue || 0;
      const monthsWithData = metric.monthsWithData || 0;
      const projected = monthsWithData > 0 && monthsWithData < 12 ?
        (ytd / monthsWithData * 12) : ytd;

      categoryTotalYtd += ytd;
      categoryTotalProjected += projected;

      console.log(`  ${metric.metricName}`);
      console.log(`    Unit: ${metric.unit}`);
      console.log(`    Months with data: ${monthsWithData}`);
      console.log(`    YTD (Jan-Oct 2025): ${ytd.toFixed(2)} ${metric.unit}`);
      console.log(`    Projected Annual 2025: ${projected.toFixed(2)} ${metric.unit}`);
      console.log(`    Baseline 2023: ${metric.baselineValue.toFixed(2)} ${metric.unit}`);
      console.log(`    Target 2025: ${metric.targetValue.toFixed(2)} ${metric.unit}`);

      // Show if on track
      const isOnTrack = projected <= metric.targetValue;
      const status = isOnTrack ? '✅ ON TRACK' : '⚠️  OFF TRACK';
      console.log(`    Status: ${status}`);
      console.log('');
    });

    console.log(`  📊 CATEGORY TOTAL:`);
    console.log(`    YTD: ${categoryTotalYtd.toFixed(2)}`);
    console.log(`    Projected Annual 2025: ${categoryTotalProjected.toFixed(2)}`);
  });

  // Overall summary
  const overallYtd = data.data.reduce((sum, m) => sum + (m.currentValue || 0), 0);
  const overallProjected = data.data.reduce((sum, m) => {
    const ytd = m.currentValue || 0;
    const months = m.monthsWithData || 0;
    const projected = months > 0 && months < 12 ? (ytd / months * 12) : ytd;
    return sum + projected;
  }, 0);

  console.log('\n' + '='.repeat(100));
  console.log('\n🎯 OVERALL ENERGY CONSUMPTION SUMMARY');
  console.log(`  Total YTD (Jan-Oct 2025): ${overallYtd.toFixed(2)} MWh equivalent`);
  console.log(`  Total Projected Annual 2025: ${overallProjected.toFixed(2)} MWh equivalent`);
  console.log('\n' + '='.repeat(100) + '\n');
} else {
  console.log('No data found or error:', data);
}
