#!/usr/bin/env node

/**
 * Generate Water Forecasts for Nov-Dec 2025
 *
 * Uses ALL available data (Jan 2022 - Oct 2025 = 46 months) to forecast
 * the remaining 2 months of 2025 (November and December).
 *
 * This leverages both:
 * - Historical data (2022-2024): 36 months
 * - Recent actuals (Jan-Oct 2025): 10 months (Prophet forecasts now as actual data)
 *
 * Total training data: 46 months → Forecast: 2 months
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: '15.236.11.53',
  port: 5432,
  user: 'postgres',
  password: 'MG5faEtcGRvBWkn1',
  database: 'postgres'
});

const PROPHET_SERVICE_URL = process.env.PROPHET_SERVICE_URL || 'http://localhost:8001';

const WATER_METRICS = [
  { code: 'gri_303_3_withdrawal_total', name: 'Total Water Withdrawal', category: 'withdrawal' },
  { code: 'gri_303_4_discharge_total', name: 'Total Water Discharge', category: 'discharge' },
  { code: 'gri_303_5_consumption_total', name: 'Total Water Consumption', category: 'consumption' },
  { code: 'water_recycled_grey_water', name: 'Grey Water Recycled', category: 'recycled' },
];

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔮 Generating Water Forecasts for Nov-Dec 2025 using Prophet\n');
    console.log(`Prophet Service: ${PROPHET_SERVICE_URL}`);
    console.log(`Training Data: Jan 2022 - Oct 2025 (46 months)`);
    console.log(`Forecast Period: Nov-Dec 2025 (2 months)\n`);

    // Check Prophet service health
    try {
      const health = await axios.get(`${PROPHET_SERVICE_URL}/health`, { timeout: 5000 });
      console.log('✅ Prophet service healthy:', health.data);
    } catch (error) {
      console.error('❌ Prophet service not available at', PROPHET_SERVICE_URL);
      console.error('   Make sure to start it: cd services/forecast-service && ./venv/bin/python main.py');
      process.exit(1);
    }

    // Get organization
    const orgResult = await client.query(`SELECT id FROM organizations WHERE name = 'PLMJ'`);
    if (orgResult.rows.length === 0) {
      throw new Error('PLMJ organization not found');
    }
    const organizationId = orgResult.rows[0].id;
    console.log(`\n✅ Organization: PLMJ (${organizationId})\n`);

    // Get sites
    const sitesResult = await client.query(`
      SELECT id, name FROM sites
      WHERE organization_id = $1
      ORDER BY name
    `, [organizationId]);

    const sites = sitesResult.rows;
    console.log(`✅ Sites: ${sites.length}\n`);
    sites.forEach(site => console.log(`   - ${site.name}`));
    console.log('');

    let totalForecasts = 0;
    let successfulForecasts = 0;
    let failedForecasts = 0;

    // Generate forecasts for each site × metric
    for (const site of sites) {
      console.log(`\n📍 ${site.name}\n${'='.repeat(60)}`);

      for (const metric of WATER_METRICS) {
        totalForecasts++;
        console.log(`\n🎯 ${metric.name}`);

        try {
          // Fetch ALL historical data: Jan 2022 - Oct 2025 (46 months)
          // This includes both original historical data AND the Prophet forecasts we just inserted
          const historicalResult = await client.query(`
            SELECT
              TO_CHAR(md.period_start, 'YYYY-MM-01') as date,
              SUM(md.value) as value
            FROM metrics_data md
            JOIN metrics_catalog mc ON md.metric_id = mc.id
            WHERE md.organization_id = $1
              AND md.site_id = $2
              AND mc.code = $3
              AND md.period_start >= '2022-01-01'
              AND md.period_start <= '2025-10-31'
            GROUP BY TO_CHAR(md.period_start, 'YYYY-MM-01')
            ORDER BY date
          `, [organizationId, site.id, metric.code]);

          const historicalData = historicalResult.rows;

          if (historicalData.length < 12) {
            console.log(`   ⚠️  Insufficient data (${historicalData.length} months) - skipping`);
            failedForecasts++;
            continue;
          }

          console.log(`   📊 Historical: ${historicalData.length} months`);
          console.log(`   📅 Range: ${historicalData[0].date} to ${historicalData[historicalData.length - 1].date}`);
          console.log(`   🧮 Training with ${historicalData.length} months to forecast 2 months (Nov-Dec 2025)`);

          // Call Prophet service
          console.log(`   🤖 Calling Prophet service...`);

          const prophetRequest = {
            domain: 'water',
            organizationId,
            historicalData: historicalData.map(row => ({
              date: row.date,
              value: parseFloat(row.value)
            })),
            monthsToForecast: 2 // Only Nov-Dec 2025
          };

          const prophetResponse = await axios.post(
            `${PROPHET_SERVICE_URL}/predict`,
            prophetRequest,
            { timeout: 30000 }
          );

          const forecast = prophetResponse.data;

          console.log(`   ✅ Forecast generated: ${forecast.forecasted.length} months`);
          console.log(`   📈 Trend: ${forecast.metadata.trend.toFixed(2)}`);
          console.log(`   📊 Mean: ${forecast.metadata.historical_mean.toFixed(2)} m³`);

          // Find existing ml_predictions record to update
          const existingPrediction = await client.query(`
            SELECT
              id,
              prediction::jsonb as prediction,
              confidence_lower::jsonb as confidence_lower,
              confidence_upper::jsonb as confidence_upper
            FROM ml_predictions
            WHERE organization_id = $1
              AND site_id = $2
              AND prediction_type = 'forecast'
              AND metadata->>'metric_code' = $3
          `, [organizationId, site.id, metric.code]);

          if (existingPrediction.rows.length === 0) {
            console.log(`   ⚠️  No existing prediction found for ${metric.code} - skipping`);
            console.log(`   💡 Run generate-water-forecasts-2025.js first to create initial predictions`);
            failedForecasts++;
            continue;
          }

          const existing = existingPrediction.rows[0];

          // Append Nov-Dec forecasts to existing 10 months to make it 12 months
          const updatedForecast = [...existing.prediction, forecast.forecasted[0], forecast.forecasted[1]];
          const updatedLower = [...existing.confidence_lower, forecast.confidence.lower[0], forecast.confidence.lower[1]];
          const updatedUpper = [...existing.confidence_upper, forecast.confidence.upper[0], forecast.confidence.upper[1]];

          // Update ml_predictions with 12-month forecast
          await client.query(`
            UPDATE ml_predictions SET
              prediction = $1::jsonb,
              confidence_lower = $2::jsonb,
              confidence_upper = $3::jsonb,
              metadata = jsonb_set(
                metadata,
                '{forecast_horizon}',
                '12'
              ),
              created_at = NOW()
            WHERE id = $4
          `, [
            JSON.stringify(updatedForecast),
            JSON.stringify(updatedLower),
            JSON.stringify(updatedUpper),
            existingPrediction.rows[0].id
          ]);

          console.log(`   ✅ Nov 2025: ${forecast.forecasted[0].toFixed(2)} m³ (${forecast.confidence.lower[0].toFixed(2)} - ${forecast.confidence.upper[0].toFixed(2)})`);
          console.log(`   ✅ Dec 2025: ${forecast.forecasted[1].toFixed(2)} m³ (${forecast.confidence.lower[1].toFixed(2)} - ${forecast.confidence.upper[1].toFixed(2)})`);
          console.log(`   💾 Updated ml_predictions: 10 → 12 months`);

          successfulForecasts++;

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          failedForecasts++;
        }
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 Summary:');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total forecasts: ${totalForecasts}`);
    console.log(`✅ Successful: ${successfulForecasts}`);
    console.log(`❌ Failed: ${failedForecasts}`);
    console.log(`Success rate: ${((successfulForecasts / totalForecasts) * 100).toFixed(1)}%`);

    if (successfulForecasts > 0) {
      console.log(`\n✅ Water forecasts for Nov-Dec 2025 generated successfully!`);
      console.log(`\nTraining data: Jan 2022 - Oct 2025 (46 months)`);
      console.log(`Forecasts inserted: Nov-Dec 2025 (2 months)`);
      console.log(`\n2025 is now complete: Jan-Dec (12 months)!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
