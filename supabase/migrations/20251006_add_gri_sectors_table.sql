-- GRI Sector Standards lookup table
CREATE TABLE IF NOT EXISTS gri_sectors (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., 'GRI_11', 'GRI_12', etc.
  name TEXT NOT NULL, -- e.g., 'Oil and Gas Sector', 'Coal Sector'
  published_year INTEGER NOT NULL, -- e.g., 2021, 2022, 2024
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material topics for each GRI sector
CREATE TABLE IF NOT EXISTS gri_sector_material_topics (
  id SERIAL PRIMARY KEY,
  gri_sector_id INTEGER REFERENCES gri_sectors(id) ON DELETE CASCADE,
  topic_code TEXT NOT NULL, -- e.g., 'GRI_11_1', 'GRI_12_3'
  topic_name TEXT NOT NULL, -- e.g., 'GHG emissions', 'Air emissions'
  topic_category TEXT NOT NULL, -- 'environmental', 'social', 'governance'
  is_critical BOOLEAN DEFAULT false, -- Critical topics require disclosure
  dashboard_type TEXT, -- 'ghg_emissions', 'air_quality', 'water_management', 'tailings', etc.
  description TEXT,
  disclosure_requirements JSONB DEFAULT '[]', -- Array of disclosure requirement codes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert GRI Sector Standards
INSERT INTO gri_sectors (code, name, published_year, description) VALUES
('GRI_11', 'Oil and Gas Sector', 2021, 'Covers upstream, midstream, and downstream oil and gas operations'),
('GRI_12', 'Coal Sector', 2022, 'Covers coal mining and coal-based power generation'),
('GRI_13', 'Agriculture, Aquaculture and Fishing Sector', 2022, 'Covers farming, aquaculture, and fishing operations'),
('GRI_14', 'Mining Sector', 2024, 'Covers extraction of minerals and metals')
ON CONFLICT (code) DO NOTHING;

-- Insert Material Topics for GRI 11: Oil and Gas
INSERT INTO gri_sector_material_topics (gri_sector_id, topic_code, topic_name, topic_category, is_critical, dashboard_type, description) VALUES
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.1', 'GHG emissions', 'environmental', true, 'ghg_emissions', 'Scope 1, 2, 3 emissions including fugitive methane'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.2', 'Climate adaptation, resilience, and transition', 'environmental', true, 'climate_resilience', 'Climate risk management and transition planning'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.3', 'Air emissions', 'environmental', true, 'air_quality', 'NOx, SOx, VOCs, and other air pollutants'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.4', 'Biodiversity', 'environmental', true, 'biodiversity', 'Impacts on ecosystems and protected areas'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.5', 'Waste', 'environmental', false, 'waste_management', 'Drilling muds, produced water, and other waste'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.6', 'Water and effluents', 'environmental', true, 'water_management', 'Water use in water-stressed areas'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.7', 'Closure and rehabilitation', 'environmental', true, 'decommissioning', 'Asset decommissioning and site restoration'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_11'), 'GRI_11.8', 'Asset integrity and critical incident management', 'governance', true, 'asset_integrity', 'Safety systems and incident prevention')
ON CONFLICT DO NOTHING;

-- Insert Material Topics for GRI 12: Coal
INSERT INTO gri_sector_material_topics (gri_sector_id, topic_code, topic_name, topic_category, is_critical, dashboard_type, description) VALUES
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.1', 'GHG emissions', 'environmental', true, 'ghg_emissions', 'Including mine methane and combustion emissions'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.2', 'Climate adaptation and resilience', 'environmental', true, 'climate_resilience', 'Climate risk and transition planning'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.3', 'Air emissions', 'environmental', true, 'air_quality', 'Particulate matter, NOx, SOx from mining and combustion'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.4', 'Water and effluents', 'environmental', true, 'water_management', 'Mine water management and acid mine drainage'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.5', 'Waste', 'environmental', true, 'waste_management', 'Coal ash, mine tailings, waste rock'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.6', 'Biodiversity', 'environmental', true, 'biodiversity', 'Land disturbance and ecosystem impacts'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.7', 'Closure, decommissioning and rehabilitation', 'environmental', true, 'mine_closure', 'Mine closure planning and land rehabilitation'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_12'), 'GRI_12.8', 'Artisanal and small-scale mining', 'social', false, 'artisanal_mining', 'Engagement with artisanal miners in supply chain')
ON CONFLICT DO NOTHING;

-- Insert Material Topics for GRI 13: Agriculture, Aquaculture and Fishing
INSERT INTO gri_sector_material_topics (gri_sector_id, topic_code, topic_name, topic_category, is_critical, dashboard_type, description) VALUES
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.1', 'GHG emissions', 'environmental', true, 'ghg_emissions', 'Including livestock methane, rice cultivation, fertilizer use'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.2', 'Climate adaptation and resilience', 'environmental', true, 'climate_resilience', 'Adaptation to changing climate patterns'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.3', 'Soil health', 'environmental', true, 'soil_health', 'Soil degradation, erosion, and fertility management'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.4', 'Conversion of natural ecosystems', 'environmental', true, 'land_conversion', 'Deforestation and habitat conversion'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.5', 'Water and effluents', 'environmental', true, 'water_management', 'Irrigation efficiency and water pollution'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.6', 'Biological diversity', 'environmental', true, 'biodiversity', 'Impacts on ecosystems and species'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.7', 'Use of antibiotics', 'environmental', true, 'antibiotics_use', 'Antibiotic use in aquaculture and livestock'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.8', 'Pesticides use', 'environmental', true, 'pesticides_use', 'Pesticide application and integrated pest management'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_13'), 'GRI_13.9', 'Food loss and waste', 'environmental', true, 'food_waste', 'Food waste throughout the value chain')
ON CONFLICT DO NOTHING;

-- Insert Material Topics for GRI 14: Mining
INSERT INTO gri_sector_material_topics (gri_sector_id, topic_code, topic_name, topic_category, is_critical, dashboard_type, description) VALUES
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.1', 'Tailings management', 'environmental', true, 'tailings_management', 'Critical: tailings storage facility safety'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.2', 'Water and effluents', 'environmental', true, 'water_management', 'Water use, discharge quality, and acid mine drainage'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.3', 'Biodiversity', 'environmental', true, 'biodiversity', 'Impacts on ecosystems and protected areas'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.4', 'Waste', 'environmental', true, 'waste_management', 'Waste rock, overburden, and processing waste'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.5', 'Air emissions', 'environmental', true, 'air_quality', 'Dust, particulates, and air pollutants'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.6', 'GHG emissions', 'environmental', true, 'ghg_emissions', 'Scope 1, 2, 3 emissions from extraction and processing'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.7', 'Closure planning', 'environmental', true, 'mine_closure', 'Mine closure planning and land rehabilitation'),
((SELECT id FROM gri_sectors WHERE code = 'GRI_14'), 'GRI_14.8', 'Artisanal and small-scale mining', 'social', false, 'artisanal_mining', 'Engagement with artisanal miners')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gri_sector_material_topics_sector_id ON gri_sector_material_topics(gri_sector_id);
CREATE INDEX IF NOT EXISTS idx_gri_sector_material_topics_dashboard_type ON gri_sector_material_topics(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_gri_sector_material_topics_critical ON gri_sector_material_topics(is_critical);

-- Add comments
COMMENT ON TABLE gri_sectors IS 'GRI Sector Standards (GRI 11-17) for industry-specific reporting';
COMMENT ON TABLE gri_sector_material_topics IS 'Material topics for each GRI sector standard';
COMMENT ON COLUMN gri_sector_material_topics.is_critical IS 'Whether this topic requires mandatory disclosure for the sector';
COMMENT ON COLUMN gri_sector_material_topics.dashboard_type IS 'Dashboard component to generate for this material topic';
