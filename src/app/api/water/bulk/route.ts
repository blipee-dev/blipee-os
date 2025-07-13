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
        { error: 'Invalid data format. Expected array of water consumption records.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const errors: Array<{ row: number; error: string }> = [];
    const successfulInserts: any[] = [];

    // Process each record
    for (let i = 0; i < bulkData.length; i++) {
      const record = bulkData[i];
      
      try {
        // Validate required fields
        if (!record.facility_name || !record.period_start || !record.period_end || !record.water_source || !record.consumption_m3) {
          errors.push({ row: i + 1, error: 'Missing required fields' });
          continue;
        }

        // Get facility_id from facility_name
        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .select('id')
          .eq('organization_id', record.organization_id)
          .eq('name', record.facility_name)
          .single();

        if (facilityError || !facility) {
          errors.push({ row: i + 1, error: `Facility '${record.facility_name}' not found` });
          continue;
        }

        // Prepare water consumption record
        const waterRecord = {
          organization_id: record.organization_id,
          facility_id: facility.id,
          period_start: record.period_start,
          period_end: record.period_end,
          water_source: record.water_source,
          consumption_m3: parseFloat(record.consumption_m3),
          discharge_m3: parseFloat(record.discharge_m3) || 0,
          recycled_m3: parseFloat(record.recycled_m3) || 0,
          cost_amount: parseFloat(record.cost_amount) || null,
          cost_currency: record.cost_currency || 'USD',
          water_stress_area: record.water_stress_area || 'unknown',
          quality_parameters: record.quality_parameters || {},
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert water consumption record
        const { data: insertedRecord, error: insertError } = await supabase
          .from('water_consumption')
          .insert([waterRecord])
          .select()
          .single();

        if (insertError) {
          errors.push({ row: i + 1, error: insertError.message });
          continue;
        }

        successfulInserts.push(insertedRecord);

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push({ row: i + 1, error: 'Processing error' });
      }
    }

    return NextResponse.json({
      success: true,
      processed: successfulInserts.length,
      errors: errors,
      message: `Successfully imported ${successfulInserts.length} water consumption records`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}