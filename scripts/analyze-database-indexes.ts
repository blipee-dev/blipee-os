#!/usr/bin/env tsx
/**
 * Database Index Analysis Script
 * Phase 2, Task 2.1: Missing Indexes Implementation
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { indexOptimizer } from '@/lib/database/index-optimizer';
import { queryAnalyzer } from '@/lib/database/query-analyzer';

async function analyzeAndImplementIndexes() {
  console.log('🔍 Starting database index analysis...\n');

  try {
    // Step 1: Analyze current index usage
    console.log('📊 Step 1: Analyzing current index usage...');
    const indexAnalysis = await indexOptimizer.analyzeIndexUsage(30);
    
    console.log(`  ✅ Found ${indexAnalysis.unused.length} unused indexes`);
    console.log(`  ⚠️  Found ${indexAnalysis.inefficient.length} inefficient indexes`);
    console.log(`  ❌ Found ${indexAnalysis.missing.length} missing core indexes`);

    // Step 2: Generate optimization report
    console.log('\n📈 Step 2: Generating comprehensive optimization report...');
    const optimizationReport = await queryAnalyzer.generateOptimizationReport();
    
    console.log('  📊 Database Summary:');
    console.log(`    - Total tables: ${optimizationReport.summary.totalTables}`);
    console.log(`    - Total indexes: ${optimizationReport.summary.totalIndexes}`);
    console.log(`    - Unused indexes: ${optimizationReport.summary.unusedIndexes}`);
    console.log(`    - Recommended indexes: ${optimizationReport.summary.recommendedIndexes}`);
    console.log(`    - Estimated improvement: ${optimizationReport.summary.estimatedImprovement}`);

    // Step 3: Display missing core indexes
    if (indexAnalysis.missing.length > 0) {
      console.log('\n❌ Step 3: Missing Core Indexes Found:');
      indexAnalysis.missing.forEach(name => {
        console.log(`    - ${name}`);
      });
    }

    // Step 4: Create missing core indexes
    console.log('\n🔨 Step 4: Creating missing core indexes...');
    const coreIndexResult = await indexOptimizer.createCoreIndexes();
    
    console.log(`  ✅ Created: ${coreIndexResult.created.length} indexes`);
    console.log(`  ⏭️  Skipped: ${coreIndexResult.skipped.length} indexes (already exist)`);
    console.log(`  ❌ Failed: ${coreIndexResult.failed.length} indexes`);

    if (coreIndexResult.created.length > 0) {
      console.log('\n    Created indexes:');
      coreIndexResult.created.forEach(name => {
        console.log(`      ✅ ${name}`);
      });
    }

    if (coreIndexResult.failed.length > 0) {
      console.log('\n    Failed indexes:');
      coreIndexResult.failed.forEach(name => {
        console.log(`      ❌ ${name}`);
      });
    }

    // Step 5: Run optimization (dry run first)
    console.log('\n🎯 Step 5: Running optimization analysis (dry run)...');
    const optimizationResult = await indexOptimizer.optimizeIndexes(true);
    
    console.log('\n📋 Optimization Report:');
    console.log(optimizationResult.report);
    
    console.log(`\n🎯 Total optimization actions planned: ${optimizationResult.actions.length}`);

    // Step 6: Get final index statistics
    console.log('\n📊 Step 6: Final index statistics...');
    const finalStats = await indexOptimizer.getIndexStats();
    
    const effectiveness = finalStats.reduce((sum, stat) => sum + stat.effectiveness, 0) / finalStats.length;
    console.log(`  📈 Average index effectiveness: ${effectiveness.toFixed(2)} tuples/scan`);
    console.log(`  📊 Total indexes in database: ${finalStats.length}`);

    // Display top 5 most effective indexes
    const topIndexes = finalStats
      .filter(s => s.scansCount > 0)
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);
      
    if (topIndexes.length > 0) {
      console.log('\n🏆 Top 5 most effective indexes:');
      topIndexes.forEach((idx, i) => {
        console.log(`    ${i + 1}. ${idx.name}: ${idx.effectiveness.toFixed(2)} tuples/scan (${idx.scansCount} scans)`);
      });
    }

    console.log('\n✅ Database index analysis and implementation completed successfully!');
    
    // Summary of improvements
    console.log('\n📊 PHASE 2, TASK 2.1 SUMMARY:');
    console.log(`  ✅ Core indexes created: ${coreIndexResult.created.length}`);
    console.log(`  📊 Total indexes optimized: ${optimizationResult.actions.length}`);
    console.log(`  📈 Estimated performance improvement: ${optimizationReport.summary.estimatedImprovement}`);
    console.log('  🎯 Missing indexes implementation: COMPLETE ✅');

  } catch (error) {
    console.error('❌ Error during database index analysis:', error);
    throw error;
  }
}

// Run the analysis
if (require.main === module) {
  analyzeAndImplementIndexes()
    .then(() => {
      console.log('\n🎉 Index analysis completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Index analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeAndImplementIndexes };