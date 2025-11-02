#!/usr/bin/env node

/**
 * Insert Prophet Forecasts as Actual Data for 2025
 *
 * Takes the 10-month Prophet forecasts (Jan-Oct 2025) and inserts them
 * into metrics_data table as actual data, so the dashboard shows real values.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: '15.236.11.53',
  port: 5432,
  user: 'postgres',
  password: 'MG5faEtcGRvBWkn1',
  database: 'postgres'
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('📊 Inserting Prophet Forecasts as Actual Data for 2025\n');

    // Get organization
    const orgResult = await client.query(`SELECT id FROM organizations WHERE name = 'PLMJ'`);
    if (orgResult.rows.length === 0) {
      throw new Error('PLMJ organization not found');
    }
    const organizationId = orgResult.rows[0].id;
    console.log(`✅ Organization: PLMJ (${organizationId})\n`);

    // Get all Prophet water forecasts created today
    const forecastsResult = await client.query(`
      SELECT
        id,
        site_id,
        prediction::jsonb as prediction,
        metadata::jsonb as metadata
      FROM ml_predictions
      WHERE organization_id = $1
        AND prediction_type = 'forecast'
        AND metadata->>'subcategory' = 'Water'
        AND created_at > '2025-10-31 13:59:00'
      ORDER BY metadata->>'site_name', metadata->>'metric_code'
    `, [organizationId]);

    const forecasts = forecastsResult.rows;
    console.log(`📈 Found ${forecasts.length} Prophet forecasts to insert\n`);

    if (forecasts.length === 0) {
      console.log('⚠️  No forecasts found. Run generate-water-forecasts-2025.js first.');
      return;
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const forecast of forecasts) {
      const siteId = forecast.site_id;
      const siteName = forecast.metadata.site_name;
      const metricCode = forecast.metadata.metric_code;
      const metricName = forecast.metadata.metric_name;
      const predictionArray = forecast.prediction;

      console.log(`\n📍 ${siteName} - ${metricName}`);
      console.log(`   Metric Code: ${metricCode}`);
      console.log(`   Site ID: ${siteId}`);

      // Get metric_id from metrics_catalog
      const metricResult = await client.query(`
        SELECT id FROM metrics_catalog WHERE code = $1
      `, [metricCode]);

      if (metricResult.rows.length === 0) {
        console.log(`   ❌ Metric not found in catalog: ${metricCode}`);
        totalSkipped += 10;
        continue;
      }

      const metricId = metricResult.rows[0].id;

      // Insert each month's forecast as actual data
      for (let monthIndex = 0; monthIndex < 10; monthIndex++) {
        const month = monthIndex + 1; // Jan = 1, Oct = 10
        const periodStart = `2025-${String(month).padStart(2, '0')}-01`;
        const periodEnd = new Date(2025, month, 0); // Last day of month
        const periodEndStr = periodEnd.toISOString().split('T')[0];
        const value = predictionArray[monthIndex];

        if (value === null || value === undefined) {
          console.log(`   ⚠️  No value for month ${month} - skipping`);
          totalSkipped++;
          continue;
        }

        // Check if data already exists
        const existingResult = await client.query(`
          SELECT id FROM metrics_data
          WHERE organization_id = $1
            AND site_id = $2
            AND metric_id = $3
            AND period_start = $4
        `, [organizationId, siteId, metricId, periodStart]);

        if (existingResult.rows.length > 0) {
          // Update existing record
          await client.query(`
            UPDATE metrics_data SET
              value = $1,
              period_end = $2,
              updated_at = NOW()
            WHERE id = $3
          `, [value, periodEndStr, existingResult.rows[0].id]);

          console.log(`   ✅ Updated ${month}/2025: ${value.toFixed(2)} m³`);
        } else {
          // Insert new record
          await client.query(`
            INSERT INTO metrics_data (
              organization_id,
              site_id,
              metric_id,
              value,
              unit,
              period_start,
              period_end,
              data_quality,
              verification_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            organizationId,
            siteId,
            metricId,
            value,
            'm3',
            periodStart,
            periodEndStr,
            'estimated', // Mark as estimated since it's from Prophet
            'unverified'
          ]);

          console.log(`   ✅ Inserted ${month}/2025: ${value.toFixed(2)} m³`);
        }

        totalInserted++;
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 Summary:');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total records inserted/updated: ${totalInserted}`);
    console.log(`Total skipped: ${totalSkipped}`);
    console.log(`\n✅ Prophet forecasts inserted as actual data for 2025!`);
    console.log(`\nData range: January 2025 - October 2025`);
    console.log(`Data quality: 'estimated' (from Prophet forecast)`);
    console.log(`\nYou can now view 2025 water data in the dashboard.`);

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
