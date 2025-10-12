import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * API endpoint to manage baseline restatements.
 *
 * GET    /api/sustainability/baseline/restatements?organizationId=xxx&targetId=xxx
 * POST   /api/sustainability/baseline/restatements (create new restatement)
 * PATCH  /api/sustainability/baseline/restatements (update status: approve, apply, reject)
 */

// GET: Fetch baseline restatements for a target
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('baseline_restatements')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Filter by target if provided
    if (targetId) {
      query = query.eq('target_id', targetId);
    }

    const { data: restatements, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.message?.includes('does not exist')) {
        console.log('⚠️ baseline_restatements table not found, returning empty array');
        return NextResponse.json({
          success: true,
          restatements: [],
          count: 0,
          message: 'Database migration pending. Please apply the baseline restatement migration.'
        });
      }

      console.error('Error fetching restatements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restatements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      restatements: restatements || [],
      count: restatements?.length || 0
    });

  } catch (error) {
    console.error('Error in GET restatements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new baseline restatement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      targetId,
      restatementReason,
      restatementType = 'scope_expansion',
      originalBaselineYear,
      originalBaselineEmissions,
      newMetrics, // Array of { metric_id, estimated_emissions, estimation_method, estimation_confidence, estimation_notes }
      methodologyNotes,
      supportingDocuments
    } = body;

    // Validation
    if (!organizationId || !targetId || !restatementReason || !originalBaselineYear || !originalBaselineEmissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!newMetrics || !Array.isArray(newMetrics) || newMetrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one new metric is required for restatement' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating baseline restatement for target ${targetId}`);

    // Calculate restated baseline
    const additionalEmissions = newMetrics.reduce(
      (sum: number, m: any) => sum + (parseFloat(m.estimated_emissions) || 0),
      0
    );
    const restatedBaselineEmissions = parseFloat(originalBaselineEmissions) + additionalEmissions;

    // Prepare new metrics JSON
    const newMetricsAdded = newMetrics.map((m: any) => ({
      metric_id: m.metric_id,
      metric_name: m.metric_name,
      metric_code: m.metric_code,
      category: m.category,
      scope: m.scope
    }));

    // Prepare historical estimates JSON
    const historicalEstimates = newMetrics.map((m: any) => ({
      metric_id: m.metric_id,
      estimated_emissions: m.estimated_emissions,
      estimation_method: m.estimation_method || 'industry_average',
      estimation_confidence: m.estimation_confidence || 'medium',
      estimation_notes: m.estimation_notes || ''
    }));

    // Insert restatement record
    const { data: restatement, error: insertError } = await supabaseAdmin
      .from('baseline_restatements')
      .insert({
        organization_id: organizationId,
        target_id: targetId,
        restatement_reason: restatementReason,
        restatement_type: restatementType,
        original_baseline_year: originalBaselineYear,
        original_baseline_emissions: originalBaselineEmissions,
        restated_baseline_emissions: restatedBaselineEmissions,
        new_metrics_added: newMetricsAdded,
        historical_estimates: historicalEstimates,
        methodology_notes: methodologyNotes,
        supporting_documents: supportingDocuments,
        status: 'draft',
        created_by: null // TODO: Add auth.uid() when auth is integrated
      })
      .select()
      .single();

    if (insertError) {
      // If table doesn't exist
      if (insertError.message?.includes('does not exist')) {
        console.error('⚠️ baseline_restatements table not found');
        return NextResponse.json(
          { error: 'Database migration required. Please apply the baseline restatement migration first.' },
          { status: 503 }
        );
      }

      console.error('Error creating restatement:', insertError);
      return NextResponse.json(
        { error: 'Failed to create restatement' },
        { status: 500 }
      );
    }

    // Create metric tracking history records for new metrics
    const trackingHistoryRecords = newMetrics.map((m: any) => ({
      organization_id: organizationId,
      metric_id: m.metric_id,
      started_tracking_date: m.started_tracking_date || new Date().toISOString().split('T')[0],
      first_data_entry_date: m.first_data_entry_date || null,
      in_original_baseline: false,
      baseline_year: originalBaselineYear,
      estimated_baseline_emissions: m.estimated_emissions,
      estimation_method: m.estimation_method || 'industry_average',
      estimation_confidence: m.estimation_confidence || 'medium',
      estimation_notes: m.estimation_notes || ''
    }));

    const { error: historyError } = await supabaseAdmin
      .from('metric_tracking_history')
      .upsert(trackingHistoryRecords, {
        onConflict: 'organization_id,metric_id',
        ignoreDuplicates: false
      });

    if (historyError) {
      console.warn('⚠️ Could not create tracking history:', historyError.message);
      // Don't fail the request - this is supplementary data
    }

    console.log(`✅ Created restatement ${restatement.id}`);

    return NextResponse.json({
      success: true,
      restatement,
      message: 'Baseline restatement created successfully. Status: draft'
    });

  } catch (error) {
    console.error('Error in POST restatements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update restatement status (approve, apply, reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restatementId,
      action, // 'approve', 'apply', 'reject'
      userId // User performing the action
    } = body;

    if (!restatementId || !action) {
      return NextResponse.json(
        { error: 'Missing restatementId or action' },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating restatement ${restatementId}: ${action}`);

    // Fetch the restatement
    const { data: restatement, error: fetchError } = await supabaseAdmin
      .from('baseline_restatements')
      .select('*')
      .eq('id', restatementId)
      .single();

    if (fetchError || !restatement) {
      console.error('Error fetching restatement:', fetchError);
      return NextResponse.json(
        { error: 'Restatement not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let targetUpdateRequired = false;

    switch (action) {
      case 'approve':
        if (restatement.status !== 'draft') {
          return NextResponse.json(
            { error: 'Only draft restatements can be approved' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString()
        };
        break;

      case 'apply':
        if (restatement.status !== 'approved') {
          return NextResponse.json(
            { error: 'Only approved restatements can be applied' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'applied',
          applied_at: new Date().toISOString()
        };
        targetUpdateRequired = true;
        break;

      case 'reject':
        if (restatement.status === 'applied') {
          return NextResponse.json(
            { error: 'Cannot reject an already applied restatement' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'rejected'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, apply, or reject' },
          { status: 400 }
        );
    }

    // Update restatement status
    const { data: updatedRestatement, error: updateError } = await supabaseAdmin
      .from('baseline_restatements')
      .update(updateData)
      .eq('id', restatementId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating restatement:', updateError);
      return NextResponse.json(
        { error: 'Failed to update restatement' },
        { status: 500 }
      );
    }

    // If applying, update the sustainability target with restated baseline
    if (targetUpdateRequired) {
      console.log(`📊 Applying restated baseline to target ${restatement.target_id}`);

      // Fetch the target to calculate new target emissions
      const { data: target, error: targetFetchError } = await supabaseAdmin
        .from('sustainability_targets')
        .select('*')
        .eq('id', restatement.target_id)
        .single();

      if (targetFetchError || !target) {
        console.error('Error fetching target:', targetFetchError);
        return NextResponse.json(
          { error: 'Could not fetch target for restatement application' },
          { status: 500 }
        );
      }

      // Calculate new target emissions maintaining the same % reduction
      const originalReductionPercent = target.reduction_percent || 50; // Default to 50% if not set
      const newTargetEmissions = restatement.restated_baseline_emissions * (1 - originalReductionPercent / 100);

      // Update sustainability target
      const { error: targetUpdateError } = await supabaseAdmin
        .from('sustainability_targets')
        .update({
          baseline_emissions: restatement.restated_baseline_emissions,
          target_emissions: newTargetEmissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', restatement.target_id);

      if (targetUpdateError) {
        console.error('Error updating target:', targetUpdateError);
        return NextResponse.json(
          { error: 'Failed to apply restatement to target' },
          { status: 500 }
        );
      }

      console.log(`✅ Applied restated baseline: ${restatement.original_baseline_emissions} → ${restatement.restated_baseline_emissions} tCO2e`);
    }

    return NextResponse.json({
      success: true,
      restatement: updatedRestatement,
      message: `Restatement ${action}ed successfully`,
      appliedToTarget: targetUpdateRequired
    });

  } catch (error) {
    console.error('Error in PATCH restatements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
