import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkAndSetup() {
  console.log('🔍 Checking tables and inserting metrics...\n');

  // First, check if metrics_catalog table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('metrics_catalog')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('❌ Table does not exist or error:', tableError.message);
    console.log('Creating tables...\n');

    // Create the tables
    await createTables();
  } else {
    console.log('✅ Tables exist, proceeding with data insertion...\n');
  }

  // Now insert the metrics
  await insertMetrics();
}

async function createTables() {
  // Use raw SQL through postgres extension
  const { data, error } = await supabase.rpc('exec_raw_sql', {
    sql_query: `
      -- Create metrics_catalog table
      CREATE TABLE IF NOT EXISTS metrics_catalog (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),
        category TEXT NOT NULL,
        subcategory TEXT,
        unit TEXT NOT NULL,
        description TEXT,
        calculation_method TEXT,
        emission_factor DECIMAL,
        emission_factor_unit TEXT,
        emission_factor_source TEXT,
        ghg_protocol_category TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create organization_metrics table
      CREATE TABLE IF NOT EXISTS organization_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT false,
        target_value DECIMAL,
        target_year INTEGER,
        baseline_value DECIMAL,
        baseline_year INTEGER,
        reporting_frequency TEXT CHECK (reporting_frequency IN ('monthly', 'quarterly', 'annually')),
        data_source TEXT,
        responsible_user_id UUID REFERENCES auth.users(id),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(organization_id, metric_id)
      );

      -- Create metrics_data table
      CREATE TABLE IF NOT EXISTS metrics_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
        site_id UUID REFERENCES sites(id),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        value DECIMAL NOT NULL,
        unit TEXT NOT NULL,
        co2e_emissions DECIMAL,
        data_quality TEXT CHECK (data_quality IN ('measured', 'calculated', 'estimated')),
        verification_status TEXT CHECK (verification_status IN ('unverified', 'verified', 'audited')),
        verified_by UUID REFERENCES auth.users(id),
        verified_at TIMESTAMPTZ,
        evidence_url TEXT,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE organization_metrics ENABLE ROW LEVEL SECURITY;
      ALTER TABLE metrics_data ENABLE ROW LEVEL SECURITY;
    `
  });

  if (error) {
    console.log('Error creating tables (might already exist):', error.message);
  } else {
    console.log('✅ Tables created successfully\n');
  }
}

async function insertMetrics() {
  const metrics = [
    // A subset for testing
    {
      code: 'scope1_natural_gas',
      name: 'Natural Gas Consumption',
      scope: 'scope_1',
      category: 'Stationary Combustion',
      subcategory: 'Heating',
      unit: 'm³',
      description: 'Natural gas used for heating and operations',
      emission_factor: 1.8788,
      emission_factor_unit: 'kgCO2e/m³'
    },
    {
      code: 'scope2_electricity_grid',
      name: 'Grid Electricity',
      scope: 'scope_2',
      category: 'Electricity',
      subcategory: 'Purchased',
      unit: 'kWh',
      description: 'Electricity from the grid',
      emission_factor: 0.4,
      emission_factor_unit: 'kgCO2e/kWh'
    },
    {
      code: 'scope3_business_travel_air',
      name: 'Air Travel',
      scope: 'scope_3',
      category: 'Business Travel',
      subcategory: 'Air',
      unit: 'km',
      description: 'Employee air travel',
      emission_factor: 0.15,
      emission_factor_unit: 'kgCO2e/km',
      ghg_protocol_category: '6'
    }
  ];

  console.log(`📦 Inserting ${metrics.length} test metrics...\n`);

  for (const metric of metrics) {
    try {
      const { data, error } = await supabase
        .from('metrics_catalog')
        .upsert(metric, { onConflict: 'code' })
        .select();

      if (error) {
        console.error(`❌ Error inserting ${metric.code}:`, error);
      } else {
        console.log(`✅ Inserted: ${metric.name}`);
      }
    } catch (err) {
      console.error(`❌ Exception with ${metric.code}:`, err);
    }
  }

  // Check count
  const { count, error: countError } = await supabase
    .from('metrics_catalog')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('\n❌ Error counting metrics:', countError);
  } else {
    console.log(`\n📊 Total metrics in catalog: ${count}`);
  }
}

checkAndSetup();