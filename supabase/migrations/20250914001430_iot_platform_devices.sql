-- IoT Platform Device Tables
-- Flexible schema for unlimited device types following industry best practices

-- Device registry table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  installed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-series device data (key-value pattern)
CREATE TABLE IF NOT EXISTS device_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  variable TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device templates for common configurations
CREATE TABLE IF NOT EXISTS device_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  variables JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common device templates
INSERT INTO device_templates (name, type, variables) VALUES
  ('Enthalpy Meter', 'enthalpy_meter', '[
    {"name": "energy_heating", "unit": "kWh", "description": "Heating energy consumption"},
    {"name": "energy_cooling", "unit": "kWh", "description": "Cooling energy consumption"},
    {"name": "flow_rate", "unit": "m3/h", "description": "Water flow rate"},
    {"name": "temperature_in", "unit": "celsius", "description": "Inlet temperature"},
    {"name": "temperature_out", "unit": "celsius", "description": "Outlet temperature"}
  ]'::jsonb),

  ('Electricity Meter', 'electricity_meter', '[
    {"name": "power", "unit": "kW", "description": "Active power"},
    {"name": "energy", "unit": "kWh", "description": "Total energy consumption"},
    {"name": "voltage", "unit": "V", "description": "Voltage"},
    {"name": "current", "unit": "A", "description": "Current"},
    {"name": "power_factor", "unit": "", "description": "Power factor"}
  ]'::jsonb),

  ('Temperature Sensor', 'temperature', '[
    {"name": "temperature", "unit": "celsius", "description": "Temperature"},
    {"name": "humidity", "unit": "%", "description": "Relative humidity"}
  ]'::jsonb),

  ('Air Quality Sensor', 'air_quality', '[
    {"name": "co2", "unit": "ppm", "description": "CO2 concentration"},
    {"name": "pm25", "unit": "µg/m³", "description": "PM2.5 particles"},
    {"name": "pm10", "unit": "µg/m³", "description": "PM10 particles"},
    {"name": "voc", "unit": "ppb", "description": "Volatile organic compounds"}
  ]'::jsonb),

  ('People Counter', 'people_counter', '[
    {"name": "count_in", "unit": "people", "description": "People entering"},
    {"name": "count_out", "unit": "people", "description": "People exiting"},
    {"name": "occupancy", "unit": "people", "description": "Current occupancy"}
  ]'::jsonb);

-- Performance indexes
CREATE INDEX idx_devices_site_id ON devices(site_id);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_external_id ON devices(external_id);
CREATE INDEX idx_device_data_device_id ON device_data(device_id);
CREATE INDEX idx_device_data_timestamp ON device_data(timestamp DESC);
CREATE INDEX idx_device_data_variable ON device_data(variable);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for devices
CREATE POLICY "Users can view devices from their organization sites" ON devices
  FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert devices" ON devices
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
      AND uor.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

CREATE POLICY "Managers can update devices" ON devices
  FOR UPDATE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
      AND uor.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

CREATE POLICY "Managers can delete devices" ON devices
  FOR DELETE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
      AND uor.role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policies for device_data
CREATE POLICY "Users can view device data from their organization" ON device_data
  FOR SELECT
  USING (
    device_id IN (
      SELECT d.id FROM devices d
      JOIN sites s ON d.site_id = s.id
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert device data" ON device_data
  FOR INSERT
  WITH CHECK (
    device_id IN (
      SELECT d.id FROM devices d
      JOIN sites s ON d.site_id = s.id
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
      AND uor.role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

-- Templates are public read
CREATE POLICY "Anyone can view device templates" ON device_templates
  FOR SELECT
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();