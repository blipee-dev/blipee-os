import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkLocations() {
  console.log('📍 Checking device location parsing...\n');

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

  // Get all devices
  const { data: devices, error } = await supabase
    .from('devices')
    .select('id, name, location, metadata, type')
    .eq('site_id', site.id)
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total devices: ${devices.length}\n`);

  // Analyze metadata
  let withFloor = 0;
  let withFraction = 0;
  let withUtan = 0;
  let missingInfo = [];

  devices.forEach(d => {
    const meta = d.metadata || {};

    if (meta.floor) withFloor++;
    if (meta.fraction) withFraction++;
    if (meta.is_utan) withUtan++;

    if (!meta.floor && !d.type.includes('electricity')) {
      missingInfo.push(d);
    }
  });

  console.log('📊 Location Parsing Results:');
  console.log(`   ✅ With floor number: ${withFloor}/${devices.length}`);
  console.log(`   ✅ With fraction (A/B/C): ${withFraction}/${devices.length}`);
  console.log(`   ✅ UTAN units: ${withUtan}/${devices.length}`);
  console.log(`   ❌ Missing floor info: ${missingInfo.length}/${devices.length}\n`);

  // Show breakdown by floor
  console.log('🏢 Devices by Floor:');
  const floorMap = new Map();

  devices.forEach(d => {
    const floor = d.metadata?.floor || 'Unknown';
    const fraction = d.metadata?.fraction || '';
    const isUtan = d.metadata?.is_utan ? 'UTAN' : '';
    const type = d.type === 'enthalpy_meter' ?
      (d.name.includes('Heating') ? '🔥' : '❄️') : '⚡';

    const key = floor;
    if (!floorMap.has(key)) {
      floorMap.set(key, []);
    }

    floorMap.get(key).push({
      name: d.name,
      fraction,
      isUtan,
      type,
      location: d.location
    });
  });

  // Sort floors numerically
  const sortedFloors = Array.from(floorMap.keys()).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(a) - parseInt(b);
  });

  sortedFloors.forEach(floor => {
    const devices = floorMap.get(floor);
    console.log(`\nFloor ${floor}: (${devices.length} devices)`);

    devices.sort((a, b) => {
      // Sort by fraction then by type
      if (a.fraction !== b.fraction) return a.fraction.localeCompare(b.fraction);
      return a.type.localeCompare(b.type);
    });

    devices.forEach(d => {
      const unit = d.isUtan ? 'UTAN' : d.fraction ? `Unit ${d.fraction}` : '';
      console.log(`   ${d.type} ${unit.padEnd(8)} - ${d.name}`);
    });
  });

  // Show devices with missing info
  if (missingInfo.length > 0) {
    console.log('\n⚠️  Devices with missing floor information:');
    missingInfo.forEach(d => {
      console.log(`   - ${d.name}`);
      console.log(`     Location: "${d.location}"`);
    });
  }

  // Summary of pairs
  console.log('\n🔄 HVAC Pairs by Location:');
  const locationPairs = new Map();

  devices.filter(d => d.type === 'enthalpy_meter').forEach(d => {
    const floor = d.metadata?.floor || 'Unknown';
    const fraction = d.metadata?.fraction || '';
    const isUtan = d.metadata?.is_utan;

    const locationKey = `Floor ${floor}${fraction ? ` Unit ${fraction}` : ''}${isUtan ? ' UTAN' : ''}`;

    if (!locationPairs.has(locationKey)) {
      locationPairs.set(locationKey, { heating: 0, cooling: 0 });
    }

    if (d.name.includes('Heating')) {
      locationPairs.get(locationKey).heating++;
    } else if (d.name.includes('Cooling')) {
      locationPairs.get(locationKey).cooling++;
    }
  });

  locationPairs.forEach((counts, location) => {
    const status = counts.heating === 1 && counts.cooling === 1 ? '✅' : '⚠️';
    console.log(`   ${status} ${location}: ${counts.heating} heating, ${counts.cooling} cooling`);
  });
}

checkLocations();