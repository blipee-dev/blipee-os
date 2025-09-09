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

-- Update devices table to reference sites and add missing fields
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
DO $$ 
BEGIN
    -- Set default if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_organizations' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_organizations
        ALTER COLUMN role SET DEFAULT 'viewer';
    END IF;
    
    -- Check if constraint exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_organizations_role_check'
    ) THEN
        ALTER TABLE user_organizations
        ADD CONSTRAINT user_organizations_role_check
        CHECK (role IN ('account_owner', 'admin', 'manager', 'user', 'viewer'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraint already exists
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_devices_site ON devices(site_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_app_users_org ON app_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);

-- Add triggers for new tables (if they don't exist)
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Account owners can update their organizations" ON organizations;
CREATE POLICY "Account owners can update their organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'account_owner'
    )
  );

DROP POLICY IF EXISTS "Account owners can insert organizations" ON organizations;
CREATE POLICY "Account owners can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true); -- Anyone can create an org, they become the owner

-- Sites policies
DROP POLICY IF EXISTS "Users can view sites in their organizations" ON sites;
CREATE POLICY "Users can view sites in their organizations" ON sites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can manage sites" ON sites;
CREATE POLICY "Managers can manage sites" ON sites
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin', 'manager')
    )
  );

-- Devices policies
DROP POLICY IF EXISTS "Users can view devices in their organizations" ON devices;
CREATE POLICY "Users can view devices in their organizations" ON devices
  FOR SELECT USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Managers can manage devices" ON devices;
CREATE POLICY "Managers can manage devices" ON devices
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin', 'manager')
      )
    )
  );

-- App users policies
DROP POLICY IF EXISTS "Users can view users in their organizations" ON app_users;
CREATE POLICY "Users can view users in their organizations" ON app_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage users" ON app_users;
CREATE POLICY "Admins can manage users" ON app_users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin')
    )
  );