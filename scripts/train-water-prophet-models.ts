#!/usr/bin/env ts-node

/**
 * Train Prophet Models for Water Metrics Forecasting
 *
 * Uses 36 months of historical data (2022-2024) to forecast 2025
 *
 * Models trained:
 * - Per site (Lisboa, Porto, Faro)
 * - Per metric (withdrawal, discharge, consumption, recycled)
 * - Forecast period: Jan 2025 - Oct 2025
 */

import { Pool } from 'pg';
import { ProphetForecastService } from '../src/lib/forecasting/prophet-forecast-service';

const pool = new Pool({
  host: '15.236.11.53',
  port: 5432,
  user: 'postgres',
  password: 'MG5faEtcGRvBWkn1',
  database: 'postgres'
});

interface WaterMetric {
  code: string;
  name: string;
  category: string;
}

const WATER_METRICS: WaterMetric[] = [
  { code: 'gri_303_3_withdrawal_total', name: 'Total Water Withdrawal', category: 'withdrawal' },
  { code: 'gri_303_4_discharge_total', name: 'Total Water Discharge', category: 'discharge' },
  { code: 'gri_303_5_consumption_total', name: 'Total Water Consumption', category: 'consumption' },
  { code: 'water_recycled_grey_water', name: 'Grey Water Recycled', category: 'recycled' },
];

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔮 Starting Prophet Model Training for Water Metrics\n');

    // Get organization ID
    const orgResult = await client.query(`
      SELECT id FROM organizations WHERE name = 'PLMJ'
    `);

    if (orgResult.rows.length === 0) {
      throw new Error('PLMJ organization not found');
    }

    const organizationId = orgResult.rows[0].id;
    console.log(`✅ Organization: PLMJ (${organizationId})\n`);

    // Get sites
    const sitesResult = await client.query(`
      SELECT id, name FROM sites
      WHERE organization_id = $1
      ORDER BY name
    `, [organizationId]);

    const sites = sitesResult.rows;
    console.log(`✅ Found ${sites.length} sites:\n`);
    sites.forEach(site => console.log(`   - ${site.name} (${site.id})`));
    console.log('');

    // Initialize Prophet service
    const prophetService = new ProphetForecastService();

    let totalModels = 0;
    let successfulModels = 0;
    let failedModels = 0;

    // Train models for each site × metric combination
    for (const site of sites) {
      console.log(`\n📍 Site: ${site.name}\n${'='.repeat(60)}`);

      for (const metric of WATER_METRICS) {
        totalModels++;

        console.log(`\n🎯 Training: ${metric.name}`);

        try {
          // Fetch historical data (36 months: 2022-2024)
          const historicalData = await client.query(`
            SELECT
              DATE_TRUNC('month', md.period_start)::date as date,
              SUM(md.value) as value
            FROM metrics_data md
            JOIN metrics_catalog mc ON md.metric_id = mc.id
            WHERE md.organization_id = $1
              AND md.site_id = $2
              AND mc.code = $3
              AND md.period_start >= '2022-01-01'
              AND md.period_start <= '2024-12-31'
            GROUP BY DATE_TRUNC('month', md.period_start)
            ORDER BY date
          `, [organizationId, site.id, metric.code]);

          const dataPoints = historicalData.rows;

          if (dataPoints.length === 0) {
            console.log(`   ⚠️  No historical data - skipping`);
            failedModels++;
            continue;
          }

          console.log(`   📊 Historical data: ${dataPoints.length} months`);

          // Format data for Prophet
          const formattedData = dataPoints.map(row => ({
            ds: new Date(row.date).toISOString().split('T')[0],
            y: parseFloat(row.value),
          }));

          // Train Prophet model
          console.log(`   🤖 Training Prophet model...`);

          const forecastResult = await prophetService.forecast({
            organizationId,
            siteId: site.id,
            metricCode: metric.code,
            metricCategory: metric.category,
            historicalData: formattedData,
            forecastMonths: 10, // Jan 2025 - Oct 2025
            seasonalityMode: 'multiplicative', // Water usage has seasonal patterns
            changePointPriorScale: 0.05, // Moderate flexibility
          });

          if (forecastResult.success) {
            console.log(`   ✅ Model trained successfully`);
            console.log(`   📈 Forecast: ${forecastResult.forecast.length} months`);
            console.log(`   🎯 Confidence: ${(forecastResult.confidence * 100).toFixed(1)}%`);

            // Show sample forecast
            const sampleMonth = forecastResult.forecast[0];
            if (sampleMonth) {
              console.log(`   📅 Jan 2025 forecast: ${sampleMonth.total.toFixed(2)} m³`);
            }

            successfulModels++;
          } else {
            console.log(`   ❌ Training failed: ${forecastResult.error}`);
            failedModels++;
          }

        } catch (error: any) {
          console.log(`   ❌ Error: ${error.message}`);
          failedModels++;
        }
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 Training Summary:');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total models: ${totalModels}`);
    console.log(`✅ Successful: ${successfulModels}`);
    console.log(`❌ Failed: ${failedModels}`);
    console.log(`Success rate: ${((successfulModels / totalModels) * 100).toFixed(1)}%`);

    if (successfulModels > 0) {
      console.log(`\n✅ Prophet models ready for 2025 forecasting!`);
      console.log(`\nModels stored in: ml_model_storage table`);
      console.log(`Forecasts stored in: enterprise_forecast table`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
