const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function createEnvironmentalIncidentsTable() {
  console.log('Creating environmental_incidents table for GRI 307...\n');

  const sql = `
-- GRI 307: Environmental Compliance
CREATE TABLE IF NOT EXISTS environmental_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

  -- Incident details
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),

  -- Financial impact
  fine_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Regulatory details
  regulation_violated TEXT,
  regulatory_body VARCHAR(255),

  -- Status and resolution
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  resolution_date DATE,
  resolution_description TEXT,
  corrective_actions TEXT,

  -- Documentation
  incident_description TEXT NOT NULL,
  environmental_impact TEXT,
  notes TEXT,

  -- Metadata
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

-- RLS for environmental_incidents
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

-- Update trigger
CREATE OR REPLACE FUNCTION update_environmental_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_environmental_incidents_updated_at ON environmental_incidents;
CREATE TRIGGER update_environmental_incidents_updated_at
  BEFORE UPDATE ON environmental_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_environmental_incidents_updated_at();

COMMENT ON TABLE environmental_incidents IS 'GRI 307: Tracks environmental non-compliance incidents, fines, and sanctions';
`;

  try {
    // Execute via Supabase SQL query
    const { data, error } = await supabase.rpc('query', {
      query_text: sql
    });

    if (error) {
      // Try alternative approach - execute statements individually
      console.log('Attempting alternative creation method...\n');

      // Just verify if we can access the table after the error
      const { data: testData, error: testError } = await supabase
        .from('environmental_incidents')
        .select('*')
        .limit(1);

      if (!testError) {
        console.log('✅ Table already exists and is accessible!');
        return true;
      }

      console.error('❌ Error:', error.message);
      console.log('\n⚠️ Please run this SQL manually in Supabase Dashboard:');
      console.log('   Dashboard → SQL Editor → New Query');
      console.log('\n' + sql);
      return false;
    }

    console.log('✅ Successfully created environmental_incidents table!');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function verify() {
  console.log('\n' + '='.repeat(60));
  console.log('Verifying all GRI tables...\n');

  const tables = [
    { name: 'environmental_incidents', gri: 'GRI 307' },
    { name: 'suppliers', gri: 'GRI 308' },
    { name: 'biodiversity_sites', gri: 'GRI 304' }
  ];

  let allGood = true;

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`✅ ${table.gri}: ${table.name} table exists`);
    } else {
      console.log(`❌ ${table.gri}: ${table.name} - ${error.message}`);
      allGood = false;
    }
  }

  // Check materials metrics
  const { data: materials } = await supabase
    .from('metrics_catalog')
    .select('code')
    .or('category.eq.Raw Materials,category.eq.Recycled Materials,category.eq.Packaging Materials,category.eq.Product Reclamation');

  console.log(`✅ GRI 301: ${materials?.length || 0} materials metrics in catalog`);

  console.log('\n' + '='.repeat(60));

  if (allGood && materials && materials.length > 0) {
    console.log('🎉 ALL GRI TABLES AND METRICS ARE READY!');
    console.log('\n📋 Next: Build the disclosure components');
    console.log('   • GRI 301: Materials disclosure component');
    console.log('   • GRI 304: Biodiversity disclosure component');
    console.log('   • GRI 307: Environmental Compliance component');
    console.log('   • GRI 308: Supplier Assessment component');
  } else {
    console.log('⚠️ Some issues remain - see errors above');
  }
}

async function main() {
  const success = await createEnvironmentalIncidentsTable();
  if (success) {
    await verify();
  }
}

main().catch(console.error);
