-- Add monthly grid mix data for 2022 from Electricity Maps Portal
-- Source: https://portal.electricitymaps.com/map/zone/PT/5y/monthly

INSERT INTO portugal_grid_mix_reference (year, month, renewable_percentage, non_renewable_percentage, carbon_intensity, data_source, source_url, notes) VALUES
-- 2022 Monthly Data
(2022, 1, 60.0, 40.0, 217, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Janeiro 2022 - Electricity Maps Portal'),
(2022, 2, 52.0, 48.0, 242, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Fevereiro 2022 - Electricity Maps Portal'),
(2022, 4, 66.0, 34.0, 189, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Abril 2022 - Electricity Maps Portal'),
(2022, 5, 59.0, 41.0, 225, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Maio 2022 - Electricity Maps Portal'),
(2022, 6, 50.0, 50.0, 264, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Junho 2022 - Electricity Maps Portal'),
(2022, 7, 48.0, 52.0, 272, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Julho 2022 - Electricity Maps Portal'),
(2022, 9, 54.0, 46.0, 244, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Setembro 2022 - Electricity Maps Portal'),
(2022, 10, 54.0, 46.0, 245, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Outubro 2022 - Electricity Maps Portal'),
(2022, 11, 63.0, 37.0, 210, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Novembro 2022 - Electricity Maps Portal'),
(2022, 12, 79.0, 21.0, 139, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Dezembro 2022 - Electricity Maps Portal'),

-- 2025 Data (October)
(2025, 10, 69.0, 31.0, 158, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Outubro 2025 - Electricity Maps Portal')

ON CONFLICT (year, quarter, month) DO UPDATE SET
  renewable_percentage = EXCLUDED.renewable_percentage,
  non_renewable_percentage = EXCLUDED.non_renewable_percentage,
  carbon_intensity = EXCLUDED.carbon_intensity,
  data_source = EXCLUDED.data_source,
  source_url = EXCLUDED.source_url,
  notes = EXCLUDED.notes,
  updated_at = NOW();
