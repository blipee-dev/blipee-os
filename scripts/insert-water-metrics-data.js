#!/usr/bin/env node

/**
 * Insert Calculated Water Metrics into Database
 * Replaces incorrect water metrics with GRI 303 compliant values
 */

const { Pool } = require('pg');
const fs = require('fs');

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
    console.log('📊 Starting Water Metrics Data Insertion\n');

    // Read calculated metrics
    const calculatedData = JSON.parse(
      fs.readFileSync('./scripts/calculated-water-metrics.json', 'utf8')
    );

    console.log(`✅ Loaded ${calculatedData.length} calculated records\n`);

    // Get organization ID for PLMJ
    const orgResult = await client.query(`
      SELECT id FROM organizations WHERE name = 'PLMJ'
    `);

    if (orgResult.rows.length === 0) {
      throw new Error('PLMJ organization not found!');
    }

    const organizationId = orgResult.rows[0].id;
    console.log(`✅ Found PLMJ organization: ${organizationId}\n`);

    // Get site IDs
    const sitesResult = await client.query(`
      SELECT id, name FROM sites WHERE organization_id = $1
    `, [organizationId]);

    const siteMap = {};
    sitesResult.rows.forEach(row => {
      // Map site names from JSON to database
      if (row.name.includes('Lisboa') || row.name.includes('FPM41')) {
        siteMap['Lisboa - FPM41'] = row.id;
      } else if (row.name.includes('Porto') || row.name.includes('POP')) {
        siteMap['Porto - POP'] = row.id;
      } else if (row.name.includes('Faro')) {
        siteMap['Faro'] = row.id;
      }
    });

    console.log('✅ Site Mapping:');
    Object.entries(siteMap).forEach(([name, id]) => {
      console.log(`   ${name}: ${id}`);
    });
    console.log('');

    // Get metric IDs for all GRI 303 metrics we need
    const metricsResult = await client.query(`
      SELECT id, code FROM metrics_catalog
      WHERE code IN (
        'gri_303_3_withdrawal_total',
        'gri_303_3_municipal_freshwater',
        'gri_303_4_discharge_total',
        'gri_303_4_discharge_sewer',
        'gri_303_4_discharge_tertiary',
        'gri_303_5_consumption_total',
        'gri_303_5_consumption_human',
        'gri_303_5_consumption_evaporation',
        'water_recycled_grey_water',
        'water_reuse_rate',
        'water_return_rate',
        'scope3_water_kitchen',
        'scope3_water_toilet',
        'scope3_water_cleaning',
        'scope3_water_irrigation',
        'scope3_water_recycled_toilet'
      )
    `);

    const metricMap = {};
    metricsResult.rows.forEach(row => {
      metricMap[row.code] = row.id;
    });

    console.log(`✅ Found ${Object.keys(metricMap).length} water metrics in catalog\n`);

    // Delete existing water metrics for PLMJ to avoid duplicates
    console.log('🗑️  Deleting existing water metrics for PLMJ...');
    const deleteResult = await client.query(`
      DELETE FROM metrics_data
      WHERE organization_id = $1
        AND metric_id IN (SELECT id FROM metrics_catalog WHERE code LIKE '%water%' OR code LIKE 'gri_303%')
    `, [organizationId]);

    console.log(`   Deleted ${deleteResult.rowCount} existing records\n`);

    // Insert new calculated data
    console.log('💾 Inserting calculated water metrics...\n');

    let insertCount = 0;

    for (const record of calculatedData) {
      // Skip records with zero throughput
      if (record.total_throughput_m3 === 0) continue;

      const siteId = siteMap[record.site];
      if (!siteId) {
        console.warn(`⚠️  Site not found: ${record.site}`);
        continue;
      }

      const periodStart = `${record.year}-${String(record.month).padStart(2, '0')}-01`;
      const periodEnd = new Date(record.year, record.month, 0).toISOString().split('T')[0];

      // Prepare metrics to insert
      const metricsToInsert = [
        // GRI 303-3: Withdrawal
        {
          code: 'gri_303_3_withdrawal_total',
          value: record.fresh_withdrawal_m3,
          unit: 'm³'
        },
        {
          code: 'gri_303_3_municipal_freshwater',
          value: record.fresh_withdrawal_m3,
          unit: 'm³'
        },

        // GRI 303-4: Discharge
        {
          code: 'gri_303_4_discharge_total',
          value: record.water_discharged_m3,
          unit: 'm³'
        },
        {
          code: 'gri_303_4_discharge_sewer',
          value: record.water_discharged_m3,
          unit: 'm³'
        },
        {
          code: 'gri_303_4_discharge_tertiary',
          value: record.water_discharged_m3,
          unit: 'm³'
        },

        // GRI 303-5: Consumption
        {
          code: 'gri_303_5_consumption_total',
          value: record.water_consumed_m3,
          unit: 'm³'
        }
      ];

      // Add consumption breakdown if available
      if (record.drinking_kitchen_m3) {
        const drinkingConsumed = record.fresh_withdrawal_m3 * 0.015;
        metricsToInsert.push({
          code: 'gri_303_5_consumption_human',
          value: drinkingConsumed,
          unit: 'm³'
        });
      }

      if (record.cleaning_m3) {
        const cleaningEvaporated = record.fresh_withdrawal_m3 * 0.002;
        metricsToInsert.push({
          code: 'gri_303_5_consumption_evaporation',
          value: cleaningEvaporated,
          unit: 'm³'
        });
      }

      // Add breakdown metrics if available
      if (record.drinking_kitchen_m3) {
        metricsToInsert.push({
          code: 'scope3_water_kitchen',
          value: record.drinking_kitchen_m3,
          unit: 'm³'
        });
      }

      if (record.sanitary_m3) {
        metricsToInsert.push({
          code: 'scope3_water_toilet',
          value: record.sanitary_m3,
          unit: 'm³'
        });
      }

      if (record.cleaning_m3) {
        metricsToInsert.push({
          code: 'scope3_water_cleaning',
          value: record.cleaning_m3,
          unit: 'm³'
        });
      }

      if (record.irrigation_m3 > 0) {
        metricsToInsert.push({
          code: 'scope3_water_irrigation',
          value: record.irrigation_m3,
          unit: 'm³'
        });
      }

      // Add grey water metrics if system exists
      if (record.has_grey_water_system && record.grey_water_reused_m3 > 0) {
        metricsToInsert.push({
          code: 'water_recycled_grey_water',
          value: record.grey_water_reused_m3,
          unit: 'm³'
        });

        metricsToInsert.push({
          code: 'scope3_water_recycled_toilet',
          value: record.grey_water_reused_m3,
          unit: 'm³'
        });

        metricsToInsert.push({
          code: 'water_reuse_rate',
          value: record.reuse_rate_percent,
          unit: '%'
        });

        metricsToInsert.push({
          code: 'water_return_rate',
          value: record.return_rate_percent,
          unit: '%'
        });
      }

      // Insert all metrics for this period
      for (const metric of metricsToInsert) {
        const metricId = metricMap[metric.code];
        if (!metricId) {
          console.warn(`⚠️  Metric not found: ${metric.code}`);
          continue;
        }

        await client.query(`
          INSERT INTO metrics_data (
            organization_id,
            site_id,
            metric_id,
            period_start,
            period_end,
            value,
            unit,
            data_quality,
            verification_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          organizationId,
          siteId,
          metricId,
          periodStart,
          periodEnd,
          metric.value,
          metric.unit,
          'calculated',
          'unverified'
        ]);

        insertCount++;
      }
    }

    console.log(`\n✅ Inserted ${insertCount} water metrics records\n`);

    // Verify insertion with summary
    const verificationResult = await client.query(`
      SELECT
        s.name as site_name,
        mc.code as metric_code,
        COUNT(*) as record_count,
        ROUND(SUM(md.value)::numeric, 2) as total_value,
        md.unit
      FROM metrics_data md
      JOIN sites s ON md.site_id = s.id
      JOIN metrics_catalog mc ON md.metric_id = mc.id
      WHERE md.organization_id = $1
        AND mc.code IN (
          'gri_303_3_withdrawal_total',
          'gri_303_4_discharge_total',
          'gri_303_5_consumption_total',
          'water_recycled_grey_water'
        )
      GROUP BY s.name, mc.code, md.unit
      ORDER BY s.name, mc.code
    `, [organizationId]);

    console.log('📊 Verification Summary:\n');
    console.log('Site                | Metric                        | Records | Total Value | Unit');
    console.log('='.repeat(90));

    verificationResult.rows.forEach(row => {
      const site = row.site_name.padEnd(18);
      const metric = row.metric_code.padEnd(28);
      const count = String(row.record_count).padStart(7);
      const value = String(row.total_value).padStart(11);
      console.log(`${site} | ${metric} | ${count} | ${value} | ${row.unit}`);
    });

    console.log('\n✅ Water metrics data insertion completed successfully!\n');

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
