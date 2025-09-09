-- Add missing columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_primary TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_secondary TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS headquarters_address JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enabled_features TEXT[] DEFAULT ARRAY['ai_chat', 'emissions_tracking'];
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS compliance_frameworks TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create buildings table if not exists (for compatibility)
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sites table (renamed from buildings for consistency)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  address JSONB DEFAULT '{}',
  type TEXT DEFAULT 'office',
  total_area_sqm NUMERIC,
  total_employees INTEGER,
  floors INTEGER,
  floor_details JSONB DEFAULT '[]',
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'active',
  devices_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create devices table if not exists
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  ip_address TEXT,
  mac_address TEXT,
  protocol TEXT,
  data_interval INTEGER,
  floor INTEGER,
  zone TEXT,
  capabilities JSONB DEFAULT '[]',
  state JSONB DEFAULT '{}',
  status TEXT DEFAULT 'online',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE devices ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mac_address TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS protocol TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS data_interval INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'online';

-- Create users table for application users (separate from auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'user',
  department TEXT,
  phone TEXT,
  title TEXT,
  location TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  two_factor_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role column to user_organizations if it doesn't exist
ALTER TABLE user_organizations 
ALTER COLUMN role SET DEFAULT 'viewer',
ADD CONSTRAINT user_organizations_role_check 
CHECK (role IN ('account_owner', 'admin', 'manager', 'user', 'viewer'));

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_devices_site ON devices(site_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_app_users_org ON app_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);

-- Add triggers for new tables
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can insert organizations" ON organizations;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account owners can update their organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'account_owner'
    )
  );

CREATE POLICY "Account owners can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true); -- Anyone can create an org, they become the owner

-- Drop existing sites policies if they exist
DROP POLICY IF EXISTS "Users can view sites in their organizations" ON sites;
DROP POLICY IF EXISTS "Managers can manage sites" ON sites;

-- Sites policies
CREATE POLICY "Users can view sites in their organizations" ON sites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage sites" ON sites
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin', 'manager')
    )
  );

-- Drop existing devices policies if they exist
DROP POLICY IF EXISTS "Users can view devices in their organizations" ON devices;
DROP POLICY IF EXISTS "Managers can manage devices" ON devices;

-- Devices policies
CREATE POLICY "Users can view devices in their organizations" ON devices
  FOR SELECT USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers can manage devices" ON devices
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin', 'manager')
      )
    )
  );

-- Drop existing app_users policies if they exist
DROP POLICY IF EXISTS "Users can view users in their organizations" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- App users policies
CREATE POLICY "Users can view users in their organizations" ON app_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage users" ON app_users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin')
    )
  );