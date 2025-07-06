-- Blipee OS Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings table
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  capabilities JSONB DEFAULT '[]',
  state JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics table (time-series data)
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- User organizations relationship
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX idx_buildings_org ON buildings(organization_id);
CREATE INDEX idx_devices_building ON devices(building_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_building ON conversations(building_id);
CREATE INDEX idx_metrics_device_time ON metrics(device_id, time DESC);
CREATE INDEX idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX idx_user_orgs_org ON user_organizations(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Buildings: Users can only see buildings in their organizations
CREATE POLICY "Users can view buildings in their organizations" ON buildings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Devices: Users can see devices in buildings they have access to
CREATE POLICY "Users can view devices in their buildings" ON devices
  FOR SELECT USING (
    building_id IN (
      SELECT id FROM buildings
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

-- Metrics: Users can see metrics for devices they have access to
CREATE POLICY "Users can view metrics for their devices" ON metrics
  FOR SELECT USING (
    device_id IN (
      SELECT id FROM devices
      WHERE building_id IN (
        SELECT id FROM buildings
        WHERE organization_id IN (
          SELECT organization_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- User organizations: Users can see their own memberships
CREATE POLICY "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- Create demo data function
CREATE OR REPLACE FUNCTION create_demo_data(user_id UUID)
RETURNS void AS $$
DECLARE
  org_id UUID;
  building_id UUID;
  device_id UUID;
BEGIN
  -- Create demo organization
  INSERT INTO organizations (name, slug, settings)
  VALUES ('Demo Company', 'demo-company', '{"tier": "premium"}')
  RETURNING id INTO org_id;

  -- Add user to organization
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (user_id, org_id, 'admin');

  -- Create demo building
  INSERT INTO buildings (organization_id, name, address, metadata)
  VALUES (
    org_id,
    'Demo Office Tower',
    '123 Innovation Street, Tech City',
    '{
      "size": 50000,
      "floors": 10,
      "type": "office",
      "timezone": "America/New_York"
    }'
  )
  RETURNING id INTO building_id;

  -- Create demo devices
  INSERT INTO devices (building_id, type, name, manufacturer, model, capabilities, state)
  VALUES 
    (building_id, 'hvac', 'Main HVAC', 'Carrier', '30XA', 
     '["temperature_control", "scheduling", "efficiency_monitoring"]',
     '{"mode": "cooling", "setpoint": 22.5, "current_temp": 23.1}'),
    (building_id, 'lighting', 'Floor 1 Lights', 'Philips', 'HueMax', 
     '["dimming", "color_temperature", "scheduling"]',
     '{"brightness": 80, "color_temp": 4000, "status": "on"}'),
    (building_id, 'meter', 'Main Energy Meter', 'Schneider', 'PM5560', 
     '["power_monitoring", "energy_tracking", "power_quality"]',
     '{"power": 4520, "voltage": 480, "current": 5.4}');

  -- Create some demo metrics
  INSERT INTO metrics (time, device_id, metric_type, value)
  SELECT 
    NOW() - (interval '1 hour' * generate_series(0, 23)),
    (SELECT id FROM devices WHERE building_id = building_id AND type = 'meter' LIMIT 1),
    'power',
    4000 + (random() * 1000)
  FROM generate_series(0, 23);

END;
$$ LANGUAGE plpgsql;

-- Create view for building summaries
CREATE OR REPLACE VIEW building_summary AS
SELECT 
  b.id,
  b.name,
  b.organization_id,
  COUNT(DISTINCT d.id) as device_count,
  COUNT(DISTINCT CASE WHEN d.last_seen > NOW() - INTERVAL '5 minutes' THEN d.id END) as online_devices,
  MAX(d.last_seen) as last_activity
FROM buildings b
LEFT JOIN devices d ON d.building_id = b.id
GROUP BY b.id, b.name, b.organization_id;

-- Grant permissions on the view
GRANT SELECT ON building_summary TO authenticated;

COMMENT ON SCHEMA public IS 'Blipee OS - The ChatGPT for Buildings';