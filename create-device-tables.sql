-- Create flexible device storage tables following IoT best practices

-- Device registry table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE, -- External device ID from manufacturer/provider
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'electricity_meter', 'enthalpy_meter', 'temperature', 'air_quality', 'people_counter', etc
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT, -- Floor, room, area description
  metadata JSONB DEFAULT '{}', -- Flexible metadata (calibration, settings, etc)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  installed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device data table (time-series, key-value pattern like Tago.io)
CREATE TABLE IF NOT EXISTS device_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  variable TEXT NOT NULL, -- 'temperature', 'humidity', 'power', 'energy', 'co2', etc
  value DOUBLE PRECISION NOT NULL,
  unit TEXT, -- 'celsius', 'kwh', 'ppm', etc
  metadata JSONB DEFAULT '{}', -- Additional context (quality, source, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device templates for common configurations
CREATE TABLE IF NOT EXISTS device_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  variables JSONB NOT NULL, -- Array of {name, unit, description, min, max}
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

-- Indexes for performance
CREATE INDEX idx_devices_site_id ON devices(site_id);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_external_id ON devices(external_id);
CREATE INDEX idx_device_data_device_id ON device_data(device_id);
CREATE INDEX idx_device_data_timestamp ON device_data(timestamp DESC);
CREATE INDEX idx_device_data_variable ON device_data(variable);

-- Hypertable for time-series optimization (if using TimescaleDB)
-- SELECT create_hypertable('device_data', 'timestamp');

-- RLS Policies
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_templates ENABLE ROW LEVEL SECURITY;

-- Devices policy: Users can view devices from sites in their organization
CREATE POLICY "Users can view devices from their organization sites" ON devices
  FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN user_organization_roles uor ON s.organization_id = uor.organization_id
      WHERE uor.user_id = auth.uid()
    )
  );

-- Device data policy: Users can view data from devices they can access
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

-- Templates are public read
CREATE POLICY "Anyone can view device templates" ON device_templates
  FOR SELECT
  USING (true);