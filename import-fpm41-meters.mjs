import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function importMeters() {
  console.log('🚀 Starting FPM41 energy meters import...\n');

  try {
    // Step 1: Find the FPM41 site
    console.log('1️⃣ Looking for FPM41 site...');
    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .select('id, name, address')
      .or('name.ilike.%FPM41%,name.ilike.%Fontes Pereira%');

    if (siteError) {
      console.error('Error finding site:', siteError);
      return;
    }

    let siteId;
    if (!sites || sites.length === 0) {
      console.log('   Site not found. Creating FPM41 site...');

      // Get first organization (you may need to adjust this)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (!orgs || orgs.length === 0) {
        console.error('No organizations found. Please create an organization first.');
        return;
      }

      // Create the site
      const { data: newSite, error: createError } = await supabase
        .from('sites')
        .insert({
          organization_id: orgs[0].id,
          name: 'FPM41 - Av Fontes Pereira Melo 41',
          address: 'Av Fontes Pereira Melo 41, Lisboa, 1050-055',
          city: 'Lisboa',
          country: 'Portugal',
          metadata: {
            building_type: 'Commercial',
            floors: 14,
            total_area: '15000 m²'
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating site:', createError);
        return;
      }

      siteId = newSite.id;
      console.log('   ✅ Site created:', newSite.name);
    } else {
      siteId = sites[0].id;
      console.log('   ✅ Found site:', sites[0].name);
    }

    // Step 2: Read and parse CSV
    console.log('\n2️⃣ Reading CSV file...');
    const csvContent = readFileSync('/Users/pedro/Downloads/My+Energy+Meters.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true // Handle BOM if present
    });

    console.log(`   ✅ Found ${records.length} meters in CSV\n`);

    // Step 3: Import meters
    console.log('3️⃣ Importing meters...');
    const meters = [];
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      const identification = record['Identificação'] || '';
      const location = record['localização'] || '';
      const area = record['area'] || '';
      const units = record['unidades'] || '';
      const useType = record['tipoUso'] || '';
      const id = record['ID'] || '';

      // Parse the meter info
      const isHeating = useType.toLowerCase() === 'heating' || identification.includes('Água Quente');
      const isCooling = useType.toLowerCase() === 'cooling' || identification.includes('Água Fria');

      // Extract floor and fraction from identification
      const floorMatch = identification.match(/Piso (\d+)/);
      const fractionMatch = identification.match(/Fração ([A-Z])/);
      const utanMatch = identification.match(/UTAN/);

      const floor = floorMatch ? floorMatch[1] : '';
      const fraction = fractionMatch ? fractionMatch[1] : '';
      const isUtan = !!utanMatch;

      // Determine device type and name
      const deviceType = isHeating || isCooling ? 'enthalpy_meter' : 'electricity_meter';
      const meterType = isHeating ? 'Heating' : isCooling ? 'Cooling' : 'Electricity';

      let deviceName = `Floor ${floor}`;
      if (isUtan) {
        deviceName += ' UTAN';
      } else if (fraction) {
        deviceName += ` Unit ${fraction}`;
      }
      deviceName += ` - ${meterType}`;

      const device = {
        site_id: siteId,
        external_id: id,
        name: deviceName.trim(),
        type: deviceType,
        manufacturer: 'Unknown', // Update if you have this info
        model: 'Unknown', // Update if you have this info
        serial_number: id.split('-')[0].toUpperCase(), // Use part of ID as serial
        location: identification,
        metadata: {
          original_name: identification,
          floor: floor,
          fraction: fraction,
          is_utan: isUtan,
          area: area,
          area_units: units,
          use_type: useType,
          meter_type: meterType,
          imported_at: new Date().toISOString()
        },
        status: 'active',
        installed_at: record['Created Date'] || new Date().toISOString()
      };

      meters.push(device);
    }

    // Step 4: Bulk insert meters
    console.log(`\n4️⃣ Inserting ${meters.length} meters into database...`);

    // Insert in batches of 20 to avoid timeouts
    const batchSize = 20;
    for (let i = 0; i < meters.length; i += batchSize) {
      const batch = meters.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('devices')
        .insert(batch)
        .select();

      if (error) {
        console.error(`   ❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += data.length;
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} meters imported`);
      }
    }

    // Step 5: Summary
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(40));
    console.log(`Total meters in CSV: ${records.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log('─'.repeat(40));

    // Step 6: Verify import
    const { count } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId);

    console.log(`\n✅ Total devices for FPM41: ${count}`);

    // Show sample of imported devices
    const { data: samples } = await supabase
      .from('devices')
      .select('name, type, location')
      .eq('site_id', siteId)
      .limit(5);

    if (samples && samples.length > 0) {
      console.log('\n📋 Sample of imported devices:');
      samples.forEach(device => {
        console.log(`   • ${device.name}`);
      });
    }

    console.log('\n🎉 Import complete! Your meters are ready for data collection.');

  } catch (error) {
    console.error('Fatal error during import:', error);
  }
}

// Run the import
importMeters();