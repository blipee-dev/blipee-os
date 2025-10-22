import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SURVEY_TEMPLATES } from '@/lib/surveys/templates';

/**
 * Process a survey response and convert to metrics_data entries
 * POST /api/surveys/process/[responseId]
 *
 * This endpoint:
 * 1. Fetches the survey response
 * 2. Loads the template and metric mappings
 * 3. Converts answers to metrics_data entries
 * 4. Links metrics back to the response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { responseId: string } }
) {
  try {
    const { responseId } = params;

    // Fetch the survey response
    const { data: response, error: fetchError } = await supabaseAdmin
      .from('survey_responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (fetchError || !response) {
      return NextResponse.json(
        { error: 'Survey response not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (response.processed) {
      return NextResponse.json({
        success: true,
        message: 'Survey response already processed',
        metrics_created: 0
      });
    }

    // Get the template
    const templateId = response.template_id;
    const template = Object.values(SURVEY_TEMPLATES).find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Survey template not found' },
        { status: 404 }
      );
    }

    const answers = response.answers as Record<string, any>;
    const metricsCreated: any[] = [];

    // Process each metric mapping
    for (const mapping of template.metricMappings) {
      const { questionId, metricCode, valueTransform, unit, scope } = mapping;

      // Get the answer for this question
      let metricValue = answers[questionId];

      if (metricValue === undefined || metricValue === null || metricValue === '') {
        continue; // Skip if no answer
      }

      // Apply value transformation if specified
      if (valueTransform) {
        try {
          // Create a safe evaluation context
          const evaluationContext: Record<string, any> = { ...answers };

          // Parse and evaluate the transform formula
          // Simple replacements for common calculations
          let formula = valueTransform
            .replace(/distance/g, answers.commute_distance || 0)
            .replace(/days_in_office/g, answers.days_in_office || 0)
            .replace(/weight/g, answers.shipment_weight || 0);

          // Evaluate the formula safely
          metricValue = eval(formula);
        } catch (error) {
          console.error('Error transforming value:', error);
          continue;
        }
      }

      // Get or create the metric in metrics_catalog
      let { data: metricCatalog, error: catalogError } = await supabaseAdmin
        .from('metrics_catalog')
        .select('id, emission_factor')
        .eq('code', metricCode)
        .single();

      // If metric doesn't exist, create it
      if (catalogError || !metricCatalog) {
        const { data: newMetric, error: createError } = await supabaseAdmin
          .from('metrics_catalog')
          .insert({
            code: metricCode,
            name: metricCode.replace(/_/g, ' ').replace(/scope\d+/g, '').trim(),
            category: template.category,
            unit: unit || 'units',
            scope: scope || 'scope_3',
            data_source: 'survey',
            collection_frequency: 'on_demand',
            is_calculated: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating metric catalog:', createError);
          continue;
        }

        metricCatalog = newMetric;
      }

      // Determine which mode/type this metric belongs to (for proper routing)
      // Extract mode from metric code (e.g., 'scope3_commute_car' -> 'car')
      const modeParts = metricCode.split('_');
      const mode = modeParts[modeParts.length - 1]; // Last part is usually the mode

      // Only create metric if answer matches the mode
      // For example, only create 'scope3_commute_car' if primary_commute_mode === 'car_solo'
      const primaryMode = answers.primary_commute_mode || answers.transport_mode || answers.travel_mode;

      // Skip if this metric doesn't match the selected mode
      if (primaryMode && !metricCode.includes(primaryMode.split('_')[0]) && metricCode !== 'scope3_commute_remote') {
        continue;
      }

      // Calculate emissions using emission factor
      const emissionFactor = metricCatalog.emission_factor || 0;
      const co2eEmissions = parseFloat(metricValue) * emissionFactor;

      // Determine period (current month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Create metrics_data entry
      const { data: metricData, error: dataError } = await supabaseAdmin
        .from('metrics_data')
        .insert({
          organization_id: response.organization_id,
          site_id: response.site_id,
          metric_id: metricCatalog.id,
          value: parseFloat(metricValue).toString(),
          unit: unit || metricCatalog.unit,
          co2e_emissions: co2eEmissions,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          data_source: 'survey',
          notes: `From survey response ${response.id}`,
          entered_by: response.respondent_id
        })
        .select()
        .single();

      if (dataError) {
        console.error('Error creating metrics_data:', dataError);
        continue;
      }

      // Create mapping between survey response and metric
      await supabaseAdmin
        .from('survey_metrics_mapping')
        .insert({
          response_id: response.id,
          metric_data_id: metricData.id,
          question_id: questionId,
          metric_code: metricCode
        });

      metricsCreated.push(metricData);
    }

    // Mark response as processed
    await supabaseAdmin
      .from('survey_responses')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', responseId);

    return NextResponse.json({
      success: true,
      message: 'Survey response processed successfully',
      metrics_created: metricsCreated.length,
      metrics: metricsCreated
    });
  } catch (error) {
    console.error('Error processing survey response:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
