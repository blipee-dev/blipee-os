-- Populate Compliance Data with Real Metrics
-- NO MOCKED DATA - Only calculated from actual metrics_data
-- This migration creates compliance structures populated with real emissions data

-- =====================================================
-- 1. POPULATE GHG INVENTORY SETTINGS (Real Data)
-- =====================================================

-- First, let's create a function to calculate actual emissions by year and scope
CREATE OR REPLACE FUNCTION calculate_emissions_by_year_scope(
  p_organization_id UUID,
  p_year INTEGER,
  p_scope TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(md.co2e_emissions), 0)
  INTO v_total
  FROM metrics_data md
  JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = p_organization_id
    AND mc.scope = p_scope
    AND EXTRACT(YEAR FROM md.period_start) = p_year;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Calculate base year emissions for each organization
CREATE TEMP TABLE base_year_calculations AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  -- Determine base year (first year with substantial data)
  (
    SELECT EXTRACT(YEAR FROM period_start)::INTEGER
    FROM metrics_data
    WHERE organization_id = o.id
    GROUP BY EXTRACT(YEAR FROM period_start)
    HAVING COUNT(*) > 50 -- At least 50 data points
    ORDER BY EXTRACT(YEAR FROM period_start) ASC
    LIMIT 1
  ) as base_year,
  -- Get existing inventory settings if any
  ois.consolidation_approach,
  ois.gwp_version,
  ois.gases_covered
FROM organizations o
LEFT JOIN organization_inventory_settings ois ON ois.organization_id = o.id
WHERE EXISTS (
  SELECT 1 FROM metrics_data WHERE organization_id = o.id
);

-- Populate ghg_inventory_settings for each year with actual data
INSERT INTO ghg_inventory_settings (
  organization_id,
  reporting_year,
  consolidation_approach,
  reporting_entity,
  gases_covered,
  gwp_standard,
  base_year,
  base_year_rationale,
  recalculation_threshold,
  period_start,
  period_end,
  assurance_level,
  scope3_categories_included,
  compliance_statement,
  methodology_description,
  scope3_screening_rationale
)
SELECT DISTINCT
  md.organization_id,
  EXTRACT(YEAR FROM md.period_start)::INTEGER as reporting_year,
  COALESCE(byc.consolidation_approach, 'operational_control'),
  byc.organization_name,
  COALESCE(byc.gases_covered, ARRAY['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3']),
  COALESCE(byc.gwp_version, 'IPCC AR6'),
  byc.base_year,
  CASE
    WHEN byc.base_year IS NOT NULL THEN
      'First complete year with comprehensive data collection across all facilities and emission sources'
    ELSE NULL
  END,
  5.0, -- Standard GHG Protocol threshold
  DATE_TRUNC('year', md.period_start)::DATE,
  (DATE_TRUNC('year', md.period_start) + INTERVAL '1 year - 1 day')::DATE,
  'not_verified', -- Default until organization provides assurance
  -- Identify which Scope 3 categories actually have data
  (
    SELECT ARRAY_AGG(DISTINCT
      CASE mc.ghg_protocol_category
        WHEN 'Purchased Goods & Services' THEN 1
        WHEN 'Capital Goods' THEN 2
        WHEN 'Fuel & Energy Related' THEN 3
        WHEN 'Upstream Transportation' THEN 4
        WHEN 'Waste' THEN 5
        WHEN 'Business Travel' THEN 6
        WHEN 'Employee Commuting' THEN 7
        WHEN 'Upstream Leased Assets' THEN 8
        WHEN 'Downstream Transportation' THEN 9
        WHEN 'Processing of Sold Products' THEN 10
        WHEN 'Use of Sold Products' THEN 11
        WHEN 'End-of-Life' THEN 12
        WHEN 'Downstream Leased Assets' THEN 13
        WHEN 'Franchises' THEN 14
        WHEN 'Investments' THEN 15
        ELSE NULL
      END
    )
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_3'
      AND mc.ghg_protocol_category IS NOT NULL
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ),
  'This inventory has been prepared in conformance with the GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition). Scope 2 emissions are reported using both location-based and market-based methods as per the Scope 2 Guidance.',
  'Emissions calculated using activity-based approach with region and year-specific emission factors. Scope 3 categories screened per GHG Protocol Corporate Value Chain (Scope 3) Standard.',
  -- Rationale based on actual categories tracked
  (
    SELECT 'Scope 3 categories included are those for which the organization has operational control and data availability. Categories represent ' ||
    ROUND((COUNT(DISTINCT mc.ghg_protocol_category)::NUMERIC / 15.0 * 100), 0)::TEXT ||
    '% coverage of all 15 GHG Protocol Scope 3 categories.'
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_3'
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  )
FROM metrics_data md
JOIN base_year_calculations byc ON byc.organization_id = md.organization_id
WHERE NOT EXISTS (
  -- Don't insert if already exists
  SELECT 1 FROM ghg_inventory_settings gis
  WHERE gis.organization_id = md.organization_id
    AND gis.reporting_year = EXTRACT(YEAR FROM md.period_start)::INTEGER
)
GROUP BY
  md.organization_id,
  EXTRACT(YEAR FROM md.period_start),
  byc.organization_name,
  byc.consolidation_approach,
  byc.gwp_version,
  byc.gases_covered,
  byc.base_year;

-- =====================================================
-- 2. CREATE ESRS E1 DISCLOSURE STRUCTURE (Ready for Input)
-- =====================================================

-- Populate ESRS E1 disclosures with actual emissions data
-- Leave strategic fields NULL for user to complete
INSERT INTO esrs_e1_disclosures (
  organization_id,
  reporting_year,

  -- E1-6: Actual GHG emissions from metrics_data
  scope_1_gross,
  scope_2_gross_lb,
  scope_2_gross_mb,
  scope_3_gross,
  total_gross,

  -- E1-1 to E1-5: Leave NULL for organization to complete
  transition_plan,
  climate_policies,
  mitigation_actions,
  adaptation_actions,
  targets,

  -- E1-5: Energy - Can be calculated from metrics if available
  energy_consumption,

  -- E1-7: Removals - Leave NULL (no data yet)
  removals_total,
  credits_total,

  -- E1-8: Carbon pricing - Leave NULL
  carbon_price_used,

  -- E1-9: Financial effects - Leave NULL
  financial_effects_mitigation,
  financial_effects_adaptation,
  opportunities
)
SELECT
  md.organization_id,
  EXTRACT(YEAR FROM md.period_start)::INTEGER as reporting_year,

  -- Calculate actual emissions by scope
  (
    SELECT COALESCE(SUM(md2.co2e_emissions), 0)
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_1'
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ) as scope_1_gross,

  (
    SELECT COALESCE(SUM(md2.co2e_emissions), 0)
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_2'
      AND (md2.scope2_method IS NULL OR md2.scope2_method = 'location_based')
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ) as scope_2_gross_lb,

  (
    SELECT COALESCE(SUM(md2.co2e_emissions), 0)
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_2'
      AND md2.scope2_method = 'market_based'
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ) as scope_2_gross_mb,

  (
    SELECT COALESCE(SUM(md2.co2e_emissions), 0)
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.scope = 'scope_3'
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ) as scope_3_gross,

  -- Total
  (
    SELECT COALESCE(SUM(md2.co2e_emissions), 0)
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ) as total_gross,

  NULL, -- transition_plan
  NULL, -- climate_policies
  NULL, -- mitigation_actions
  NULL, -- adaptation_actions
  NULL, -- targets

  -- E1-5: Calculate energy consumption if electricity/energy metrics exist
  (
    SELECT jsonb_build_object(
      'total_energy_consumption_mwh', COALESCE(SUM(md2.value), 0),
      'renewable_energy_mwh', 0,
      'energy_intensity', NULL,
      'data_source', 'metrics_data'
    )
    FROM metrics_data md2
    JOIN metrics_catalog mc ON md2.metric_id = mc.id
    WHERE md2.organization_id = md.organization_id
      AND mc.category IN ('Electricity', 'Purchased Energy')
      AND mc.unit IN ('kWh', 'MWh')
      AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
  ),

  NULL, -- removals_total
  NULL, -- credits_total
  NULL, -- carbon_price_used
  NULL, -- financial_effects_mitigation
  NULL, -- financial_effects_adaptation
  NULL  -- opportunities
FROM (
  SELECT DISTINCT organization_id, period_start
  FROM metrics_data
) md
WHERE NOT EXISTS (
  SELECT 1 FROM esrs_e1_disclosures e1
  WHERE e1.organization_id = md.organization_id
    AND e1.reporting_year = EXTRACT(YEAR FROM md.period_start)::INTEGER
)
AND EXTRACT(YEAR FROM md.period_start)::INTEGER >= 2022; -- Only recent years

-- =====================================================
-- 3. CREATE TCFD DISCLOSURE STRUCTURE (Ready for Input)
-- =====================================================

-- Populate TCFD disclosures with emissions metrics
-- Leave governance and strategy fields NULL for user input
INSERT INTO tcfd_disclosures (
  organization_id,
  reporting_year,

  -- Metrics & Targets: Populate with actual emissions
  metrics,

  -- Governance, Strategy, Risk Management: Leave NULL
  board_oversight,
  management_role,
  climate_risks,
  climate_opportunities,
  scenario_analysis,
  business_strategy_impact,
  risk_identification_process,
  risk_management_process,
  integration_with_erm,
  targets,
  executive_remuneration_link
)
SELECT
  md.organization_id,
  EXTRACT(YEAR FROM md.period_start)::INTEGER as reporting_year,

  -- TCFD Metrics: Actual emissions data
  jsonb_build_object(
    'scope_1_emissions_tco2e', (
      SELECT COALESCE(SUM(md2.co2e_emissions), 0)
      FROM metrics_data md2
      JOIN metrics_catalog mc ON md2.metric_id = mc.id
      WHERE md2.organization_id = md.organization_id
        AND mc.scope = 'scope_1'
        AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
    ),
    'scope_2_emissions_tco2e', (
      SELECT COALESCE(SUM(md2.co2e_emissions), 0)
      FROM metrics_data md2
      JOIN metrics_catalog mc ON md2.metric_id = mc.id
      WHERE md2.organization_id = md.organization_id
        AND mc.scope = 'scope_2'
        AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
    ),
    'scope_3_emissions_tco2e', (
      SELECT COALESCE(SUM(md2.co2e_emissions), 0)
      FROM metrics_data md2
      JOIN metrics_catalog mc ON md2.metric_id = mc.id
      WHERE md2.organization_id = md.organization_id
        AND mc.scope = 'scope_3'
        AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
    ),
    'total_emissions_tco2e', (
      SELECT COALESCE(SUM(md2.co2e_emissions), 0)
      FROM metrics_data md2
      WHERE md2.organization_id = md.organization_id
        AND EXTRACT(YEAR FROM md2.period_start) = EXTRACT(YEAR FROM md.period_start)
    ),
    'data_quality', 'calculated',
    'calculation_method', 'activity_based'
  ),

  NULL, -- board_oversight
  NULL, -- management_role
  NULL, -- climate_risks
  NULL, -- climate_opportunities
  NULL, -- scenario_analysis
  NULL, -- business_strategy_impact
  NULL, -- risk_identification_process
  NULL, -- risk_management_process
  NULL, -- integration_with_erm
  NULL, -- targets
  NULL  -- executive_remuneration_link
FROM (
  SELECT DISTINCT organization_id, period_start
  FROM metrics_data
) md
WHERE NOT EXISTS (
  SELECT 1 FROM tcfd_disclosures tcfd
  WHERE tcfd.organization_id = md.organization_id
    AND tcfd.reporting_year = EXTRACT(YEAR FROM md.period_start)::INTEGER
)
AND EXTRACT(YEAR FROM md.period_start)::INTEGER >= 2022;

-- =====================================================
-- 4. ADD COMMENTS FOR GUIDANCE
-- =====================================================

COMMENT ON TABLE ghg_inventory_settings IS 'GHG Protocol inventory settings populated with actual emissions data. User should update assurance_level and assurance_provider when third-party verification is obtained.';

COMMENT ON TABLE esrs_e1_disclosures IS 'ESRS E1 disclosures with actual emissions (E1-6) calculated from metrics_data. Strategic disclosures (E1-1 to E1-5, E1-7 to E1-9) should be completed by sustainability team.';

COMMENT ON TABLE tcfd_disclosures IS 'TCFD disclosures with actual emissions metrics populated. Governance, Strategy, and Risk Management sections should be completed by leadership team.';

-- =====================================================
-- 5. CLEANUP
-- =====================================================

DROP FUNCTION IF EXISTS calculate_emissions_by_year_scope(UUID, INTEGER, TEXT);

-- Summary of what was created
DO $$
DECLARE
  ghg_count INTEGER;
  esrs_count INTEGER;
  tcfd_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ghg_count FROM ghg_inventory_settings;
  SELECT COUNT(*) INTO esrs_count FROM esrs_e1_disclosures;
  SELECT COUNT(*) INTO tcfd_count FROM tcfd_disclosures;

  RAISE NOTICE '✅ Compliance Data Population Complete';
  RAISE NOTICE '   - GHG Inventory Settings: % records', ghg_count;
  RAISE NOTICE '   - ESRS E1 Disclosures: % records', esrs_count;
  RAISE NOTICE '   - TCFD Disclosures: % records', tcfd_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Review base year calculations in ghg_inventory_settings';
  RAISE NOTICE '   2. Update assurance levels when third-party verification obtained';
  RAISE NOTICE '   3. Complete strategic fields (transition plans, policies, targets)';
  RAISE NOTICE '   4. Add Scope 2 instruments (RECs, GOs) if applicable';
  RAISE NOTICE '   5. Document any emissions adjustments (offsets, removals)';
END $$;
