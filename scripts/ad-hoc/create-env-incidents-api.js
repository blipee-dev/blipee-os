const https = require('https');

const sql = `
-- GRI 307: Environmental Compliance
CREATE TABLE IF NOT EXISTS environmental_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),
  fine_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  regulation_violated TEXT,
  regulatory_body VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  resolution_date DATE,
  resolution_description TEXT,
  corrective_actions TEXT,
  incident_description TEXT NOT NULL,
  environmental_impact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT valid_incident_type CHECK (incident_type IN ('fine', 'sanction', 'violation', 'dispute', 'warning', 'notice')),
  CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'significant', 'major')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'under_review', 'resolved', 'appealed', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_env_incidents_org ON environmental_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_env_incidents_date ON environmental_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_env_incidents_type ON environmental_incidents(incident_type);

ALTER TABLE environmental_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view incidents in their organization" ON environmental_incidents;
CREATE POLICY "Users can view incidents in their organization"
  ON environmental_incidents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can insert incidents" ON environmental_incidents;
CREATE POLICY "Managers can insert incidents"
  ON environmental_incidents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update incidents" ON environmental_incidents;
CREATE POLICY "Managers can update incidents"
  ON environmental_incidents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );
`;

console.log('📋 SQL to create environmental_incidents table:');
console.log('=' .repeat(70));
console.log(sql);
console.log('=' .repeat(70));
console.log('\n⚠️ Supabase API does not support direct SQL execution via client library.');
console.log('\n📝 Please run this in Supabase Dashboard:');
console.log('   1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql');
console.log('   2. Click "New Query"');
console.log('   3. Paste the SQL above');
console.log('   4. Click "Run"');
console.log('\n✅ After running, the environmental_incidents table will be ready!');
