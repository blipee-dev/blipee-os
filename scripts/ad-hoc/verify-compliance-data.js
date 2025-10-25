const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function verifyComplianceData() {
  console.log("🔍 Verifying Compliance Data\n");
  console.log("=".repeat(60));

  // Get organization
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name")
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.log("No organizations found");
    return;
  }

  const orgId = orgs[0].id;
  const orgName = orgs[0].name;

  console.log(`📊 Organization: ${orgName}\n`);

  // Check ghg_inventory_settings
  const { data: ghgSettings, count: ghgCount } = await supabase
    .from("ghg_inventory_settings")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId)
    .order("reporting_year");

  console.log(`✅ GHG Inventory Settings: ${ghgCount} records`);
  if (ghgSettings && ghgSettings.length > 0) {
    ghgSettings.forEach(s => {
      console.log(`   📅 ${s.reporting_year}: Base Year ${s.base_year}, ${s.consolidation_approach}`);
    });
  }

  // Check esrs_e1_disclosures
  const { data: esrsData, count: esrsCount } = await supabase
    .from("esrs_e1_disclosures")
    .select("reporting_year, scope_1_gross, scope_2_gross_lb, scope_3_gross, total_gross", { count: "exact" })
    .eq("organization_id", orgId)
    .order("reporting_year");

  console.log(`\n✅ ESRS E1 Disclosures: ${esrsCount} records`);
  if (esrsData && esrsData.length > 0) {
    esrsData.forEach(e => {
      console.log(`   📅 ${e.reporting_year}: Total ${e.total_gross?.toFixed(2) || 0} tCO2e (S1:${e.scope_1_gross?.toFixed(2) || 0}, S2:${e.scope_2_gross_lb?.toFixed(2) || 0}, S3:${e.scope_3_gross?.toFixed(2) || 0})`);
    });
  }

  // Check tcfd_disclosures
  const { data: tcfdData, count: tcfdCount } = await supabase
    .from("tcfd_disclosures")
    .select("reporting_year, metrics", { count: "exact" })
    .eq("organization_id", orgId)
    .order("reporting_year");

  console.log(`\n✅ TCFD Disclosures: ${tcfdCount} records`);
  if (tcfdData && tcfdData.length > 0) {
    tcfdData.forEach(t => {
      const total = t.metrics?.total_emissions_tco2e || 0;
      console.log(`   📅 ${t.reporting_year}: Total ${total.toFixed(2)} tCO2e`);
    });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n📝 SUMMARY:`);
  console.log(`   GHG Inventory Settings: ${ghgCount}/4 records`);
  console.log(`   ESRS E1 Disclosures: ${esrsCount}/4 records`);
  console.log(`   TCFD Disclosures: ${tcfdCount}/4 records`);

  if (ghgCount === 4 && esrsCount === 4 && tcfdCount === 4) {
    console.log(`\n✅ All compliance data populated successfully!`);
    console.log(`\n🎉 Your Compliance Dashboard is ready at:`);
    console.log(`   http://localhost:3000/sustainability/dashboard (Compliance tab)`);
  } else {
    console.log(`\n⚠️  Some records are missing. Run the migration again to complete.`);
  }

  console.log(`\n${"=".repeat(60)}\n`);
}

verifyComplianceData().catch(console.error);
