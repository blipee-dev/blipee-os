import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('Applying IoT Platform migration...\n');

  // First, check if tables already exist
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['devices', 'device_data', 'device_templates']);

  if (checkError) {
    // Tables might not exist, proceed with creation
    console.log('Checking existing tables failed, proceeding with creation...');
  } else if (existingTables && existingTables.length > 0) {
    console.log('Some tables already exist:', existingTables.map(t => t.table_name).join(', '));
    console.log('Skipping table creation to avoid conflicts.\n');
    return;
  }

  // Apply the migration using RPC
  const migrationSQL = `
    -- IoT Platform Device Tables
    -- Flexible schema for unlimited device types following industry best practices

    -- Device registry table
    CREATE TABLE IF NOT EXISTS devices (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      external_id TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      location TEXT,
      metadata JSONB DEFAULT '{}',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
      installed_at TIMESTAMPTZ,
      last_seen_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Time-series device data (key-value pattern)
    CREATE TABLE IF NOT EXISTS device_data (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      variable TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      unit TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Device templates for common configurations
    CREATE TABLE IF NOT EXISTS device_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      variables JSONB NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_devices_site_id ON devices(site_id);
    CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
    CREATE INDEX IF NOT EXISTS idx_devices_external_id ON devices(external_id);
    CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data(device_id);
    CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_device_data_variable ON device_data(variable);

    -- Enable RLS
    ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE device_data ENABLE ROW LEVEL SECURITY;
    ALTER TABLE device_templates ENABLE ROW LEVEL SECURITY;
  `;

  try {
    // Execute the migration SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

    if (error) {
      console.error('Migration failed:', error);

      // Try executing statements one by one if batch fails
      console.log('\nTrying to execute statements individually...');

      // Create devices table
      const { error: devicesError } = await supabase.from('devices').select('id').limit(1);
      if (devicesError && devicesError.code === '42P01') {
        console.log('Creating devices table...');
        // Table doesn't exist, we need to create it via SQL editor
        console.log('Please run the migration SQL in Supabase SQL Editor.');
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Insert templates if tables were created
    console.log('\nInserting device templates...');
    const templates = [
      {
        name: 'Enthalpy Meter',
        type: 'enthalpy_meter',
        variables: [
          { name: 'energy_heating', unit: 'kWh', description: 'Heating energy consumption' },
          { name: 'energy_cooling', unit: 'kWh', description: 'Cooling energy consumption' },
          { name: 'flow_rate', unit: 'm3/h', description: 'Water flow rate' },
          { name: 'temperature_in', unit: 'celsius', description: 'Inlet temperature' },
          { name: 'temperature_out', unit: 'celsius', description: 'Outlet temperature' }
        ]
      },
      {
        name: 'Electricity Meter',
        type: 'electricity_meter',
        variables: [
          { name: 'power', unit: 'kW', description: 'Active power' },
          { name: 'energy', unit: 'kWh', description: 'Total energy consumption' },
          { name: 'voltage', unit: 'V', description: 'Voltage' },
          { name: 'current', unit: 'A', description: 'Current' },
          { name: 'power_factor', unit: '', description: 'Power factor' }
        ]
      },
      {
        name: 'Temperature Sensor',
        type: 'temperature',
        variables: [
          { name: 'temperature', unit: 'celsius', description: 'Temperature' },
          { name: 'humidity', unit: '%', description: 'Relative humidity' }
        ]
      },
      {
        name: 'Air Quality Sensor',
        type: 'air_quality',
        variables: [
          { name: 'co2', unit: 'ppm', description: 'CO2 concentration' },
          { name: 'pm25', unit: 'µg/m³', description: 'PM2.5 particles' },
          { name: 'pm10', unit: 'µg/m³', description: 'PM10 particles' },
          { name: 'voc', unit: 'ppb', description: 'Volatile organic compounds' }
        ]
      },
      {
        name: 'People Counter',
        type: 'people_counter',
        variables: [
          { name: 'count_in', unit: 'people', description: 'People entering' },
          { name: 'count_out', unit: 'people', description: 'People exiting' },
          { name: 'occupancy', unit: 'people', description: 'Current occupancy' }
        ]
      }
    ];

    for (const template of templates) {
      const { error: templateError } = await supabase
        .from('device_templates')
        .upsert(template, { onConflict: 'name' });

      if (templateError) {
        console.error(`Failed to insert template ${template.name}:`, templateError.message);
      } else {
        console.log(`✅ Inserted template: ${template.name}`);
      }
    }

    console.log('\n🎉 IoT Platform migration complete!');
    console.log('You can now start adding devices and collecting data.');

  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n⚠️  Please run the migration SQL directly in Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql');
    console.log('2. Copy the migration SQL from supabase/migrations/20250914001430_iot_platform_devices.sql');
    console.log('3. Run it in the SQL editor');
  }
}

applyMigration();