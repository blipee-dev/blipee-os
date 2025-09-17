const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSampleDevices() {
  console.log('🔌 Creating sample devices for PLMJ organization...');
  console.log('=================================================');

  // Get sites for PLMJ
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');

  if (sitesError) {
    console.log('❌ Error fetching sites:', sitesError.message);
    return;
  }

  if (!sites || sites.length === 0) {
    console.log('❌ No sites found for PLMJ');
    return;
  }

  console.log('📍 Found sites:', sites.map(s => s.name).join(', '));

  // Define sample devices
  const devices = [
    {
      name: 'HVAC System - Main Building',
      site_id: sites[0].id, // Faro
      organization_id: '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
      type: 'HVAC',
      manufacturer: 'Carrier',
      model: 'Infinity 26',
      status: 'active',
      protocol: 'BACnet'
    },
    {
      name: 'Smart Energy Meter - Floor 1',
      site_id: sites[1]?.id || sites[0].id, // Lisboa or Faro
      type: 'Energy Meter',
      manufacturer: 'Schneider Electric',
      model: 'PowerLogic PM8000',
      status: 'active',
      protocol: 'Modbus',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    },
    {
      name: 'Lighting Control System',
      site_id: sites[2]?.id || sites[0].id, // Porto or Faro
      type: 'Lighting',
      manufacturer: 'Philips',
      model: 'Dynalite DDMC802',
      status: 'active',
      protocol: 'DALI',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    },
    {
      name: 'Solar Panel Inverter - Rooftop',
      site_id: sites[0].id, // Faro
      type: 'Solar',
      manufacturer: 'SMA',
      model: 'Sunny Tripower',
      status: 'active',
      protocol: 'Modbus TCP',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    },
    {
      name: 'Water Flow Meter - Main',
      site_id: sites[1]?.id || sites[0].id, // Lisboa or Faro
      type: 'Water Meter',
      manufacturer: 'Kamstrup',
      model: 'MULTICAL 403',
      status: 'inactive',
      protocol: 'M-Bus'
    },
    {
      name: 'Air Quality Monitor',
      site_id: sites[2]?.id || sites[1]?.id || sites[0].id, // Porto, Lisboa or Faro
      type: 'Sensor',
      manufacturer: 'Honeywell',
      model: 'IAQ-CORE C',
      status: 'active',
      protocol: 'I2C',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    },
    {
      name: 'Emergency Generator',
      site_id: sites[1]?.id || sites[0].id, // Lisboa or Faro
      type: 'Generator',
      manufacturer: 'Caterpillar',
      model: 'C18',
      status: 'active',
      protocol: 'Modbus',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    },
    {
      name: 'EV Charging Station A',
      site_id: sites[0].id, // Faro
      type: 'EV Charger',
      manufacturer: 'ABB',
      model: 'Terra AC',
      status: 'active',
      protocol: 'OCPP',
      // last_sync: new Date().toISOString() // Column doesn't exist yet
    }
  ];

  console.log('\n🛠️  Creating', devices.length, 'sample devices...\n');

  let successCount = 0;
  let failedCount = 0;

  for (const device of devices) {
    const { data, error } = await supabase
      .from('devices')
      .insert(device)
      .select()
      .single();

    if (error) {
      console.log('❌ Failed to create:', device.name);
      console.log('   Error:', error.message);
      failedCount++;
    } else {
      const siteName = sites.find(s => s.id === device.site_id)?.name || 'Unknown';
      console.log('✅ Created:', device.name);
      console.log('   Location:', siteName);
      console.log('   Type:', device.type, '| Status:', device.status);
      console.log('');
      successCount++;
    }
  }

  // Get final count
  const { count } = await supabase
    .from('devices')
    .select('*', { count: 'exact' });

  console.log('━'.repeat(50));
  console.log('\n📊 Summary:');
  console.log('   Devices created:', successCount);
  console.log('   Failed:', failedCount);
  console.log('   Total devices in system:', count || 0);
  console.log('');
  console.log('🎉 Device setup complete!');
}

createSampleDevices().catch(console.error);