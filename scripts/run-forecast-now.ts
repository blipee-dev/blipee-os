/**
 * Manual Prophet Forecast Execution
 *
 * Run this script to immediately execute Prophet forecasting for all metrics.
 * This bypasses the scheduled cron job and runs forecasts on-demand.
 */

import { config } from 'dotenv';
import { ForecastPrecomputeService } from '@/workers/services/forecast-precompute-service';

// Load environment variables
config({ path: '.env.local' });

async function runForecastNow() {
  console.log('🚀 Starting manual Prophet forecast execution...\n');
  console.log('⏰ Time:', new Date().toISOString());
  console.log('');

  try {
    // Create forecast service instance
    const forecastService = new ForecastPrecomputeService();

    // Check service health first
    const health = forecastService.getHealth();
    console.log(`📊 Service Status: ${health.status}`);
    console.log(`   Message: ${health.message}\n`);

    // Run forecast generation
    console.log('🔮 Executing Prophet forecasts for all metrics...\n');
    const stats = await forecastService.run();

    // Display results
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ FORECAST EXECUTION COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📈 Forecasts Generated: ${stats.generated}`);
    console.log(`⏭️  Forecasts Skipped:   ${stats.skipped}`);
    console.log(`❌ Errors:              ${stats.errors}`);
    console.log(`⏱️  Duration:            ${(stats.duration / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Get forecast stats
    const forecastStats = await forecastService.getStats();
    console.log('📊 Forecast Storage Stats:');
    console.log(`   Total Forecasts: ${forecastStats.totalForecasts}`);
    console.log(`   Oldest: ${forecastStats.oldestForecast}`);
    console.log(`   Newest: ${forecastStats.newestForecast}`);
    console.log('\n📋 Forecasts by Category:');
    Object.entries(forecastStats.forecastsByCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Forecast execution failed:', error);
    process.exit(1);
  }
}

runForecastNow();
