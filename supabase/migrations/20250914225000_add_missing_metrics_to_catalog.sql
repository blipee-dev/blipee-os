-- Add missing metrics to catalog: Water Supply and EV Charging

DO $$
BEGIN
  -- Add Water Supply metric (Scope 3)
  INSERT INTO metrics_catalog (
    name,
    code,
    description,
    unit,
    scope,
    category,
    subcategory,
    emission_factor,
    emission_factor_unit,
    emission_factor_source,
    is_active,
    created_at
  )
  VALUES (
    'Water Supply',
    'scope3_water_supply',
    'Water consumption from municipal supply including treatment and distribution',
    'm3',
    'scope_3',
    'Purchased Goods & Services',
    'Water',
    0.344,  -- Portuguese water supply emission factor
    'kgCO2e/m3',
    'Portuguese Environment Agency (APA)',
    true,
    NOW()
  )
  ON CONFLICT (code) DO NOTHING;

  -- Add EV Charging metric (Scope 2)
  INSERT INTO metrics_catalog (
    name,
    code,
    description,
    unit,
    scope,
    category,
    subcategory,
    emission_factor,
    emission_factor_unit,
    emission_factor_source,
    is_active,
    created_at
  )
  VALUES (
    'EV Charging',
    'scope2_ev_charging',
    'Electricity consumption for electric vehicle charging stations',
    'kWh',
    'scope_2',
    'Electricity',
    'EV Charging',
    0.140,  -- Portuguese grid electricity emission factor 2024
    'kgCO2e/kWh',
    'DGEG - Direção-Geral de Energia e Geologia',
    true,
    NOW()
  )
  ON CONFLICT (code) DO NOTHING;

  -- Add E-Waste metric (Scope 3)
  INSERT INTO metrics_catalog (
    name,
    code,
    description,
    unit,
    scope,
    category,
    subcategory,
    emission_factor,
    emission_factor_unit,
    emission_factor_source,
    is_active,
    created_at
  )
  VALUES (
    'E-Waste',
    'scope3_waste_ewaste',
    'Electronic waste disposal including computers, phones, and other electronic equipment',
    'kg',
    'scope_3',
    'Waste',
    'E-Waste',
    21.0,  -- E-waste emission factor for recycling
    'kgCO2e/kg',
    'EPA Waste Reduction Model (WARM)',
    true,
    NOW()
  )
  ON CONFLICT (code) DO NOTHING;

  RAISE NOTICE 'Added Water Supply, EV Charging, and E-Waste metrics to catalog';
END $$;

-- Verify the new metrics
SELECT name, code, unit, scope, category
FROM metrics_catalog
WHERE code IN ('scope3_water_supply', 'scope2_ev_charging', 'scope3_waste_ewaste');