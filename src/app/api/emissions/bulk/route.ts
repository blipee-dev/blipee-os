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
        { error: 'Invalid data format. Expected array of emission records.' },
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
        if (!record.facility_name || !record.period_start || !record.period_end || !record.scope || !record.activity_value) {
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

        // Get or create emission source
        let emissionSourceId = null;
        if (record.source_category) {
          const { data: existingSource } = await supabase
            .from('emission_sources')
            .select('id')
            .eq('organization_id', record.organization_id)
            .eq('name', record.source_category)
            .single();

          if (existingSource) {
            emissionSourceId = existingSource.id;
          } else {
            // Create new emission source
            const { data: newSource, error: sourceError } = await supabase
              .from('emission_sources')
              .insert([{
                organization_id: record.organization_id,
                name: record.source_category,
                code: record.source_category.toLowerCase().replace(/\s+/g, '_'),
                description: record.activity_description || '',
                scope: record.scope,
                category: record.source_category,
                is_active: true
              }])
              .select('id')
              .single();

            if (!sourceError && newSource) {
              emissionSourceId = newSource.id;
            }
          }
        }

        // Prepare emission record
        const emissionRecord: any = {
          organization_id: record.organization_id,
          source_id: emissionSourceId || record.source_id || '',  // source_id is required
          period_start: record.period_start,
          period_end: record.period_end,
          activity_value: parseFloat(record.activity_value),
          activity_unit: record.activity_unit || 'kg',
          activity_description: record.activity_description || null,
          emission_factor: parseFloat(record.emission_factor) || 1,
          emission_factor_unit: record.emission_factor_unit || 'kgCO2e/unit',
          emission_factor_source: record.emission_factor_source || null,
          co2e_tonnes: parseFloat(record.co2e_tonnes) || (parseFloat(record.activity_value) * parseFloat(record.emission_factor) / 1000),
          data_quality: record.data_quality || 'estimated',
          verification_status: record.verification_status || null,
          notes: record.notes || null,
          created_by: user.id
        };

        // Insert emission record
        const { data: insertedRecord, error: insertError } = await supabase
          .from('emissions')
          .insert([emissionRecord])
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
      message: `Successfully imported ${successfulInserts.length} emission records`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}