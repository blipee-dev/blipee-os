-- ============================================================================
-- REPLANNING SYSTEM FUNCTIONS
-- Core database functions for atomic target replanning operations
-- ============================================================================

-- ============================================================================
-- 1. APPLY TARGET REPLANNING (Main atomic function)
-- ============================================================================
CREATE OR REPLACE FUNCTION apply_target_replanning(
    p_organization_id UUID,
    p_target_id UUID,
    p_metric_targets JSONB,
    p_strategy TEXT,
    p_trigger TEXT DEFAULT 'manual',
    p_user_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_metric_target JSONB;
    v_metric_target_id UUID;
    v_monthly_target JSONB;
    v_initiative JSONB;
    v_snapshot_metric_targets JSONB;
    v_snapshot_initiatives JSONB;
    v_previous_target DECIMAL;
    v_previous_year INTEGER;
    v_new_target DECIMAL;
    v_new_year INTEGER;
    v_total_initiatives INTEGER := 0;
    v_total_investment DECIMAL := 0;
    v_history_id UUID;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_target_id IS NULL OR p_metric_targets IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing required parameters'
        );
    END IF;

    -- Start transaction (implicit in function)

    -- 1. Get current state for snapshot
    SELECT target_emissions, target_year
    INTO v_previous_target, v_previous_year
    FROM sustainability_targets
    WHERE id = p_target_id
        AND organization_id = p_organization_id;

    IF v_previous_target IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Target not found'
        );
    END IF;

    -- 2. Create snapshot of existing metric targets
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', mt.id,
            'metric_catalog_id', mt.metric_catalog_id,
            'baseline_value', mt.baseline_value,
            'baseline_emissions', mt.baseline_emissions,
            'target_value', mt.target_value,
            'target_emissions', mt.target_emissions,
            'strategy_type', mt.strategy_type,
            'status', mt.status
        )
    ) INTO v_snapshot_metric_targets
    FROM metric_targets mt
    WHERE mt.target_id = p_target_id;

    -- 3. Create snapshot of existing initiatives
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ri.id,
            'name', ri.name,
            'estimated_reduction_tco2e', ri.estimated_reduction_tco2e,
            'implementation_status', ri.implementation_status,
            'capex', ri.capex
        )
    ) INTO v_snapshot_initiatives
    FROM reduction_initiatives ri
    WHERE ri.sustainability_target_id = p_target_id;

    -- 4. Delete existing metric targets (CASCADE will delete monthly targets too)
    DELETE FROM metric_targets WHERE target_id = p_target_id;

    -- 5. Delete existing initiatives linked to this target
    DELETE FROM reduction_initiatives WHERE sustainability_target_id = p_target_id;

    -- 6. Calculate new target total
    SELECT SUM((mt->>'targetAnnualEmissions')::DECIMAL)
    INTO v_new_target
    FROM jsonb_array_elements(p_metric_targets) mt;

    -- Get target year from first metric (should be same for all)
    SELECT (p_metric_targets->0->>'targetYear')::INTEGER INTO v_new_year;

    -- 7. Insert new metric targets
    FOR v_metric_target IN SELECT * FROM jsonb_array_elements(p_metric_targets)
    LOOP
        INSERT INTO metric_targets (
            organization_id,
            metric_catalog_id,
            target_id,
            baseline_year,
            baseline_value,
            baseline_emissions,
            target_year,
            target_value,
            target_emissions,
            reduction_percentage,
            strategy_type,
            current_emission_factor,
            target_emission_factor,
            status,
            confidence_level,
            notes,
            created_by
        ) VALUES (
            p_organization_id,
            (v_metric_target->>'metricId')::UUID,
            p_target_id,
            COALESCE((v_metric_target->>'baselineYear')::INTEGER, 2023),
            (v_metric_target->>'currentAnnualValue')::DECIMAL,
            (v_metric_target->>'currentAnnualEmissions')::DECIMAL,
            COALESCE((v_metric_target->>'targetYear')::INTEGER, 2030),
            (v_metric_target->>'targetAnnualValue')::DECIMAL,
            (v_metric_target->>'targetAnnualEmissions')::DECIMAL,
            (v_metric_target->>'reductionPercent')::DECIMAL,
            COALESCE(v_metric_target->>'strategyType', 'hybrid'),
            (v_metric_target->>'currentEmissionFactor')::DECIMAL,
            (v_metric_target->>'targetEmissionFactor')::DECIMAL,
            'active',
            COALESCE(v_metric_target->>'confidenceLevel', 'medium'),
            v_metric_target->>'notes',
            p_user_id
        )
        RETURNING id INTO v_metric_target_id;

        -- 8. Insert monthly targets for this metric
        IF v_metric_target->'monthlyTargets' IS NOT NULL THEN
            FOR v_monthly_target IN SELECT * FROM jsonb_array_elements(v_metric_target->'monthlyTargets')
            LOOP
                INSERT INTO metric_targets_monthly (
                    metric_target_id,
                    year,
                    month,
                    planned_value,
                    planned_emissions,
                    planned_emission_factor,
                    status
                ) VALUES (
                    v_metric_target_id,
                    (v_monthly_target->>'year')::INTEGER,
                    (v_monthly_target->>'month')::INTEGER,
                    (v_monthly_target->>'plannedValue')::DECIMAL,
                    (v_monthly_target->>'plannedEmissions')::DECIMAL,
                    (v_monthly_target->>'plannedEmissionFactor')::DECIMAL,
                    'planned'
                );
            END LOOP;
        END IF;

        -- 9. Insert initiatives for this metric
        IF v_metric_target->'initiatives' IS NOT NULL THEN
            FOR v_initiative IN SELECT * FROM jsonb_array_elements(v_metric_target->'initiatives')
            LOOP
                v_total_initiatives := v_total_initiatives + 1;
                v_total_investment := v_total_investment + COALESCE((v_initiative->>'capex')::DECIMAL, 0);

                INSERT INTO reduction_initiatives (
                    organization_id,
                    metric_target_id,
                    sustainability_target_id,
                    name,
                    description,
                    initiative_type,
                    estimated_reduction_tco2e,
                    estimated_reduction_percentage,
                    capex,
                    annual_opex,
                    annual_savings,
                    roi_years,
                    start_date,
                    completion_date,
                    implementation_status,
                    confidence_score,
                    risk_level,
                    created_by
                ) VALUES (
                    p_organization_id,
                    v_metric_target_id,
                    p_target_id,
                    v_initiative->>'name',
                    v_initiative->>'description',
                    v_initiative->>'type',
                    (v_initiative->>'estimatedReductionTco2e')::DECIMAL,
                    (v_initiative->>'estimatedReductionPercentage')::DECIMAL,
                    (v_initiative->>'capex')::DECIMAL,
                    (v_initiative->>'annualOpex')::DECIMAL,
                    (v_initiative->>'annualSavings')::DECIMAL,
                    (v_initiative->>'roiYears')::DECIMAL,
                    (v_initiative->>'startDate')::DATE,
                    (v_initiative->>'completionDate')::DATE,
                    COALESCE(v_initiative->>'status', 'planned'),
                    COALESCE((v_initiative->>'confidenceScore')::DECIMAL, 0.7),
                    COALESCE(v_initiative->>'riskLevel', 'medium'),
                    p_user_id
                );
            END LOOP;
        END IF;
    END LOOP;

    -- 10. Record in history
    INSERT INTO target_replanning_history (
        organization_id,
        sustainability_target_id,
        replanning_trigger,
        previous_target_emissions,
        new_target_emissions,
        previous_target_year,
        new_target_year,
        allocation_strategy,
        total_initiatives_added,
        total_estimated_investment,
        metric_targets_snapshot,
        initiatives_snapshot,
        replanned_by,
        notes
    ) VALUES (
        p_organization_id,
        p_target_id,
        p_trigger,
        v_previous_target,
        v_new_target,
        v_previous_year,
        v_new_year,
        p_strategy,
        v_total_initiatives,
        v_total_investment,
        v_snapshot_metric_targets,
        v_snapshot_initiatives,
        p_user_id,
        p_notes
    )
    RETURNING id INTO v_history_id;

    -- Return success with summary
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Replanning applied successfully',
        'historyId', v_history_id,
        'summary', jsonb_build_object(
            'previousTarget', v_previous_target,
            'newTarget', v_new_target,
            'metricTargetsCreated', jsonb_array_length(p_metric_targets),
            'initiativesCreated', v_total_initiatives,
            'totalInvestment', v_total_investment
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback happens automatically
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. ROLLBACK REPLANNING
-- ============================================================================
CREATE OR REPLACE FUNCTION rollback_target_replanning(
    p_history_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_history RECORD;
    v_metric_target JSONB;
    v_initiative JSONB;
    v_metric_target_id UUID;
BEGIN
    -- Get history record
    SELECT * INTO v_history
    FROM target_replanning_history
    WHERE id = p_history_id;

    IF v_history IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'History record not found');
    END IF;

    -- Delete current metric targets
    DELETE FROM metric_targets WHERE target_id = v_history.sustainability_target_id;

    -- Delete current initiatives
    DELETE FROM reduction_initiatives WHERE sustainability_target_id = v_history.sustainability_target_id;

    -- Restore from snapshot
    IF v_history.metric_targets_snapshot IS NOT NULL THEN
        FOR v_metric_target IN SELECT * FROM jsonb_array_elements(v_history.metric_targets_snapshot)
        LOOP
            INSERT INTO metric_targets (
                id,
                organization_id,
                metric_catalog_id,
                target_id,
                baseline_value,
                baseline_emissions,
                target_value,
                target_emissions,
                strategy_type,
                status
            ) VALUES (
                (v_metric_target->>'id')::UUID,
                v_history.organization_id,
                (v_metric_target->>'metric_catalog_id')::UUID,
                v_history.sustainability_target_id,
                (v_metric_target->>'baseline_value')::DECIMAL,
                (v_metric_target->>'baseline_emissions')::DECIMAL,
                (v_metric_target->>'target_value')::DECIMAL,
                (v_metric_target->>'target_emissions')::DECIMAL,
                v_metric_target->>'strategy_type',
                v_metric_target->>'status'
            );
        END LOOP;
    END IF;

    IF v_history.initiatives_snapshot IS NOT NULL THEN
        FOR v_initiative IN SELECT * FROM jsonb_array_elements(v_history.initiatives_snapshot)
        LOOP
            INSERT INTO reduction_initiatives (
                id,
                organization_id,
                sustainability_target_id,
                name,
                estimated_reduction_tco2e,
                implementation_status,
                capex
            ) VALUES (
                (v_initiative->>'id')::UUID,
                v_history.organization_id,
                v_history.sustainability_target_id,
                v_initiative->>'name',
                (v_initiative->>'estimated_reduction_tco2e')::DECIMAL,
                v_initiative->>'implementation_status',
                (v_initiative->>'capex')::DECIMAL
            );
        END LOOP;
    END IF;

    -- Mark history as rolled back
    UPDATE target_replanning_history
    SET notes = CONCAT(COALESCE(notes, ''), E'\n\n[ROLLED BACK at ', NOW(), ']')
    WHERE id = p_history_id;

    RETURN jsonb_build_object('success', true, 'message', 'Replanning rolled back successfully');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. UPDATE ACTUAL VALUES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_metric_actual(
    p_metric_target_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_actual_value DECIMAL,
    p_actual_emissions DECIMAL,
    p_actual_emission_factor DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE metric_targets_monthly
    SET
        actual_value = p_actual_value,
        actual_emissions = p_actual_emissions,
        actual_emission_factor = COALESCE(p_actual_emission_factor, actual_emission_factor),
        status = 'completed',
        updated_at = NOW()
    WHERE metric_target_id = p_metric_target_id
        AND year = p_year
        AND month = p_month;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated THEN
        RETURN jsonb_build_object('success', true, 'message', 'Actual values updated');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Monthly target not found');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. GET VARIANCE ANALYSIS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_variance_analysis(
    p_organization_id UUID,
    p_target_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    metric_name TEXT,
    metric_code TEXT,
    scope TEXT,
    planned_ytd DECIMAL,
    actual_ytd DECIMAL,
    variance_ytd DECIMAL,
    variance_percent DECIMAL,
    status TEXT,
    months_tracked INTEGER,
    months_planned INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.name as metric_name,
        mc.code as metric_code,
        mc.scope,
        SUM(mtm.planned_emissions) as planned_ytd,
        SUM(mtm.actual_emissions) as actual_ytd,
        SUM(mtm.variance_emissions) as variance_ytd,
        CASE
            WHEN SUM(mtm.planned_emissions) != 0
            THEN (SUM(mtm.variance_emissions) / SUM(mtm.planned_emissions) * 100)
            ELSE NULL
        END as variance_percent,
        CASE
            WHEN ABS(SUM(mtm.variance_emissions)) < (SUM(mtm.planned_emissions) * 0.10) THEN 'on_track'
            WHEN ABS(SUM(mtm.variance_emissions)) < (SUM(mtm.planned_emissions) * 0.25) THEN 'at_risk'
            ELSE 'off_track'
        END as status,
        COUNT(mtm.id) FILTER (WHERE mtm.actual_emissions IS NOT NULL) as months_tracked,
        COUNT(mtm.id) as months_planned
    FROM metric_targets mt
    JOIN metrics_catalog mc ON mc.id = mt.metric_catalog_id
    LEFT JOIN metric_targets_monthly mtm ON mtm.metric_target_id = mt.id
    WHERE mt.organization_id = p_organization_id
        AND mt.target_id = p_target_id
        AND mtm.year <= EXTRACT(YEAR FROM p_as_of_date)
        AND (mtm.year < EXTRACT(YEAR FROM p_as_of_date)
            OR mtm.month <= EXTRACT(MONTH FROM p_as_of_date))
    GROUP BY mc.name, mc.code, mc.scope, mt.id
    ORDER BY variance_percent DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION apply_target_replanning TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_target_replanning TO authenticated;
GRANT EXECUTE ON FUNCTION update_metric_actual TO authenticated;
GRANT EXECUTE ON FUNCTION get_variance_analysis TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION apply_target_replanning IS 'Atomically apply a complete target replanning with all metric targets, monthly breakdowns, and initiatives';
COMMENT ON FUNCTION rollback_target_replanning IS 'Rollback a replanning event to its previous state using the history snapshot';
COMMENT ON FUNCTION update_metric_actual IS 'Update actual values for a monthly metric target and recalculate variance';
COMMENT ON FUNCTION get_variance_analysis IS 'Get variance analysis showing planned vs actual for all metrics in a target';
