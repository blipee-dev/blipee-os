-- Seed data for Industry Models
-- Populates initial industry metrics, GRI mappings, and regulatory requirements

-- Link NAICS codes to GRI sector standards
UPDATE industry_classifications 
SET gri_sector_id = (SELECT id FROM gri_sector_standards WHERE sector_code = 'GRI 11')
WHERE code IN ('211', '213111', '213112', '324110', '486') AND classification_system = 'NAICS';

UPDATE industry_classifications 
SET gri_sector_id = (SELECT id FROM gri_sector_standards WHERE sector_code = 'GRI 12')
WHERE code IN ('2121', '212111', '212112', '212113') AND classification_system = 'NAICS';

UPDATE industry_classifications 
SET gri_sector_id = (SELECT id FROM gri_sector_standards WHERE sector_code = 'GRI 13')
WHERE code IN ('111', '112', '114', '115') AND classification_system = 'NAICS';

-- Insert Oil & Gas industry metrics
DO $$
DECLARE
  oil_gas_id UUID;
  gri11_id UUID;
BEGIN
  SELECT id INTO oil_gas_id FROM industry_classifications WHERE code = '211' AND classification_system = 'NAICS';
  SELECT id INTO gri11_id FROM gri_sector_standards WHERE sector_code = 'GRI 11';
  
  -- Environmental metrics
  INSERT INTO industry_metrics (industry_id, metric_code, metric_name, metric_type, unit_of_measure, category, calculation_method, gri_alignment, regulatory_required, benchmark_available, lower_is_better) VALUES
    (oil_gas_id, 'ghg_intensity_upstream', 'Upstream GHG Intensity', 'environmental', 'kgCO2e/BOE', 'emissions', '(Scope 1 + Scope 2 emissions from upstream) / BOE produced', ARRAY['GRI 305-4', 'GRI 11.2.4'], true, true, true),
    (oil_gas_id, 'methane_intensity', 'Methane Intensity', 'environmental', '%', 'emissions', 'Methane emissions / Natural gas produced', ARRAY['GRI 305-7', 'GRI 11.3.2'], true, true, true),
    (oil_gas_id, 'flaring_intensity', 'Flaring Intensity', 'environmental', 'm³/BOE', 'emissions', 'Volume flared / BOE produced', ARRAY['GRI 11.3.3'], false, true, true),
    (oil_gas_id, 'water_intensity', 'Water Consumption Intensity', 'environmental', 'm³/BOE', 'water', 'Total water consumed / BOE produced', ARRAY['GRI 303-5', 'GRI 11.6.4'], false, true, true),
    (oil_gas_id, 'spill_volume', 'Hydrocarbon Spill Volume', 'environmental', 'barrels', 'incidents', 'Total volume of hydrocarbon spills > 1 barrel', ARRAY['GRI 306-3', 'GRI 11.8.2'], true, true, true),
    
    -- Social metrics
    (oil_gas_id, 'trir', 'Total Recordable Incident Rate', 'social', 'per 200,000 hours', 'safety', '(Recordable incidents × 200,000) / Hours worked', ARRAY['GRI 403-9', 'GRI 11.9.10'], true, true, true),
    (oil_gas_id, 'process_safety_events', 'Process Safety Events', 'social', 'count', 'safety', 'Number of Tier 1 and Tier 2 process safety events', ARRAY['GRI 11.8.3'], true, true, true),
    (oil_gas_id, 'local_procurement', 'Local Procurement Spend', 'social', '%', 'community', 'Local supplier spend / Total procurement spend', ARRAY['GRI 204-1', 'GRI 11.14.6'], false, false, false),
    
    -- Governance metrics
    (oil_gas_id, 'payments_to_governments', 'Payments to Governments', 'governance', 'USD millions', 'transparency', 'Total taxes and royalties paid by country', ARRAY['GRI 207-4', 'GRI 11.21.7'], true, false, false),
    (oil_gas_id, 'board_diversity', 'Board Diversity', 'governance', '%', 'governance', 'Percentage of board members from underrepresented groups', ARRAY['GRI 405-1'], false, true, false);
END $$;

-- Insert regulatory requirements
INSERT INTO regulatory_requirements (regulation_code, regulation_name, jurisdiction, requirements, effective_date, penalties, gri_alignment) VALUES
  ('EPA-GHGRP', 'EPA Greenhouse Gas Reporting Program', 'United States', 
   '{"reporting_threshold": "25,000 tCO2e", "frequency": "annual", "deadline": "March 31", "methods": ["EPA calculation methods", "Direct measurement"]}', 
   '2010-01-01', 'Up to $51,796 per day per violation', ARRAY['GRI 305-1', 'GRI 305-2']),
   
  ('EU-ETS', 'EU Emissions Trading System', 'European Union',
   '{"scope": "Large installations", "monitoring": "Continuous", "verification": "Third-party required", "allowances": "Must surrender equal to emissions"}',
   '2005-01-01', '€100 per tCO2e excess emissions', ARRAY['GRI 305-1', 'GRI 305-2', 'GRI 201-2']),
   
  ('EU-Methane', 'EU Methane Regulation', 'European Union',
   '{"monitoring": "Direct measurement required", "LDAR": "Quarterly inspections", "flaring": "Restrictions apply", "venting": "Prohibited except safety"}',
   '2024-01-01', 'Varies by member state', ARRAY['GRI 305-7', 'GRI 11.3.2']),
   
  ('OGMP-2.0', 'Oil & Gas Methane Partnership 2.0', 'Global',
   '{"reporting_levels": ["Level 1-5"], "target": "0.2% methane intensity by 2025", "verification": "Third-party for Level 4-5"}',
   '2020-11-01', 'Reputational risk, investor pressure', ARRAY['GRI 305-7', 'GRI 11.3.2']);

-- Insert sample benchmark data for oil & gas
DO $$
DECLARE
  oil_gas_id UUID;
  ghg_metric_id UUID;
  methane_metric_id UUID;
  trir_metric_id UUID;
BEGIN
  SELECT id INTO oil_gas_id FROM industry_classifications WHERE code = '211' AND classification_system = 'NAICS';
  SELECT id INTO ghg_metric_id FROM industry_metrics WHERE metric_code = 'ghg_intensity_upstream' AND industry_id = oil_gas_id;
  SELECT id INTO methane_metric_id FROM industry_metrics WHERE metric_code = 'methane_intensity' AND industry_id = oil_gas_id;
  SELECT id INTO trir_metric_id FROM industry_metrics WHERE metric_code = 'trir' AND industry_id = oil_gas_id;
  
  -- Insert 2024 benchmarks
  INSERT INTO industry_benchmarks (industry_id, metric_id, period_year, region, percentile_10, percentile_25, percentile_50, percentile_75, percentile_90, average_value, sample_size, data_quality_score) VALUES
    (oil_gas_id, ghg_metric_id, 2024, 'global', 10.5, 15.2, 22.8, 35.6, 48.3, 26.4, 150, 0.85),
    (oil_gas_id, ghg_metric_id, 2024, 'north_america', 12.1, 17.5, 24.2, 37.8, 51.2, 28.3, 65, 0.88),
    (oil_gas_id, ghg_metric_id, 2024, 'europe', 8.3, 12.7, 19.5, 31.2, 43.7, 23.1, 45, 0.90),
    
    (oil_gas_id, methane_metric_id, 2024, 'global', 0.05, 0.12, 0.20, 0.35, 0.52, 0.25, 120, 0.82),
    (oil_gas_id, methane_metric_id, 2024, 'north_america', 0.08, 0.15, 0.25, 0.40, 0.58, 0.29, 55, 0.85),
    
    (oil_gas_id, trir_metric_id, 2024, 'global', 0.12, 0.23, 0.41, 0.68, 1.05, 0.48, 180, 0.92);
END $$;

-- Update material topics with GRI sector information
UPDATE material_topics 
SET gri_sector_standard = 'GRI 11',
    industry_specific = true,
    applicable_industries = ARRAY(SELECT id FROM industry_classifications WHERE gri_sector_id = (SELECT id FROM gri_sector_standards WHERE sector_code = 'GRI 11'))
WHERE gri_standard LIKE '%11.%' OR topic_name IN ('Climate adaptation', 'Air emissions', 'Biodiversity impacts', 'Critical incident management');

-- Create a function to generate sample benchmark data points
CREATE OR REPLACE FUNCTION generate_sample_benchmark_data(
  p_num_companies INTEGER DEFAULT 50,
  p_year INTEGER DEFAULT 2024
) RETURNS void AS $$
DECLARE
  v_org_id UUID;
  v_metric_id UUID;
  v_value DECIMAL;
  i INTEGER;
BEGIN
  -- Get a sample metric
  SELECT id INTO v_metric_id FROM industry_metrics WHERE metric_code = 'ghg_intensity_upstream' LIMIT 1;
  
  IF v_metric_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate random data points
  FOR i IN 1..p_num_companies LOOP
    -- Create a dummy organization ID (in production, use real org IDs)
    v_org_id := uuid_generate_v4();
    
    -- Generate a value following a normal distribution
    v_value := 22.8 + (random() - 0.5) * 30; -- Mean of 22.8 with variation
    v_value := GREATEST(5, LEAST(80, v_value)); -- Clamp between 5 and 80
    
    INSERT INTO benchmark_data_points (organization_id, metric_id, value, period_year, verified, data_source)
    VALUES (v_org_id, v_metric_id, v_value, p_year, (random() > 0.3), 'annual_report')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Industry Models seed data loaded successfully';
END $$;