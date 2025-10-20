import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// Forecast data by month (in kWh)
const forecastData = {
  'Electricity': {
    '2025-01': 34300,
    '2025-02': 35600,
    '2025-03': 42300,
    '2025-04': 36100,
    '2025-05': 43000,
    '2025-06': 36900,
    '2025-07': 43300,
    '2025-08': 41100,
    '2025-09': 46300
  },
  'Purchased Cooling': {
    '2025-01': 18800,
    '2025-02': 22500,
    '2025-03': 21900,
    '2025-04': 25600,
    '2025-05': 57700,
    '2025-06': 59000,
    '2025-07': 93400,
    '2025-08': 80400,
    '2025-09': 72100
  },
  'Purchased Heating': {
    '2025-01': 31900,
    '2025-02': 20000,
    '2025-03': 20300,
    '2025-04': 13600,
    '2025-05': 1500,
    '2025-06': 0,
    '2025-07': 0,
    '2025-08': 0,
    '2025-09': 0
  },
  'EV Charging': {
    '2025-01': 1600,
    '2025-02': 1300,
    '2025-03': 1100,
    '2025-04': 900,
    '2025-05': 700,
    '2025-06': 500,
    '2025-07': 200,
    '2025-08': 0,
    '2025-09': 0
  }
};

async function backfill2025Data() {
  console.log('🔄 Backfilling 2025 Energy Forecast Data (Jan-Sep)');
  console.log('=' .repeat(80));

  try {
    // Get metric IDs for each source
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics_catalog')
      .select('id, name, category')
      .in('name', Object.keys(forecastData));

    if (metricsError || !metrics) {
      console.error('❌ Error fetching metrics:', metricsError);
      return;
    }

    console.log(`\n📊 Found ${metrics.length} metrics to backfill\n`);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [sourceName, monthlyData] of Object.entries(forecastData)) {
      const metric = metrics.find(m => m.name === sourceName);

      if (!metric) {
        console.log(`⚠️  Metric not found: ${sourceName} - skipping`);
        continue;
      }

      console.log(`\n📈 Processing: ${sourceName} (${metric.id})`);

      for (const [monthKey, value] of Object.entries(monthlyData)) {
        if (value === 0) {
          console.log(`   ${monthKey}: Skipping (zero value)`);
          totalSkipped++;
          continue;
        }

        const periodStart = `${monthKey}-01`;
        const date = new Date(periodStart);
        const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const periodEndStr = periodEnd.toISOString().split('T')[0];

        // Check if data already exists
        const { data: existing } = await supabase
          .from('metrics_data')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('metric_id', metric.id)
          .eq('period_start', periodStart)
          .single();

        if (existing) {
          console.log(`   ${monthKey}: Already exists - skipping`);
          totalSkipped++;
          continue;
        }

        // Calculate emissions based on electricity factor (if applicable)
        let co2eEmissions = 0;
        if (sourceName === 'Electricity') {
          // Portugal grid emission factor ~0.3 kgCO2e/kWh
          co2eEmissions = value * 0.3;
        } else if (sourceName === 'Purchased Heating') {
          // Natural gas ~0.2 kgCO2e/kWh
          co2eEmissions = value * 0.2;
        }

        // Insert the data
        const { error: insertError } = await supabase
          .from('metrics_data')
          .insert({
            organization_id: organizationId,
            metric_id: metric.id,
            period_start: periodStart,
            period_end: periodEndStr,
            value: value,
            co2e_emissions: co2eEmissions,
            unit: 'kWh',
            metadata: {
              source: 'ml_forecast',
              model: 'enterprise-seasonal-decomposition',
              confidence: 0.99,
              forecast_date: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.log(`   ${monthKey}: ❌ Error - ${insertError.message}`);
        } else {
          console.log(`   ${monthKey}: ✅ Inserted ${(value / 1000).toFixed(1)} MWh (${co2eEmissions.toFixed(1)} kgCO2e)`);
          totalInserted++;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(80));
    console.log(`   ✅ Records inserted: ${totalInserted}`);
    console.log(`   ⏭️  Records skipped: ${totalSkipped}`);
    console.log('='.repeat(80));
    console.log('✅ Backfill complete!\n');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
  }
}

backfill2025Data();
