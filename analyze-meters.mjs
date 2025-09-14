import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const csvContent = readFileSync('/Users/pedro/Downloads/My+Energy+Meters.csv', 'utf-8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });

console.log('📊 METER ANALYSIS\n');
console.log('Total records:', records.length);

// Analyze by type
const heating = records.filter(r => r['tipoUso'] === 'Heating' || r['Identificação'].includes('Água Quente'));
const cooling = records.filter(r => r['tipoUso'] === 'Cooling' || r['Identificação'].includes('Água Fria'));
const other = records.filter(r => {
  const tipo = r['tipoUso'] || '';
  const id = r['Identificação'] || '';
  return tipo !== 'Heating' && tipo !== 'Cooling' && !id.includes('Água Quente') && !id.includes('Água Fria');
});

console.log('\n🔥 Heating meters:', heating.length);
console.log('❄️  Cooling meters:', cooling.length);
console.log('⚡ Other/Electricity meters:', other.length);

// Show other meters
if (other.length > 0) {
  console.log('\n⚡ Non-HVAC meters (likely electricity):');
  other.forEach(r => {
    console.log(`   - ${r['Identificação']} | Type: "${r['tipoUso'] || 'NOT SPECIFIED'}"`);
  });
}

// Analyze locations to find pairs
console.log('\n📍 LOCATION ANALYSIS:');
const locationMap = new Map();

records.forEach(r => {
  const id = r['Identificação'] || '';
  // Extract base location (remove water type)
  const baseLocation = id.replace(/ - Água (Quente|Fria)/g, '').trim();

  if (!locationMap.has(baseLocation)) {
    locationMap.set(baseLocation, { heating: 0, cooling: 0, other: 0 });
  }

  const entry = locationMap.get(baseLocation);
  if (id.includes('Água Quente')) {
    entry.heating++;
  } else if (id.includes('Água Fria')) {
    entry.cooling++;
  } else {
    entry.other++;
  }
});

// Show unpaired meters
console.log('\nLocations with unpaired meters:');
let pairedCount = 0;
let unpairedCount = 0;

locationMap.forEach((counts, location) => {
  if (counts.heating !== counts.cooling) {
    console.log(`   ${location}:`);
    console.log(`      Heating: ${counts.heating}, Cooling: ${counts.cooling}`);
    unpairedCount++;
  } else if (counts.heating > 0) {
    pairedCount++;
  }

  if (counts.other > 0) {
    console.log(`   ${location}: ${counts.other} other meter(s)`);
  }
});

console.log(`\n✅ Paired locations: ${pairedCount}`);
console.log(`⚠️  Unpaired locations: ${unpairedCount}`);

// Check for PT (electricity) meters
console.log('\n⚡ Checking for PT (electricity) meters:');
const ptMeters = records.filter(r => {
  const id = r['Identificação'] || '';
  return id.includes('PT') || id.toLowerCase().includes('electricidade') || id.toLowerCase().includes('electricity');
});

console.log(`Found ${ptMeters.length} potential electricity meters`);
if (ptMeters.length > 0) {
  ptMeters.forEach(r => {
    console.log(`   - ${r['Identificação']}`);
  });
}