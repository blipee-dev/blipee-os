import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bulkData } = await request.json();
    
    if (!bulkData || !Array.isArray(bulkData)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of energy consumption records.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const errors: Array<{ row: number; _error: string }> = [];
    const successfulInserts: any[] = [];

    // Process each record
    for (let i = 0; i < bulkData.length; i++) {
      const record = bulkData[i];
      
      try {
        // Validate required fields
        if (!record.facility_name || !record.period_start || !record.period_end || !record.energy_type || !record.consumption_value) {
          errors.push({ row: i + 1, _error: 'Missing required fields' });
          continue;
        }

        // Get facility_id from facility_name
        const { data: facility, _error: facilityError } = await supabase
          .from('facilities')
          .select('id')
          .eq('organization_id', record.organization_id)
          .eq('name', record.facility_name)
          .single();

        if (facilityError || !facility) {
          errors.push({ row: i + 1, _error: `Facility '${record.facility_name}' not found` });
          continue;
        }

        // Convert to kWh if needed
        let consumption_kwh = parseFloat(record.consumption_kwh || record.consumption_value);
        if (record.consumption_unit && record.consumption_unit !== 'kWh') {
          // Simple conversion for common units
          if (record.consumption_unit === 'MWh') {
            consumption_kwh = consumption_kwh * 1000;
          } else if (record.consumption_unit === 'GJ') {
            consumption_kwh = consumption_kwh * 277.778;
          }
        }

        // Prepare energy consumption record
        const energyRecord = {
          organization_id: record.organization_id,
          facility_id: facility.id,
          period_start: record.period_start,
          period_end: record.period_end,
          energy_type: record.energy_type,
          consumption_value: parseFloat(record.consumption_value),
          consumption_unit: record.consumption_unit || 'kWh',
          consumption_kwh: consumption_kwh,
          cost_amount: parseFloat(record.cost) || null,
          cost_currency: record.currency || 'USD',
          renewable_percentage: parseFloat(record.renewable_percentage) || 0,
          grid_mix_percentage: parseFloat(record.grid_mix_percentage) || 100,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert energy consumption record
        const { data: insertedRecord, _error: insertError } = await supabase
          .from('energy_consumption')
          .insert([energyRecord])
          .select()
          .single();

        if (insertError) {
          errors.push({ row: i + 1, _error: insertError.message });
          continue;
        }

        successfulInserts.push(insertedRecord);

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push({ row: i + 1, _error: 'Processing error' });
      }
    }

    return NextResponse.json({
      success: true,
      processed: successfulInserts.length,
      errors: errors,
      message: `Successfully imported ${successfulInserts.length} energy consumption records`
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}