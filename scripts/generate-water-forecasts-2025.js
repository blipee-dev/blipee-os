#!/usr/bin/env node

/**
 * Generate Water Forecasts for 2025 using Prophet Service
 *
 * Uses 36 months of historical data (2022-2024) to forecast Jan-Oct 2025
 *
 * For each site (Lisboa, Porto, Faro) and metric (withdrawal, discharge, consumption, recycled)
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
    console.log('🔮 Generating Water Forecasts for 2025 using Prophet\n');
    console.log(`Prophet Service: ${PROPHET_SERVICE_URL}\n`);

    // Check Prophet service health
    try {
      const health = await axios.get(`${PROPHET_SERVICE_URL}/health`, { timeout: 5000 });
      console.log('✅ Prophet service healthy:', health.data);
    } catch (error) {
      console.error('❌ Prophet service not available at', PROPHET_SERVICE_URL);
      console.error('   Make sure to start it: cd services/forecast-service && python main.py');
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
          // Fetch historical data (36 months: 2022-2024)
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
              AND md.period_start <= '2024-12-31'
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

          // Call Prophet service
          console.log(`   🤖 Calling Prophet service...`);

          const prophetRequest = {
            domain: 'water',
            organizationId,
            historicalData: historicalData.map(row => ({
              date: row.date,
              value: parseFloat(row.value)
            })),
            monthsToForecast: 12 // Jan 2025 - Dec 2025 (full year)
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

          // Save to ml_predictions table
          const metadata = {
            metric_id: metric.code,
            metric_code: metric.code,
            category: 'Purchased Goods & Services', // ✅ Match ProphetForecastService query
            subcategory: 'Water',                  // ✅ Match ProphetForecastService query
            water_metric_type: metric.category,    // withdrawal/discharge/consumption/recycled
            metric_name: metric.name,
            site_id: site.id,
            site_name: site.name,
            method: 'prophet',
            trend: forecast.metadata.trend,
            yearly: forecast.metadata.yearly,
            historical_mean: forecast.metadata.historical_mean,
            historical_std: forecast.metadata.historical_std,
            data_points: forecast.metadata.data_points,
            forecast_horizon: forecast.metadata.forecast_horizon,
            generated_at: new Date().toISOString()
          };

          // ✅ Format as JSON arrays (not PostgreSQL arrays)
          const predictionJson = JSON.stringify(forecast.forecasted);
          const confidenceLowerJson = JSON.stringify(forecast.confidence.lower);
          const confidenceUpperJson = JSON.stringify(forecast.confidence.upper);
          const metadataJson = JSON.stringify(metadata);

          // Check if prediction already exists
          const existingResult = await client.query(`
            SELECT id FROM ml_predictions
            WHERE organization_id = $1
              AND site_id = $2
              AND prediction_type = 'forecast'
              AND metadata->>'metric_code' = $3
          `, [organizationId, site.id, metric.code]);

          if (existingResult.rows.length > 0) {
            // Update existing prediction
            await client.query(`
              UPDATE ml_predictions SET
                prediction = $1::jsonb,
                confidence_lower = $2::jsonb,
                confidence_upper = $3::jsonb,
                metadata = $4::jsonb,
                created_at = NOW()
              WHERE id = $5
            `, [
              predictionJson,
              confidenceLowerJson,
              confidenceUpperJson,
              metadataJson,
              existingResult.rows[0].id
            ]);
            console.log(`   💾 Updated existing prediction (${existingResult.rows[0].id})`);
          } else {
            // Insert new prediction
            await client.query(`
              INSERT INTO ml_predictions (
                organization_id,
                site_id,
                model_id,
                prediction_type,
                input_data,
                prediction,
                confidence_lower,
                confidence_upper,
                metadata
              ) VALUES ($1, $2, NULL, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)
            `, [
              organizationId,
              site.id,
              'forecast',
              JSON.stringify({ monthsToForecast: 10, domain: 'water' }),
              predictionJson,
              confidenceLowerJson,
              confidenceUpperJson,
              metadataJson
            ]);
            console.log(`   💾 Saved new prediction`);
          }

          console.log(`   💾 Saved to ml_predictions`);

          // Show sample forecast
          console.log(`   📅 Jan 2025: ${forecast.forecasted[0].toFixed(2)} m³ (${forecast.confidence.lower[0].toFixed(2)} - ${forecast.confidence.upper[0].toFixed(2)})`);

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
      console.log(`\n✅ Water forecasts for 2025 generated successfully!`);
      console.log(`\nForecasts stored in: ml_predictions table`);
      console.log(`Coverage: Jan 2025 - Oct 2025`);
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
