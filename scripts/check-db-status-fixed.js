const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');
  
  try {
    // Test specific ESG tables by trying to query them
    console.log('📊 TESTING ESG TABLES:');
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
      'compliance_frameworks',
      'emission_sources',
      'documents',
      'conversations',
      'profiles'
    ];

    let existingTables = [];
    let esgTables = [];

    for (const tableName of keyTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${tableName} - ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName} (${count || 0} rows)`);
          existingTables.push(tableName);
          
          // Check if it's an ESG table
          if (tableName.includes('emission') || tableName.includes('energy') || 
              tableName.includes('water') || tableName.includes('waste') || 
              tableName.includes('sustainability') || tableName.includes('material') ||
              tableName.includes('compliance') || tableName.includes('facilities') ||
              tableName.includes('suppliers') || tableName.includes('biodiversity')) {
            esgTables.push(tableName);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${tableName} - ${error.message}`);
      }
    }

    // Check sample data from key tables
    console.log('\n📊 SAMPLE DATA CHECK:');
    console.log('='.repeat(50));

    if (existingTables.includes('organizations')) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, industry, created_at')
        .limit(3);
      
      if (orgs && orgs.length > 0) {
        console.log('  ✅ Organizations:');
        orgs.forEach(org => console.log(`    - ${org.name} ${org.industry ? `(${org.industry})` : ''} - ${org.id.substring(0, 8)}...`));
      } else {
        console.log('  ❌ No organizations found');
      }
    }

    if (existingTables.includes('facilities')) {
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, facility_type, status')
        .limit(3);
      
      if (facilities && facilities.length > 0) {
        console.log('  ✅ Facilities:');
        facilities.forEach(facility => 
          console.log(`    - ${facility.name} (${facility.facility_type}) - ${facility.status}`)
        );
      } else {
        console.log('  ❌ No facilities found');
      }
    }

    if (existingTables.includes('emissions')) {
      const { data: emissions } = await supabase
        .from('emissions')
        .select('emission_date, scope, co2_equivalent, source_category')
        .limit(3);
      
      if (emissions && emissions.length > 0) {
        console.log('  ✅ Sample Emissions:');
        emissions.forEach(emission => 
          console.log(`    - ${emission.emission_date}: ${emission.co2_equivalent} CO2e (${emission.scope} - ${emission.source_category})`)
        );
      } else {
        console.log('  ❌ No emissions data found');
      }
    }

    if (existingTables.includes('sustainability_targets')) {
      const { data: targets } = await supabase
        .from('sustainability_targets')
        .select('target_name, target_type, target_year, status')
        .limit(3);
      
      if (targets && targets.length > 0) {
        console.log('  ✅ Sustainability Targets:');
        targets.forEach(target => 
          console.log(`    - ${target.target_name} (${target.target_type}) - ${target.target_year} - ${target.status}`)
        );
      } else {
        console.log('  ❌ No sustainability targets found');
      }
    }

    // Check for comprehensive ESG schema indicators
    console.log('\n🔍 ESG SCHEMA ANALYSIS:');
    console.log('='.repeat(50));

    const comprehensiveIndicators = [
      'emission_sources',
      'energy_consumption', 
      'water_consumption',
      'waste_generation',
      'suppliers',
      'materiality_assessments'
    ];

    const foundIndicators = comprehensiveIndicators.filter(table => existingTables.includes(table));
    
    console.log(`ESG Tables Found: ${esgTables.length}`);
    console.log(`Total Tables Found: ${existingTables.length}`);
    console.log(`Comprehensive Indicators: ${foundIndicators.length}/${comprehensiveIndicators.length}`);

    if (foundIndicators.length > 0) {
      console.log('\n🌱 ESG SCHEMA INDICATORS:');
      foundIndicators.forEach(table => console.log(`  ✅ ${table}`));
    }

    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('='.repeat(50));

    if (foundIndicators.length >= 4) {
      console.log('  ✅ COMPREHENSIVE ESG SCHEMA DETECTED');
      console.log('  🚀 Database is ready for ESG platform');
      console.log('  📝 Next steps: Build API endpoints and UI components');
    } else if (esgTables.length > 0) {
      console.log('  ⚠️  PARTIAL ESG SCHEMA DETECTED');
      console.log('  📝 Some ESG tables exist but may need completion');
    } else {
      console.log('  ❌ LIMITED ESG SCHEMA DETECTED');
      console.log('  📝 Basic tables exist but ESG schema may need implementation');
    }

    console.log('\n✨ Database check complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkDatabaseStatus();