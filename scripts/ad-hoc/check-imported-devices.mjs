import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkDevices() {
  console.log('📊 Checking imported devices...\n');

  // Get FPM41 site
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .ilike('name', '%FPM41%')
    .single();

  if (!sites) {
    console.log('FPM41 site not found');
    return;
  }

  // Get all devices for this site
  const { data: devices, error } = await supabase
    .from('devices')
    .select('id, name, type, external_id')
    .eq('site_id', sites.id)
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Count by type
  const heating = devices.filter(d => d.name.includes('Heating'));
  const cooling = devices.filter(d => d.name.includes('Cooling'));
  const electricity = devices.filter(d => d.name.includes('Electricity') || d.external_id?.startsWith('PT'));

  console.log(`Total devices imported: ${devices.length}`);
  console.log(`🔥 Heating: ${heating.length}`);
  console.log(`❄️  Cooling: ${cooling.length}`);
  console.log(`⚡ Electricity: ${electricity.length}`);

  // Check for PT meters
  const ptMeters = devices.filter(d => d.external_id?.startsWith('PT'));
  console.log(`\n⚡ PT meters found: ${ptMeters.length}`);

  if (ptMeters.length === 0) {
    console.log('\n❌ PROBLEM: No electricity meters (PT codes) were imported!');
    console.log('We need to import the 9 missing electricity meters.');
  } else {
    ptMeters.forEach(d => {
      console.log(`   - ${d.name} (${d.external_id})`);
    });
  }

  // Show some mismatches
  console.log('\n📋 Sample of imported devices:');
  devices.slice(0, 5).forEach(d => {
    console.log(`   - ${d.name} [${d.type}]`);
  });
}

checkDevices();