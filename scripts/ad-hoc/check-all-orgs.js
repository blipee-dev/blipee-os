const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkAllOrgs() {
  console.log("🔍 Checking All Organizations\n");

  // Get all organizations
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name");

  console.log(`Found ${orgs?.length || 0} organizations:\n`);

  if (!orgs) return;

  for (const org of orgs) {
    console.log(`📊 ${org.name} (${org.id})`);

    // Check compliance data for this org
    const { count: ghgCount } = await supabase
      .from("ghg_inventory_settings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    const { count: esrsCount } = await supabase
      .from("esrs_e1_disclosures")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    const { count: tcfdCount } = await supabase
      .from("tcfd_disclosures")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    console.log(`   GHG Settings: ${ghgCount || 0}`);
    console.log(`   ESRS E1: ${esrsCount || 0}`);
    console.log(`   TCFD: ${tcfdCount || 0}`);

    // Check if this is the org from the error (22647141-2ee4-4d8d-8b47-16b0cbd830b2)
    if (org.id === "22647141-2ee4-4d8d-8b47-16b0cbd830b2") {
      console.log(`   👉 This is the PLMJ organization from the error`);

      // Get ESRS details
      const { data: esrsDetails } = await supabase
        .from("esrs_e1_disclosures")
        .select("reporting_year, total_gross")
        .eq("organization_id", org.id)
        .order("reporting_year");

      if (esrsDetails && esrsDetails.length > 0) {
        console.log(`   ESRS Years:`);
        esrsDetails.forEach(e => {
          console.log(`      ${e.reporting_year}: ${e.total_gross?.toFixed(2) || 0} tCO2e`);
        });
      }
    }

    console.log("");
  }
}

checkAllOrgs().catch(console.error);
