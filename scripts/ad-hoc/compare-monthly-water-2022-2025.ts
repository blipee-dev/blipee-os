import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function compareMonthlyWater() {
  console.log('💧 Monthly Water & Effluents Comparison: 2022-2025\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get all water-related metrics
  console.log('📥 Fetching water metrics...\n');

  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('*');

  const waterMetrics = allMetrics?.filter(m => {
    const nameLC = (m.name || '').toLowerCase();
    const categoryLC = (m.category || '').toLowerCase();

    return nameLC.includes('water') ||
           nameLC.includes('wastewater') ||
           categoryLC.includes('water');
  }) || [];

  console.log(`Found ${waterMetrics.length} water-related metrics:\n`);
  waterMetrics.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.category}) - ${m.unit}`);
  });

  const waterMetricIds = waterMetrics.map(m => m.id);

  // Fetch all water data with pagination
  console.log('\n📥 Fetching all water records...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('period_start, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .in('metric_id', waterMetricIds)
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

  console.log(`Total water records: ${allData.length}\n`);

  // Group by year-month
  const consumptionByYearMonth = new Map<string, number>();
  const emissionsByYearMonth = new Map<string, number>();

  allData.forEach(record => {
    const yearMonth = record.period_start.substring(0, 7);
    const consumption = record.value || 0;
    const emissions = record.co2e_emissions || 0;

    consumptionByYearMonth.set(yearMonth, (consumptionByYearMonth.get(yearMonth) || 0) + consumption);
    emissionsByYearMonth.set(yearMonth, (emissionsByYearMonth.get(yearMonth) || 0) + emissions);
  });

  // Extract data for each year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const consumption2022: number[] = [];
  const consumption2023: number[] = [];
  const consumption2024: number[] = [];
  const consumption2025: number[] = [];

  const emissions2022: number[] = [];
  const emissions2023: number[] = [];
  const emissions2024: number[] = [];
  const emissions2025: number[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = String(month).padStart(2, '0');

    // Consumption in m³ (thousands)
    consumption2022.push((consumptionByYearMonth.get(`2022-${monthStr}`) || 0));
    consumption2023.push((consumptionByYearMonth.get(`2023-${monthStr}`) || 0));
    consumption2024.push((consumptionByYearMonth.get(`2024-${monthStr}`) || 0));
    consumption2025.push((consumptionByYearMonth.get(`2025-${monthStr}`) || 0));

    // Emissions in tCO2e
    emissions2022.push((emissionsByYearMonth.get(`2022-${monthStr}`) || 0) / 1000);
    emissions2023.push((emissionsByYearMonth.get(`2023-${monthStr}`) || 0) / 1000);
    emissions2024.push((emissionsByYearMonth.get(`2024-${monthStr}`) || 0) / 1000);
    emissions2025.push((emissionsByYearMonth.get(`2025-${monthStr}`) || 0) / 1000);
  }

  // Print CONSUMPTION comparison table
  console.log('📊 Monthly Water CONSUMPTION Comparison (2022-2025)\n');
  console.log('| Month | 2022       | 2023       | 2024       | 2025       | Δ 22→23  | Δ 23→24  | Δ 24→25  |');
  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');

  for (let i = 0; i < 12; i++) {
    const month = monthNames[i];
    const val2022 = consumption2022[i];
    const val2023 = consumption2023[i];
    const val2024 = consumption2024[i];
    const val2025 = consumption2025[i];

    const change2223 = val2022 > 0 ? ((val2023 - val2022) / val2022 * 100) : 0;
    const change2324 = val2023 > 0 ? ((val2024 - val2023) / val2023 * 100) : 0;
    const change2425 = val2024 > 0 ? ((val2025 - val2024) / val2024 * 100) : 0;

    const formatChange = (change: number) => {
      const abs = Math.abs(change);
      const sign = change >= 0 ? '+' : '';
      let str = `${sign}${change.toFixed(1)}%`;

      if (abs > 40) str += ' ⭐';
      else if (abs > 30) str += ' ✨';

      return str.padEnd(9);
    };

    console.log(
      `| ${month}   | ` +
      `${val2022.toFixed(1).padStart(8)} m³ | ` +
      `${val2023.toFixed(1).padStart(8)} m³ | ` +
      `${val2024.toFixed(1).padStart(8)} m³ | ` +
      `${val2025.toFixed(1).padStart(8)} m³ | ` +
      `${formatChange(change2223)} | ` +
      `${formatChange(change2324)} | ` +
      `${formatChange(change2425)} |`
    );
  }

  // Consumption totals
  const totalConsumption2022 = consumption2022.reduce((a, b) => a + b, 0);
  const totalConsumption2023 = consumption2023.reduce((a, b) => a + b, 0);
  const totalConsumption2024 = consumption2024.reduce((a, b) => a + b, 0);
  const totalConsumption2025 = consumption2025.reduce((a, b) => a + b, 0);

  const totalChangeC2223 = ((totalConsumption2023 - totalConsumption2022) / totalConsumption2022 * 100);
  const totalChangeC2324 = ((totalConsumption2024 - totalConsumption2023) / totalConsumption2023 * 100);
  const totalChangeC2425 = ((totalConsumption2025 - totalConsumption2024) / totalConsumption2024 * 100);

  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');
  console.log(
    `| **TOTAL** | ` +
    `**${totalConsumption2022.toFixed(1).padStart(6)} m³** | ` +
    `**${totalConsumption2023.toFixed(1).padStart(6)} m³** | ` +
    `**${totalConsumption2024.toFixed(1).padStart(6)} m³** | ` +
    `**${totalConsumption2025.toFixed(1).padStart(6)} m³** | ` +
    `**${totalChangeC2223 >= 0 ? '+' : ''}${totalChangeC2223.toFixed(1)}%** | ` +
    `**${totalChangeC2324 >= 0 ? '+' : ''}${totalChangeC2324.toFixed(1)}%** | ` +
    `**${totalChangeC2425 >= 0 ? '+' : ''}${totalChangeC2425.toFixed(1)}%** |`
  );

  // Print EMISSIONS comparison table
  console.log('\n\n📊 Monthly Water EMISSIONS Comparison (2022-2025)\n');
  console.log('| Month | 2022       | 2023       | 2024       | 2025       | Δ 22→23  | Δ 23→24  | Δ 24→25  |');
  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');

  for (let i = 0; i < 12; i++) {
    const month = monthNames[i];
    const val2022 = emissions2022[i];
    const val2023 = emissions2023[i];
    const val2024 = emissions2024[i];
    const val2025 = emissions2025[i];

    const change2223 = val2022 > 0 ? ((val2023 - val2022) / val2022 * 100) : 0;
    const change2324 = val2023 > 0 ? ((val2024 - val2023) / val2023 * 100) : 0;
    const change2425 = val2024 > 0 ? ((val2025 - val2024) / val2024 * 100) : 0;

    const formatChange = (change: number) => {
      const abs = Math.abs(change);
      const sign = change >= 0 ? '+' : '';
      let str = `${sign}${change.toFixed(1)}%`;

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

  // Emissions totals
  const totalEmissions2022 = emissions2022.reduce((a, b) => a + b, 0);
  const totalEmissions2023 = emissions2023.reduce((a, b) => a + b, 0);
  const totalEmissions2024 = emissions2024.reduce((a, b) => a + b, 0);
  const totalEmissions2025 = emissions2025.reduce((a, b) => a + b, 0);

  const totalChangeE2223 = ((totalEmissions2023 - totalEmissions2022) / totalEmissions2022 * 100);
  const totalChangeE2324 = ((totalEmissions2024 - totalEmissions2023) / totalEmissions2023 * 100);
  const totalChangeE2425 = ((totalEmissions2025 - totalEmissions2024) / totalEmissions2024 * 100);

  console.log('|-------|------------|------------|------------|------------|----------|----------|----------|');
  console.log(
    `| **TOTAL** | ` +
    `**${totalEmissions2022.toFixed(1).padStart(6)} t** | ` +
    `**${totalEmissions2023.toFixed(1).padStart(6)} t** | ` +
    `**${totalEmissions2024.toFixed(1).padStart(6)} t** | ` +
    `**${totalEmissions2025.toFixed(1).padStart(6)} t** | ` +
    `**${totalChangeE2223 >= 0 ? '+' : ''}${totalChangeE2223.toFixed(1)}%** | ` +
    `**${totalChangeE2324 >= 0 ? '+' : ''}${totalChangeE2324.toFixed(1)}%** | ` +
    `**${totalChangeE2425 >= 0 ? '+' : ''}${totalChangeE2425.toFixed(1)}%** |`
  );

  // Summary
  console.log('\n\n📊 Year-over-Year Summary:\n');

  console.log('CONSUMPTION:');
  console.log(`2022 Total: ${totalConsumption2022.toFixed(1)} m³`);
  console.log(`2023 Total: ${totalConsumption2023.toFixed(1)} m³ (${totalChangeC2223 >= 0 ? '+' : ''}${totalChangeC2223.toFixed(1)}% vs 2022)`);
  console.log(`2024 Total: ${totalConsumption2024.toFixed(1)} m³ (${totalChangeC2324 >= 0 ? '+' : ''}${totalChangeC2324.toFixed(1)}% vs 2023)`);
  console.log(`2025 Total: ${totalConsumption2025.toFixed(1)} m³ (${totalChangeC2425 >= 0 ? '+' : ''}${totalChangeC2425.toFixed(1)}% vs 2024)`);

  console.log('\nEMISSIONS:');
  console.log(`2022 Total: ${totalEmissions2022.toFixed(1)} tCO2e`);
  console.log(`2023 Total: ${totalEmissions2023.toFixed(1)} tCO2e (${totalChangeE2223 >= 0 ? '+' : ''}${totalChangeE2223.toFixed(1)}% vs 2022)`);
  console.log(`2024 Total: ${totalEmissions2024.toFixed(1)} tCO2e (${totalChangeE2324 >= 0 ? '+' : ''}${totalChangeE2324.toFixed(1)}% vs 2023)`);
  console.log(`2025 Total: ${totalEmissions2025.toFixed(1)} tCO2e (${totalChangeE2425 >= 0 ? '+' : ''}${totalChangeE2425.toFixed(1)}% vs 2024)`);

  // Water intensity
  console.log('\n\n📈 Water Intensity (tCO2e/m³):\n');
  console.log(`2022: ${(totalEmissions2022 / totalConsumption2022).toFixed(6)} tCO2e/m³`);
  console.log(`2023: ${(totalEmissions2023 / totalConsumption2023).toFixed(6)} tCO2e/m³`);
  console.log(`2024: ${(totalEmissions2024 / totalConsumption2024).toFixed(6)} tCO2e/m³`);
  console.log(`2025: ${(totalEmissions2025 / totalConsumption2025).toFixed(6)} tCO2e/m³`);
}

compareMonthlyWater().catch(console.error);
