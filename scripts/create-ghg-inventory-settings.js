const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function createGHGInventorySettings() {
  console.log('=== CREATING GHG INVENTORY SETTINGS ===\n');

  // Get organization_id from command line args or use first available org
  const orgIdArg = process.argv[2];
  const reportingYear = parseInt(process.argv[3]) || new Date().getFullYear();

  let organizationId;
  let organizationName;

  if (orgIdArg) {
    organizationId = orgIdArg;
    // Get organization name
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
    organizationName = org?.name || 'Organization';
  } else {
    // Get first organization from database
    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();

    if (orgError || !orgs) {
      console.error('❌ No organizations found. Please create an organization first.');
      return;
    }

    organizationId = orgs.id;
    organizationName = orgs.name;
  }

  console.log(`Organization: ${organizationName}`);
  console.log(`Organization ID: ${organizationId}`);
  console.log(`Reporting Year: ${reportingYear}\n`);

  // Match the actual table schema from the migration file
  const settings = {
    organization_id: organizationId,
    reporting_year: reportingYear,

    // Organizational Boundary (from schema)
    consolidation_approach: 'operational_control',
    reporting_entity: organizationName,

    // Operational Boundary (from schema)
    gases_covered: ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],
    gwp_standard: 'IPCC AR6',

    // Base Year (from schema)
    base_year: 2023,
    base_year_rationale: 'Calendar year 2023 chosen as base year as it represents the first complete year of comprehensive emissions tracking.',
    recalculation_threshold: 5.0,

    // Reporting Period (from schema)
    period_start: `${reportingYear}-01-01`,
    period_end: `${reportingYear}-12-31`,

    // Assurance (from schema)
    assurance_level: 'not_verified',
    assurance_provider: null,
    assurance_statement_url: null,

    // Compliance Statement (from schema)
    compliance_statement: 'This GHG inventory has been prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.',
    methodology_description: 'Scope 1: Direct measurement of fuel consumption with IPCC AR6 emission factors. Scope 2: Dual reporting using IEA 2023 Portugal grid emission factor (location-based) and supplier-specific emission factors (market-based). Scope 3: Activity-based and spend-based calculations using industry-average emission factors.',

    // Scope 3 Screening (from schema) - using category numbers 1-15
    scope3_categories_included: [6, 7, 1, 4, 5], // Business travel, Employee commuting, Purchased goods, Upstream transportation, Waste
    scope3_screening_rationale: 'Categories selected based on materiality assessment: business travel, employee commuting, purchased goods and services, upstream transportation, and waste are the most significant Scope 3 sources for PLMJ operations.'
  };

  console.log('Settings to be created:');
  console.log(JSON.stringify(settings, null, 2));
  console.log('\n');

  // Upsert (insert or update if exists)
  console.log('Attempting to insert into ghg_inventory_settings...\n');

  const { data, error } = await supabaseAdmin
    .from('ghg_inventory_settings')
    .upsert(settings, {
      onConflict: 'organization_id,reporting_year'
    })
    .select();

  console.log('Response data:', data);
  console.log('Response error:', JSON.stringify(error, null, 2));

  if (error) {
    console.error('\n❌ Error creating GHG inventory settings:');
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('✅ GHG Inventory Settings created successfully!');
  console.log('\nCreated record:');
  console.log(JSON.stringify(data, null, 2));

  // Verify it was created
  const { data: verification, error: verifyError } = await supabaseAdmin
    .from('ghg_inventory_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('reporting_year', reportingYear)
    .single();

  if (verifyError) {
    console.error('\n❌ Error verifying settings:', verifyError);
    return;
  }

  console.log('\n✅ Verification successful!');
  console.log('Organization:', verification.reporting_entity);
  console.log('Organization ID:', verification.organization_id);
  console.log('Reporting Year:', verification.reporting_year);
  console.log('Base Year:', verification.base_year);
  console.log('Consolidation Approach:', verification.consolidation_approach);
  console.log('Scope 3 Categories:', verification.scope3_categories_included?.length || 0);
  console.log('\n💡 Usage:');
  console.log('  node scripts/create-ghg-inventory-settings.js [organization_id] [year]');
  console.log('  Example: node scripts/create-ghg-inventory-settings.js 22647141-2ee4-4d8d-8b47-16b0cbd830b2 2024');
}

createGHGInventorySettings();
