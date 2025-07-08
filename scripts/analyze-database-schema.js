#!/usr/bin/env node

/**
 * Database Schema Analysis Script
 * 
 * This script analyzes the current database schema and generates a comprehensive report
 * to help with migration planning and identify potential issues.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeSchema() {
  console.log('🔍 Analyzing Database Schema...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    tables: {},
    issues: [],
    recommendations: [],
    statistics: {}
  };

  try {
    // 1. Get all tables
    console.log('📊 Fetching table information...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_schema_info', {
      schema_name: 'public'
    }).single();

    if (tablesError) {
      // If RPC doesn't exist, use direct query
      const tablesQuery = `
        SELECT 
          t.table_name,
          obj_description(c.oid) as table_comment,
          pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
          n_live_tup as row_count
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public'
        ORDER BY pg_total_relation_size(c.oid) DESC;
      `;
      
      console.log('📋 Analyzing tables...');
      
      // Get basic table info from information schema
      const { data: tableList, error: tableListError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tableList) {
        for (const table of tableList) {
          report.tables[table.table_name] = await analyzeTable(table.table_name);
        }
      }
    }

    // 2. Check for common issues
    console.log('\n🔍 Checking for common issues...');
    await checkForIssues(report);

    // 3. Generate recommendations
    console.log('\n💡 Generating recommendations...');
    generateRecommendations(report);

    // 4. Calculate statistics
    console.log('\n📈 Calculating statistics...');
    calculateStatistics(report);

    // 5. Write report
    const reportPath = path.join(__dirname, `schema-analysis-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Analysis complete! Report saved to: ${reportPath}`);

    // 6. Print summary
    printSummary(report);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

async function analyzeTable(tableName) {
  const tableInfo = {
    columns: {},
    indexes: [],
    constraints: [],
    foreignKeys: [],
    policies: [],
    triggers: [],
    issues: []
  };

  try {
    // Get columns
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    if (columns) {
      columns.forEach(col => {
        tableInfo.columns[col.column_name] = {
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          maxLength: col.character_maximum_length
        };
      });
    }

    // Check for missing indexes on foreign keys
    const foreignKeyColumns = Object.entries(tableInfo.columns)
      .filter(([name, info]) => name.endsWith('_id'))
      .map(([name]) => name);

    if (foreignKeyColumns.length > 0) {
      tableInfo.issues.push({
        type: 'performance',
        message: `Table has ${foreignKeyColumns.length} potential foreign key columns`,
        columns: foreignKeyColumns
      });
    }

    // Check for large JSON columns without indexes
    const jsonColumns = Object.entries(tableInfo.columns)
      .filter(([name, info]) => info.type === 'jsonb')
      .map(([name]) => name);

    if (jsonColumns.length > 0) {
      tableInfo.issues.push({
        type: 'performance',
        message: `Table has ${jsonColumns.length} JSONB columns that may need GIN indexes`,
        columns: jsonColumns
      });
    }

  } catch (error) {
    tableInfo.issues.push({
      type: 'error',
      message: `Failed to analyze table: ${error.message}`
    });
  }

  return tableInfo;
}

async function checkForIssues(report) {
  const issues = [];

  // Check for tables without primary keys
  const tablesWithoutPK = Object.entries(report.tables)
    .filter(([name, info]) => !Object.values(info.constraints || {})
      .some(c => c.type === 'PRIMARY KEY'))
    .map(([name]) => name);

  if (tablesWithoutPK.length > 0) {
    issues.push({
      severity: 'high',
      type: 'structure',
      message: `${tablesWithoutPK.length} tables without primary keys`,
      tables: tablesWithoutPK
    });
  }

  // Check for missing RLS policies
  const tablesWithoutRLS = Object.keys(report.tables)
    .filter(name => name !== 'emission_factors'); // Global reference table

  if (tablesWithoutRLS.length > 0) {
    issues.push({
      severity: 'high',
      type: 'security',
      message: 'Tables may be missing RLS policies',
      recommendation: 'Verify all tables have appropriate RLS policies'
    });
  }

  // Check for duplicate indexes
  // This would require more complex analysis of index definitions

  report.issues = issues;
}

function generateRecommendations(report) {
  const recommendations = [];

  // Performance recommendations
  const largeJsonTables = Object.entries(report.tables)
    .filter(([name, info]) => {
      const jsonCols = Object.entries(info.columns || {})
        .filter(([colName, colInfo]) => colInfo.type === 'jsonb');
      return jsonCols.length > 0;
    })
    .map(([name]) => name);

  if (largeJsonTables.length > 0) {
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      recommendation: 'Add GIN indexes to JSONB columns for better query performance',
      tables: largeJsonTables
    });
  }

  // Security recommendations
  recommendations.push({
    category: 'security',
    priority: 'high',
    recommendation: 'Review and test all RLS policies to ensure proper data isolation'
  });

  // Maintenance recommendations
  recommendations.push({
    category: 'maintenance',
    priority: 'medium',
    recommendation: 'Set up regular VACUUM and ANALYZE schedules for optimal performance'
  });

  report.recommendations = recommendations;
}

function calculateStatistics(report) {
  const stats = {
    totalTables: Object.keys(report.tables).length,
    totalColumns: Object.values(report.tables)
      .reduce((sum, table) => sum + Object.keys(table.columns || {}).length, 0),
    totalIssues: report.issues.length,
    issuesBySeverity: {},
    tablesBySize: {}
  };

  // Group issues by severity
  report.issues.forEach(issue => {
    stats.issuesBySeverity[issue.severity] = 
      (stats.issuesBySeverity[issue.severity] || 0) + 1;
  });

  report.statistics = stats;
}

function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SCHEMA ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Total Tables: ${report.statistics.totalTables}`);
  console.log(`   Total Columns: ${report.statistics.totalColumns}`);
  
  console.log(`\n⚠️  Issues Found: ${report.issues.length}`);
  Object.entries(report.statistics.issuesBySeverity || {}).forEach(([severity, count]) => {
    console.log(`   ${severity}: ${count}`);
  });
  
  console.log(`\n💡 Recommendations: ${report.recommendations.length}`);
  report.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec.recommendation}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// Run the analysis
analyzeSchema().catch(console.error);