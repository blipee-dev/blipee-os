import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function fixElectricityMeters() {
  console.log('🔧 Fixing electricity meter names...\n');

  // Get FPM41 site
  const { data: site } = await supabase
    .from('sites')
    .select('id, name')
    .ilike('name', '%FPM41%')
    .single();

  if (!site) {
    console.log('FPM41 site not found');
    return;
  }

  // Get all devices with PT external IDs
  const { data: devices, error } = await supabase
    .from('devices')
    .select('id, external_id, name, metadata')
    .eq('site_id', site.id)
    .order('external_id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Find electricity meters (PT codes)
  const electricityMeters = devices.filter(d => {
    // Check if external_id starts with PT or if it's in the metadata
    const extId = d.external_id || '';
    const originalName = d.metadata?.original_name || '';
    return extId.startsWith('PT') || originalName.startsWith('PT');
  });

  console.log(`Found ${electricityMeters.length} electricity meters to fix\n`);

  // Update each electricity meter
  for (const meter of electricityMeters) {
    const ptCode = meter.external_id?.startsWith('PT')
      ? meter.external_id
      : meter.metadata?.original_name;

    if (ptCode && ptCode.startsWith('PT')) {
      const newName = `Electricity Meter - ${ptCode}`;

      console.log(`Updating: ${meter.name} → ${newName}`);

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          name: newName,
          type: 'electricity_meter',
          external_id: ptCode,
          metadata: {
            ...meter.metadata,
            meter_code: ptCode,
            meter_type: 'electricity',
            updated_reason: 'Fixed PT meter naming'
          }
        })
        .eq('id', meter.id);

      if (updateError) {
        console.error(`  ❌ Error updating ${ptCode}:`, updateError.message);
      } else {
        console.log(`  ✅ Updated successfully`);
      }
    }
  }

  // Final check
  console.log('\n📊 Final count:');
  const { data: finalDevices } = await supabase
    .from('devices')
    .select('name, type')
    .eq('site_id', site.id);

  const heating = finalDevices.filter(d => d.name.includes('Heating'));
  const cooling = finalDevices.filter(d => d.name.includes('Cooling'));
  const electricity = finalDevices.filter(d => d.name.includes('Electricity') || d.name.includes('PT'));

  console.log(`🔥 Heating: ${heating.length}`);
  console.log(`❄️  Cooling: ${cooling.length}`);
  console.log(`⚡ Electricity: ${electricity.length}`);
  console.log(`\nTotal: ${finalDevices.length} devices`);

  // Show electricity meters
  if (electricity.length > 0) {
    console.log('\n⚡ Electricity meters:');
    electricity.forEach(d => {
      console.log(`   - ${d.name}`);
    });
  }
}

fixElectricityMeters();