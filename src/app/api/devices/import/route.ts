import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/devices/import - Bulk import devices from CSV data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { site_id, devices } = body;

    if (!site_id || !devices || !Array.isArray(devices)) {
      return NextResponse.json({
        error: 'site_id and devices array are required'
      }, { status: 400 });
    }

    // Format devices for insertion
    const devicesToInsert = devices.map(device => ({
      site_id,
      external_id: device.external_id || device.sensor_id,
      name: device.name || device.description,
      type: determineDeviceType(device),
      manufacturer: device.manufacturer,
      model: device.model,
      serial_number: device.serial_number || device.external_id,
      location: device.location || device.application,
      metadata: {
        original_data: device,
        import_date: new Date().toISOString(),
      },
      status: 'active',
      installed_at: device.installed_at || new Date().toISOString(),
    }));

    // Insert devices in batches to handle large imports
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < devicesToInsert.length; i += batchSize) {
      const batch = devicesToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('devices')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        // Continue with other batches even if one fails
        results.push({
          batch: i / batchSize + 1,
          error: error.message,
          devices: batch.map(d => d.name),
        });
      } else {
        results.push({
          batch: i / batchSize + 1,
          success: true,
          count: data.length,
        });
      }
    }

    // Summary of import
    const summary = {
      total_devices: devices.length,
      batches_processed: results.length,
      successful_imports: results.filter(r => r.success).reduce((acc, r) => acc + r.count, 0),
      failed_batches: results.filter(r => r.error),
    };

    return NextResponse.json({
      summary,
      details: results,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/devices/import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to determine device type from description
function determineDeviceType(device: any): string {
  const description = (device.description || device.application || '').toLowerCase();
  const sensorId = (device.sensor_id || device.external_id || '').toLowerCase();

  // Check for enthalpy/HVAC meters
  if (description.includes('água') || description.includes('water') ||
      description.includes('enthalpy') || sensorId.startsWith('ea')) {
    return 'enthalpy_meter';
  }

  // Check for electricity meters
  if (description.includes('pt') || description.includes('electric') ||
      description.includes('power') || sensorId.startsWith('pt')) {
    return 'electricity_meter';
  }

  // Check for temperature sensors
  if (description.includes('temp') || description.includes('temperature')) {
    return 'temperature';
  }

  // Check for air quality
  if (description.includes('air') || description.includes('co2') ||
      description.includes('quality')) {
    return 'air_quality';
  }

  // Check for people counters
  if (description.includes('people') || description.includes('occupancy') ||
      description.includes('counter')) {
    return 'people_counter';
  }

  // Default to generic meter
  return 'meter';
}