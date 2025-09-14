const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcW5wcW90eW5wdWRjYWVqbHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTI3MjI1NCwiZXhwIjoyMDQwODQ4MjU0fQ.kEphWMsP6u5xCmACD6l-2Z5xMKiwP_j_RdkRQdFY5MU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmissionFactorsStructure() {
  try {
    // Get sample record to see columns
    const { data, error } = await supabase
      .from('emission_factors')
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      console.log('Emission factors table columns:', Object.keys(data[0]));
      console.log('\nSample record:', JSON.stringify(data[0], null, 2));
    }

    // Check existing records to understand the data
    const { data: existingRecords, error: recordsError } = await supabase
      .from('emission_factors')
      .select('*')
      .limit(5);

    if (existingRecords) {
      console.log('\nExisting emission_factors records:');
      existingRecords.forEach(record => {
        console.log(`- ${record.name}: category="${record.category}", code="${record.code}", scope="${record.scope}"`);
      });

      // Get unique categories
      const categories = [...new Set(existingRecords.map(r => r.category))];
      console.log('\nUnique categories found:', categories);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmissionFactorsStructure();