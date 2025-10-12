-- Add industry classification to organizations
-- This enables industry-specific recommendations and benchmarking

-- Add industry and size columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS gri_sector_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS company_size_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'EU';

-- Create index for fast industry lookups
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_gri_sector ON organizations(gri_sector_code);

-- Add comments
COMMENT ON COLUMN organizations.industry IS 'Industry classification (e.g., Services, Manufacturing, Retail) - used for peer benchmarking and materiality assessment';
COMMENT ON COLUMN organizations.gri_sector_code IS 'GRI Sector Standard code (e.g., GRI_11, GRI_15, GRI_17)';
COMMENT ON COLUMN organizations.company_size_category IS 'Employee count category (e.g., 1-50, 50-100, 100-300, 300-1000, 1000-5000, 5000+)';
COMMENT ON COLUMN organizations.region IS 'Geographic region (e.g., EU, North America, Asia-Pacific, Latin America, Middle East)';

-- Migrate existing industry_primary data to the new industry column
-- Map common values to standardized industry names
UPDATE organizations
SET
  industry = CASE
    WHEN industry_primary ILIKE '%service%' OR industry_primary ILIKE '%consult%' OR industry_primary ILIKE '%software%' OR industry_primary ILIKE '%IT%' THEN 'Services'
    WHEN industry_primary ILIKE '%manufact%' OR industry_primary ILIKE '%production%' OR industry_primary ILIKE '%industrial%' THEN 'Manufacturing'
    WHEN industry_primary ILIKE '%retail%' OR industry_primary ILIKE '%commerce%' OR industry_primary ILIKE '%wholesale%' THEN 'Retail'
    WHEN industry_primary ILIKE '%oil%' OR industry_primary ILIKE '%gas%' OR industry_primary ILIKE '%energy%' THEN 'Oil & Gas'
    WHEN industry_primary ILIKE '%agricult%' OR industry_primary ILIKE '%farm%' THEN 'Agriculture'
    WHEN industry_primary ILIKE '%mining%' OR industry_primary ILIKE '%extract%' THEN 'Mining'
    WHEN industry_primary ILIKE '%food%' OR industry_primary ILIKE '%beverage%' OR industry_primary ILIKE '%restaurant%' THEN 'Food & Beverage'
    ELSE 'Services' -- Default
  END,
  gri_sector_code = CASE
    WHEN industry_primary ILIKE '%service%' OR industry_primary ILIKE '%consult%' OR industry_primary ILIKE '%software%' OR industry_primary ILIKE '%IT%' THEN 'GRI_11'
    WHEN industry_primary ILIKE '%manufact%' OR industry_primary ILIKE '%production%' OR industry_primary ILIKE '%industrial%' THEN 'GRI_15'
    WHEN industry_primary ILIKE '%retail%' OR industry_primary ILIKE '%commerce%' OR industry_primary ILIKE '%wholesale%' THEN 'GRI_17'
    WHEN industry_primary ILIKE '%oil%' OR industry_primary ILIKE '%gas%' OR industry_primary ILIKE '%energy%' THEN 'GRI_12'
    WHEN industry_primary ILIKE '%agricult%' OR industry_primary ILIKE '%farm%' THEN 'GRI_13'
    WHEN industry_primary ILIKE '%mining%' OR industry_primary ILIKE '%extract%' THEN 'GRI_14'
    WHEN industry_primary ILIKE '%food%' OR industry_primary ILIKE '%beverage%' OR industry_primary ILIKE '%restaurant%' THEN 'GRI_16'
    ELSE 'GRI_11'
  END,
  company_size_category = CASE company_size
    WHEN '1-10' THEN '1-50'
    WHEN '11-50' THEN '50-100'
    WHEN '51-200' THEN '100-300'
    WHEN '201-500' THEN '300-1000'
    WHEN '501-1000' THEN '300-1000'
    WHEN '1001-5000' THEN '1000-5000'
    WHEN '5000+' THEN '5000+'
    ELSE '100-300'
  END,
  region = CASE
    WHEN headquarters_address->>'country' ILIKE ANY(ARRAY['%portugal%', '%spain%', '%france%', '%germany%', '%italy%', '%uk%', '%netherlands%']) THEN 'EU'
    WHEN headquarters_address->>'country' ILIKE ANY(ARRAY['%usa%', '%united states%', '%canada%', '%mexico%']) THEN 'North America'
    WHEN headquarters_address->>'country' ILIKE ANY(ARRAY['%china%', '%japan%', '%india%', '%australia%', '%singapore%']) THEN 'Asia-Pacific'
    WHEN headquarters_address->>'country' ILIKE ANY(ARRAY['%brazil%', '%argentina%', '%chile%', '%colombia%']) THEN 'Latin America'
    ELSE 'EU'
  END
WHERE industry IS NULL;

-- Create helper function to auto-detect industry from organization data
CREATE OR REPLACE FUNCTION detect_organization_industry(
  p_organization_id UUID
)
RETURNS TABLE (
  detected_industry VARCHAR,
  detected_gri_code VARCHAR,
  confidence VARCHAR,
  reason TEXT
) AS $$
DECLARE
  v_top_categories TEXT[];
  v_has_manufacturing BOOLEAN;
  v_has_retail BOOLEAN;
  v_has_services BOOLEAN;
BEGIN
  -- Get top emission categories for this organization
  SELECT ARRAY_AGG(DISTINCT category ORDER BY category) INTO v_top_categories
  FROM (
    SELECT mc.category
    FROM metrics_data md
    JOIN metrics_catalog mc ON md.metric_id = mc.id
    WHERE md.organization_id = p_organization_id
      AND md.co2e_emissions > 0
    GROUP BY mc.category
    ORDER BY SUM(md.co2e_emissions) DESC
    LIMIT 10
  ) top_cats;

  -- Check for manufacturing indicators
  v_has_manufacturing := v_top_categories && ARRAY[
    'Industrial Processes',
    'Process Emissions',
    'Manufacturing',
    'Production'
  ];

  -- Check for retail indicators
  v_has_retail := v_top_categories && ARRAY[
    'Retail Operations',
    'Refrigeration',
    'Store Operations',
    'Distribution Centers'
  ];

  -- Check for services indicators (default)
  v_has_services := v_top_categories && ARRAY[
    'Business Travel',
    'Employee Commuting',
    'Office Operations',
    'Data Centers'
  ];

  -- Return detection result
  RETURN QUERY
  SELECT
    CASE
      WHEN v_has_manufacturing THEN 'Manufacturing'::VARCHAR
      WHEN v_has_retail THEN 'Retail'::VARCHAR
      ELSE 'Services'::VARCHAR
    END AS detected_industry,
    CASE
      WHEN v_has_manufacturing THEN 'GRI_15'::VARCHAR
      WHEN v_has_retail THEN 'GRI_17'::VARCHAR
      ELSE 'GRI_11'::VARCHAR
    END AS detected_gri_code,
    CASE
      WHEN v_has_manufacturing OR v_has_retail THEN 'high'::VARCHAR
      WHEN v_has_services THEN 'medium'::VARCHAR
      ELSE 'low'::VARCHAR
    END AS confidence,
    CASE
      WHEN v_has_manufacturing THEN 'Detected manufacturing-related emission categories'::TEXT
      WHEN v_has_retail THEN 'Detected retail-specific emission categories'::TEXT
      WHEN v_has_services THEN 'Detected service-sector emission patterns'::TEXT
      ELSE 'Defaulting to Services sector based on limited data'::TEXT
    END AS reason;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_organization_industry IS 'Auto-detects industry classification based on tracked emission categories';

-- Create function to update organization industry
CREATE OR REPLACE FUNCTION update_organization_industry(
  p_organization_id UUID,
  p_industry VARCHAR,
  p_gri_sector_code VARCHAR DEFAULT NULL,
  p_company_size_category VARCHAR DEFAULT NULL,
  p_region VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update organization industry
  UPDATE organizations
  SET
    industry = p_industry,
    gri_sector_code = COALESCE(p_gri_sector_code,
      CASE p_industry
        WHEN 'Services' THEN 'GRI_11'
        WHEN 'Manufacturing' THEN 'GRI_15'
        WHEN 'Retail' THEN 'GRI_17'
        WHEN 'Oil & Gas' THEN 'GRI_12'
        WHEN 'Agriculture' THEN 'GRI_13'
        WHEN 'Mining' THEN 'GRI_14'
        WHEN 'Food & Beverage' THEN 'GRI_16'
        ELSE 'GRI_11'
      END
    ),
    company_size_category = COALESCE(p_company_size_category, company_size_category, '100-300'),
    region = COALESCE(p_region, region, 'EU'),
    updated_at = NOW()
  WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'industry', p_industry,
    'message', 'Organization industry updated successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_organization_industry IS 'Updates organization industry classification and related metadata';

-- Grant permissions
GRANT EXECUTE ON FUNCTION detect_organization_industry TO authenticated;
GRANT EXECUTE ON FUNCTION update_organization_industry TO authenticated;
