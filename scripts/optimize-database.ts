#!/usr/bin/env node

import { indexOptimizer } from '../src/lib/database/index-optimizer';
import { queryAnalyzer } from '../src/lib/database/query-analyzer';
import { readReplicaManager } from '../src/lib/database/read-replica';
import { dbMonitor } from '../src/lib/database/monitoring';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔧 Blipee OS Database Optimization Tool\n');
  
  try {
    switch (command) {
      case 'analyze':
        console.log('📊 Generating optimization report...\n');
        const report = await queryAnalyzer.generateOptimizationReport();
        
        console.log('=== SUMMARY ===');
        console.log(`Total Tables: ${report.summary.totalTables}`);
        console.log(`Total Indexes: ${report.summary.totalIndexes}`);
        console.log(`Unused Indexes: ${report.summary.unusedIndexes}`);
        console.log(`Recommended New Indexes: ${report.summary.recommendedIndexes}`);
        console.log(`Estimated Improvement: ${report.summary.estimatedImprovement}\n`);
        
        if (report.slowQueries.length > 0) {
          console.log('=== SLOW QUERIES ===');
          report.slowQueries.forEach((query, i) => {
            console.log(`${i + 1}. ${query.query.substring(0, 100)}...`);
            console.log(`   Duration: ${query.duration}ms | Count: ${query.count}\n`);
          });
        }
        
        if (report.recommendations.length > 0) {
          console.log('=== RECOMMENDATIONS ===');
          report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec.table} - ${rec.reason}`);
            console.log(`   Columns: ${rec.columns.join(', ')}`);
            console.log(`   Improvement: ${rec.estimatedImprovement}`);
            console.log(`   SQL: ${rec.createStatement}\n`);
          });
        }
        break;
        
      case 'optimize':
        const dryRun = !args.includes('--execute');
        console.log(`🚀 Running index optimization (${dryRun ? 'DRY RUN' : 'EXECUTING'})...\n`);
        
        const optimizationResult = await indexOptimizer.optimizeIndexes(dryRun);
        console.log(optimizationResult.report);
        
        if (!dryRun) {
          console.log('✅ Optimization completed successfully!');
        }
        break;
        
      case 'create-core':
        console.log('🏗️  Creating core indexes...\n');
        const coreResult = await indexOptimizer.createCoreIndexes();
        
        console.log(`✅ Created: ${coreResult.created.length} indexes`);
        console.log(`⏭️  Skipped: ${coreResult.skipped.length} indexes (already exist)`);
        console.log(`❌ Failed: ${coreResult.failed.length} indexes`);
        
        if (coreResult.created.length > 0) {
          console.log('\nCreated indexes:');
          coreResult.created.forEach(idx => console.log(`  - ${idx}`));
        }
        break;
        
      case 'stats':
        console.log('📈 Database Statistics\n');
        
        // Connection pool stats
        const poolStats = dbMonitor.getConnectionPoolStats();
        console.log('=== CONNECTION POOL ===');
        console.log(`Total: ${poolStats.total}`);
        console.log(`Active: ${poolStats.active}`);
        console.log(`Idle: ${poolStats.idle}`);
        console.log(`Waiting: ${poolStats.waiting}\n`);
        
        // Read replica stats
        const replicaStats = readReplicaManager.getStatistics();
        console.log('=== READ REPLICAS ===');
        console.log(`Total: ${replicaStats.total}`);
        console.log(`Healthy: ${replicaStats.healthy}`);
        console.log(`Unhealthy: ${replicaStats.unhealthy}\n`);
        
        // Query stats
        const queryStats = dbMonitor.getQueryStatistics();
        console.log('=== TOP QUERIES ===');
        let count = 0;
        queryStats.forEach((stats, pattern) => {
          if (count++ < 5) {
            console.log(`${pattern.substring(0, 80)}...`);
            console.log(`  Count: ${stats.count} | Avg: ${stats.avgDuration.toFixed(2)}ms\n`);
          }
        });
        break;
        
      case 'monitor':
        console.log('📡 Starting real-time monitoring (Ctrl+C to stop)...\n');
        
        // Start monitoring
        setInterval(() => {
          const poolStats = dbMonitor.getConnectionPoolStats();
          const slowQueries = dbMonitor.getSlowQueries(5);
          
          console.clear();
          console.log('🔧 Blipee OS Database Monitor\n');
          console.log(`Time: ${new Date().toISOString()}\n`);
          
          console.log('=== CONNECTIONS ===');
          console.log(`Active: ${poolStats.active}/${poolStats.total}`);
          console.log(`Idle: ${poolStats.idle}`);
          console.log(`Waiting: ${poolStats.waiting}\n`);
          
          if (slowQueries.length > 0) {
            console.log('=== RECENT SLOW QUERIES ===');
            slowQueries.forEach((query, i) => {
              console.log(`${i + 1}. ${query.duration}ms - ${query.query.substring(0, 60)}...`);
            });
          }
        }, 2000);
        break;
        
      default:
        console.log('Usage: npm run db:optimize <command> [options]\n');
        console.log('Commands:');
        console.log('  analyze      - Generate optimization report');
        console.log('  optimize     - Optimize indexes (add --execute to apply changes)');
        console.log('  create-core  - Create all core indexes');
        console.log('  stats        - Show database statistics');
        console.log('  monitor      - Start real-time monitoring');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };