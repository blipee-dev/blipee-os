#!/usr/bin/env tsx

/**
 * Database Status Checker
 * 
 * This script checks what ESG tables are actually implemented in your Supabase database
 * and provides a comprehensive status report.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TableInfo {
  table_name: string;
  table_type: string;
  is_insertable_into: string;
}

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n');

  try {
    // Check what tables exist by trying to query some known tables
    const knownTables = ['organizations', 'buildings', 'emissions_data', 'waste_data', 'water_usage', 'sustainability_reports', 'document_uploads', 'devices', 'metrics', 'conversations', 'user_organizations'];
    const existingTables: string[] = [];
    
    for (const tableName of knownTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(tableName);
        }
      } catch (e) {
        // Table doesn't exist, ignore
      }
    }
    
    const tables = existingTables.map(name => ({ table_name: name, table_type: 'BASE TABLE', is_insertable_into: 'YES' }));

    // Categorize tables
    const esgTables: string[] = [];
    const authTables: string[] = [];
    const coreTables: string[] = [];
    const otherTables: string[] = [];

    tables.forEach((table: TableInfo) => {
      const name = table.table_name;
      
      if (name.includes('emission') || name.includes('energy') || name.includes('water') || 
          name.includes('waste') || name.includes('sustainability') || name.includes('material') ||
          name.includes('compliance') || name.includes('esg') || name.includes('facilities') ||
          name.includes('suppliers') || name.includes('biodiversity')) {
        esgTables.push(name);
      } else if (name.includes('auth') || name.includes('mfa') || name.includes('sso') || 
                 name.includes('session') || name.includes('credential')) {
        authTables.push(name);
      } else if (['organizations', 'profiles', 'conversations', 'documents'].includes(name)) {
        coreTables.push(name);
      } else {
        otherTables.push(name);
      }
    });

    // Display results
    console.log('📊 DATABASE STATUS REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n🌱 ESG TABLES (${esgTables.length}):`);
    if (esgTables.length > 0) {
      esgTables.forEach(table => console.log(`  ✅ ${table}`));
    } else {
      console.log('  ❌ No ESG tables found');
    }

    console.log(`\n🔐 AUTH TABLES (${authTables.length}):`);
    authTables.slice(0, 5).forEach(table => console.log(`  ✅ ${table}`));
    if (authTables.length > 5) {
      console.log(`  ... and ${authTables.length - 5} more`);
    }

    console.log(`\n⚙️ CORE TABLES (${coreTables.length}):`);
    coreTables.forEach(table => console.log(`  ✅ ${table}`));

    console.log(`\n📋 OTHER TABLES (${otherTables.length}):`);
    otherTables.slice(0, 5).forEach(table => console.log(`  ✅ ${table}`));
    if (otherTables.length > 5) {
      console.log(`  ... and ${otherTables.length - 5} more`);
    }

    console.log(`\n📈 TOTAL TABLES: ${tables.length}`);

    // Check specific ESG tables
    console.log('\n🔍 ESG TABLE ANALYSIS:');
    console.log('=' .repeat(50));

    const keyESGTables = [
      'emissions',
      'facilities', 
      'sustainability_targets',
      'energy_consumption',
      'water_consumption',
      'waste_generation',
      'suppliers',
      'materiality_assessments',
      'compliance_frameworks'
    ];

    for (const tableName of keyESGTables) {
      const exists = esgTables.includes(tableName);
      if (exists) {
        // Try to get row count
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        console.log(`  ✅ ${tableName} (${count || 0} rows)`);
      } else {
        console.log(`  ❌ ${tableName} - NOT FOUND`);
      }
    }

    // Check for sample data
    console.log('\n📊 SAMPLE DATA CHECK:');
    console.log('=' .repeat(50));

    if (esgTables.includes('organizations')) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(3);
      
      if (orgs && orgs.length > 0) {
        console.log('  ✅ Organizations:');
        orgs.forEach(org => console.log(`    - ${org.name} (${org.id})`));
      } else {
        console.log('  ❌ No organizations found');
      }
    }

    if (esgTables.includes('emissions')) {
      const { data: emissions } = await supabase
        .from('emissions')
        .select('emission_date, scope, co2_equivalent')
        .limit(3);
      
      if (emissions && emissions.length > 0) {
        console.log('  ✅ Sample Emissions:');
        emissions.forEach(emission => 
          console.log(`    - ${emission.emission_date}: ${emission.co2_equivalent} CO2e (Scope ${emission.scope})`)
        );
      } else {
        console.log('  ❌ No emissions data found');
      }
    }

    // Summary and recommendations
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(50));

    if (esgTables.length >= 5) {
      console.log('  ✅ ESG schema appears to be implemented');
      console.log('  📝 Next steps: Build API endpoints and UI components');
    } else if (esgTables.length > 0) {
      console.log('  ⚠️  Partial ESG schema detected');
      console.log('  📝 Next steps: Complete ESG schema migration');
    } else {
      console.log('  ❌ No ESG schema detected');
      console.log('  📝 Next steps: Run FINAL_FORTUNE10_MIGRATION.sql');
    }

    console.log('\n✨ Database check complete!');

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the check
checkDatabaseStatus().catch(console.error);