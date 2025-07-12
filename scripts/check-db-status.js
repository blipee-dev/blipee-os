const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');
  
  try {
    // Get all tables in the public schema
    const { data: tables, error } = await supabase
      .rpc('get_schema_tables', { schema_name: 'public' })
      .then(result => {
        if (result.error) {
          // Fallback method if RPC doesn't exist
          return supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
        }
        return result;
      });

    if (error) {
      console.error('Error fetching tables:', error);
      return;
    }

    const tableNames = tables.map(t => t.table_name);
    
    // Check for ESG tables
    const esgTables = tableNames.filter(name => 
      name.includes('emission') || name.includes('energy') || name.includes('water') || 
      name.includes('waste') || name.includes('sustainability') || name.includes('material') ||
      name.includes('compliance') || name.includes('esg') || name.includes('facilities') ||
      name.includes('suppliers') || name.includes('biodiversity')
    );

    console.log('📊 DATABASE STATUS REPORT');
    console.log('='.repeat(50));
    console.log(`Total tables found: ${tableNames.length}`);
    console.log(`ESG-related tables: ${esgTables.length}`);
    
    if (esgTables.length > 0) {
      console.log('\n🌱 ESG TABLES FOUND:');
      esgTables.forEach(table => console.log(`  ✅ ${table}`));
    } else {
      console.log('\n❌ No ESG tables found');
    }

    // Check specific key tables
    console.log('\n🔍 KEY TABLE CHECK:');
    console.log('='.repeat(50));

    const keyTables = [
      'organizations',
      'facilities', 
      'emissions',
      'sustainability_targets',
      'energy_consumption',
      'water_consumption',
      'waste_generation',
      'suppliers',
      'materiality_assessments',
      'compliance_frameworks'
    ];

    for (const tableName of keyTables) {
      const exists = tableNames.includes(tableName);
      if (exists) {
        // Try to get row count
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ⚠️  ${tableName} - EXISTS but query failed: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName} (${count || 0} rows)`);
        }
      } else {
        console.log(`  ❌ ${tableName} - NOT FOUND`);
      }
    }

    // Check sample data
    console.log('\n📊 SAMPLE DATA CHECK:');
    console.log('='.repeat(50));

    if (tableNames.includes('organizations')) {
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

    if (tableNames.includes('emissions')) {
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

    // Summary
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(50));

    if (esgTables.length >= 8) {
      console.log('  ✅ COMPREHENSIVE ESG SCHEMA DETECTED');
      console.log('  🚀 Ready to build API endpoints and UI components');
    } else if (esgTables.length > 0) {
      console.log('  ⚠️  PARTIAL ESG SCHEMA DETECTED');
      console.log('  📝 May need to complete migration');
    } else {
      console.log('  ❌ NO ESG SCHEMA DETECTED');
      console.log('  📝 Need to run FINAL_FORTUNE10_MIGRATION.sql');
    }

    console.log('\n✨ Database check complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkDatabaseStatus();