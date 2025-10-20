import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function compareMonthlyEmissions() {
  console.log('📊 Monthly Emissions Comparison: 2022-2025\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Fetch all data with pagination
  console.log('📥 Fetching all records...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true })
      .range(from, from + batchSize - 1);

    if (batch && batch.length > 0) {
      allData = allData.concat(batch);
      from += batchSize;
      if (batch.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  // Group by year-month
  const emissionsByYearMonth = new Map<string, number>();

  allData.forEach(record => {
    const yearMonth = record.period_start.substring(0, 7);
    const emissions = record.co2e_emissions || 0;
    emissionsByYearMonth.set(yearMonth, (emissionsByYearMonth.get(yearMonth) || 0) + emissions);
  });

  // Extract data for each year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const data2022: number[] = [];
  const data2023: number[] = [];
  const data2024: number[] = [];
  const data2025: number[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = String(month).padStart(2, '0');
    data2022.push((emissionsByYearMonth.get(`2022-${monthStr}`) || 0) / 1000); // Convert to tCO2e
    data2023.push((emissionsByYearMonth.get(`2023-${monthStr}`) || 0) / 1000);
    data2024.push((emissionsByYearMonth.get(`2024-${monthStr}`) || 0) / 1000);
    data2025.push((emissionsByYearMonth.get(`2025-${monthStr}`) || 0) / 1000);
  }

  // Print comparison table
  console.log('📈 Monthly Emissions Comparison (2022-2025)\n');
  console.log('| Month | 2022       | 2023       | 2024       | 2025       | Δ 22→23  | Δ 23→24  | Δ 24→25  |');
  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');

  for (let i = 0; i < 12; i++) {
    const month = monthNames[i];
    const val2022 = data2022[i];
    const val2023 = data2023[i];
    const val2024 = data2024[i];
    const val2025 = data2025[i];

    const change2223 = val2022 > 0 ? ((val2023 - val2022) / val2022 * 100) : 0;
    const change2324 = val2023 > 0 ? ((val2024 - val2023) / val2023 * 100) : 0;
    const change2425 = val2024 > 0 ? ((val2025 - val2024) / val2024 * 100) : 0;

    const formatChange = (change: number) => {
      const abs = Math.abs(change);
      const sign = change >= 0 ? '+' : '';
      let str = `${sign}${change.toFixed(1)}%`;

      // Add emoji for significant changes
      if (abs > 40) str += ' ⭐';
      else if (abs > 30) str += ' ✨';

      return str.padEnd(9);
    };

    console.log(
      `| ${month}   | ` +
      `${val2022.toFixed(1).padStart(8)} t | ` +
      `${val2023.toFixed(1).padStart(8)} t | ` +
      `${val2024.toFixed(1).padStart(8)} t | ` +
      `${val2025.toFixed(1).padStart(8)} t | ` +
      `${formatChange(change2223)} | ` +
      `${formatChange(change2324)} | ` +
      `${formatChange(change2425)} |`
    );
  }

  // Totals
  const total2022 = data2022.reduce((a, b) => a + b, 0);
  const total2023 = data2023.reduce((a, b) => a + b, 0);
  const total2024 = data2024.reduce((a, b) => a + b, 0);
  const total2025 = data2025.reduce((a, b) => a + b, 0);

  const totalChange2223 = ((total2023 - total2022) / total2022 * 100);
  const totalChange2324 = ((total2024 - total2023) / total2023 * 100);
  const totalChange2425 = ((total2025 - total2024) / total2024 * 100);

  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');
  console.log(
    `| **TOTAL** | ` +
    `**${total2022.toFixed(1).padStart(6)} t** | ` +
    `**${total2023.toFixed(1).padStart(6)} t** | ` +
    `**${total2024.toFixed(1).padStart(6)} t** | ` +
    `**${total2025.toFixed(1).padStart(6)} t** | ` +
    `**${totalChange2223 >= 0 ? '+' : ''}${totalChange2223.toFixed(1)}%** | ` +
    `**${totalChange2324 >= 0 ? '+' : ''}${totalChange2324.toFixed(1)}%** | ` +
    `**${totalChange2425 >= 0 ? '+' : ''}${totalChange2425.toFixed(1)}%** |`
  );

  // Year-over-year summary
  console.log('\n\n📊 Year-over-Year Summary:\n');
  console.log(`2022 Total: ${total2022.toFixed(1)} tCO2e`);
  console.log(`2023 Total: ${total2023.toFixed(1)} tCO2e (${totalChange2223 >= 0 ? '+' : ''}${totalChange2223.toFixed(1)}% vs 2022)`);
  console.log(`2024 Total: ${total2024.toFixed(1)} tCO2e (${totalChange2324 >= 0 ? '+' : ''}${totalChange2324.toFixed(1)}% vs 2023)`);
  console.log(`2025 Total: ${total2025.toFixed(1)} tCO2e (${totalChange2425 >= 0 ? '+' : ''}${totalChange2425.toFixed(1)}% vs 2024)`);

  // Multi-year trends
  console.log('\n\n📈 Multi-Year Trends:\n');
  console.log(`2022 → 2023: ${totalChange2223 >= 0 ? '+' : ''}${totalChange2223.toFixed(1)}% (${total2023 > total2022 ? 'Increase' : 'Decrease'})`);
  console.log(`2023 → 2024: ${totalChange2324 >= 0 ? '+' : ''}${totalChange2324.toFixed(1)}% (${total2024 > total2023 ? 'Increase' : 'Decrease'})`);
  console.log(`2024 → 2025: ${totalChange2425 >= 0 ? '+' : ''}${totalChange2425.toFixed(1)}% (${total2025 > total2024 ? 'Increase' : 'Decrease'})`);
  console.log(`2022 → 2025: ${((total2025 - total2022) / total2022 * 100).toFixed(1)}% (${total2025 > total2022 ? 'Increase' : 'Decrease'})`);

  // Monthly averages
  console.log('\n\n📊 Monthly Averages:\n');
  console.log(`2022: ${(total2022 / 12).toFixed(1)} tCO2e/month`);
  console.log(`2023: ${(total2023 / 12).toFixed(1)} tCO2e/month`);
  console.log(`2024: ${(total2024 / 12).toFixed(1)} tCO2e/month`);
  console.log(`2025: ${(total2025 / 12).toFixed(1)} tCO2e/month`);

  // Find highest and lowest months
  console.log('\n\n🔍 Notable Months:\n');

  // Highest emissions
  let maxVal = 0;
  let maxMonth = '';
  let maxYear = '';

  for (let i = 0; i < 12; i++) {
    if (data2022[i] > maxVal) { maxVal = data2022[i]; maxMonth = monthNames[i]; maxYear = '2022'; }
    if (data2023[i] > maxVal) { maxVal = data2023[i]; maxMonth = monthNames[i]; maxYear = '2023'; }
    if (data2024[i] > maxVal) { maxVal = data2024[i]; maxMonth = monthNames[i]; maxYear = '2024'; }
    if (data2025[i] > maxVal) { maxVal = data2025[i]; maxMonth = monthNames[i]; maxYear = '2025'; }
  }

  console.log(`Highest month: ${maxMonth} ${maxYear} (${maxVal.toFixed(1)} tCO2e)`);

  // Lowest emissions (excluding zeros)
  let minVal = Infinity;
  let minMonth = '';
  let minYear = '';

  for (let i = 0; i < 12; i++) {
    if (data2022[i] > 0 && data2022[i] < minVal) { minVal = data2022[i]; minMonth = monthNames[i]; minYear = '2022'; }
    if (data2023[i] > 0 && data2023[i] < minVal) { minVal = data2023[i]; minMonth = monthNames[i]; minYear = '2023'; }
    if (data2024[i] > 0 && data2024[i] < minVal) { minVal = data2024[i]; minMonth = monthNames[i]; minYear = '2024'; }
    if (data2025[i] > 0 && data2025[i] < minVal) { minVal = data2025[i]; minMonth = monthNames[i]; minYear = '2025'; }
  }

  console.log(`Lowest month: ${minMonth} ${minYear} (${minVal.toFixed(1)} tCO2e)`);

  // Biggest improvements and deteriorations
  console.log('\n\n📉 Biggest Improvements (2024→2025):\n');
  const changes2425 = data2024.map((val, i) => ({
    month: monthNames[i],
    val2024: val,
    val2025: data2025[i],
    change: val > 0 ? ((data2025[i] - val) / val * 100) : 0
  })).filter(x => x.val2024 > 0);

  changes2425.sort((a, b) => a.change - b.change).slice(0, 3).forEach((x, i) => {
    console.log(`${i + 1}. ${x.month}: ${x.val2024.toFixed(1)} → ${x.val2025.toFixed(1)} tCO2e (${x.change.toFixed(1)}%)`);
  });

  console.log('\n📈 Biggest Increases (2024→2025):\n');
  changes2425.sort((a, b) => b.change - a.change).slice(0, 3).forEach((x, i) => {
    console.log(`${i + 1}. ${x.month}: ${x.val2024.toFixed(1)} → ${x.val2025.toFixed(1)} tCO2e (+${x.change.toFixed(1)}%)`);
  });
}

compareMonthlyEmissions().catch(console.error);
