import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bulkData } = await request.json();
    
    if (!bulkData || !Array.isArray(bulkData)) {
      return NextResponse.json(
        { _error: 'Invalid data format. Expected array of target records.' },
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
        if (!record.target_name || !record.target_type || !record.baseline_year || !record.target_year) {
          errors.push({ row: i + 1, _error: 'Missing required fields' });
          continue;
        }

        // Parse scope coverage
        let scopeCoverage: string[] = [];
        if (record.scope_coverage) {
          scopeCoverage = record.scope_coverage.split(',').map((s: string) => s.trim());
        }

        // Prepare target record
        const targetRecord = {
          organization_id: record.organization_id,
          target_name: record.target_name,
          target_type: record.target_type,
          target_category: record.target_category || 'emissions',
          baseline_year: parseInt(record.baseline_year),
          baseline_value: parseFloat(record.baseline_value) || 0,
          baseline_unit: record.unit || 'tCO2e',
          target_year: parseInt(record.target_year),
          target_value: parseFloat(record.target_value) || 0,
          target_unit: record.unit || 'tCO2e',
          scope_coverage: scopeCoverage,
          framework: record.framework || 'custom',
          is_science_based: record.is_science_based === 'true' || record.is_science_based === true,
          public_commitment: record.public_commitment === 'true' || record.public_commitment === true,
          description: record.description || record.notes || '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert target record
        const { data: insertedRecord, _error: insertError } = await supabase
          .from('sustainability_targets')
          .insert([targetRecord])
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
      message: `Successfully imported ${successfulInserts.length} sustainability targets`
    });

  } catch (error) {
    console.error('Bulk import _error:', error);
    return NextResponse.json(
      { _error: 'Internal server error' },
      { status: 500 }
    );
  }
}