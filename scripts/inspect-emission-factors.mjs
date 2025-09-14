import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://taqnpqotynpudcaejlxj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcW5wcW90eW5wdWRjYWVqbHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTI3MjI1NCwiZXhwIjoyMDQwODQ4MjU0fQ.kEphWMsP6u5xCmACD6l-2Z5xMKiwP_j_RdkRQdFY5MU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectEmissionFactors() {
  try {
    // Get all records to understand the data
    const { data: records, error } = await supabase
      .from('emission_factors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching records:', error);
      return;
    }

    if (records && records.length > 0) {
      console.log('=== EMISSION FACTORS TABLE STRUCTURE ===');
      console.log('Columns:', Object.keys(records[0]));

      console.log('\n=== SAMPLE RECORD ===');
      console.log(JSON.stringify(records[0], null, 2));

      console.log('\n=== ALL UNIQUE CATEGORIES ===');
      const categories = [...new Set(records.map(r => r.category))];
      console.log('Categories:', categories);

      console.log('\n=== ALL UNIQUE SCOPES ===');
      const scopes = [...new Set(records.map(r => r.scope))];
      console.log('Scopes:', scopes);

      console.log('\n=== ELECTRICITY-RELATED RECORDS ===');
      const electricityRecords = records.filter(r =>
        r.code?.includes('electricity') ||
        r.name?.toLowerCase().includes('electricity') ||
        r.name?.toLowerCase().includes('grid')
      );

      electricityRecords.forEach(record => {
        console.log(`\nCode: ${record.code}`);
        console.log(`Name: ${record.name}`);
        console.log(`Category: ${record.category}`);
        console.log(`Scope: ${record.scope}`);
        console.log(`Factor Value: ${record.factor_value}`);
        console.log(`Factor Unit: ${record.factor_unit}`);
      });
    } else {
      console.log('No records found in emission_factors table');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

inspectEmissionFactors();