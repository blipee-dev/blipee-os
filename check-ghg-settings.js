const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function checkGHGSettings() {
  console.log("🔍 Checking GHG Inventory Settings\n");
  console.log("=".repeat(70));

  const { data: settings, error } = await supabase
    .from("ghg_inventory_settings")
    .select("*")
    .eq("organization_id", PLMJ_ORG_ID)
    .order("reporting_year");

  if (error) {
    console.log("❌ Error:", error);
    return;
  }

  console.log(`\n📊 Found ${settings?.length || 0} GHG inventory records for PLMJ\n`);

  if (settings && settings.length > 0) {
    settings.forEach(s => {
      console.log(`Year ${s.reporting_year}:`);
      console.log(`   Base Year: ${s.base_year}`);
      console.log(`   Rationale: ${s.base_year_rationale?.substring(0, 80)}...`);
      console.log(`   Period: ${s.period_start} to ${s.period_end}`);
      console.log(`   Consolidation: ${s.consolidation_approach}`);
      console.log(`   GWP: ${s.gwp_standard}`);
      console.log();
    });

    // Check if base_year is consistent
    const baseYears = [...new Set(settings.map(s => s.base_year))];

    if (baseYears.length > 1) {
      console.log("⚠️  PROBLEM: Different base years found!");
      console.log(`   Base years: ${baseYears.join(', ')}`);
    } else {
      console.log(`✅ Base year is consistent: ${baseYears[0]}`);
    }

    if (baseYears[0] !== 2023) {
      console.log(`\n❌ INCORRECT: Base year should be 2023, but it's ${baseYears[0]}`);
      console.log("\n💡 FIX: Run this SQL to correct it:");
      console.log(`
UPDATE ghg_inventory_settings
SET base_year = 2023,
    base_year_rationale = 'Base year 2023 selected as the first complete year with comprehensive data collection across all facilities and emission sources.'
WHERE organization_id = '${PLMJ_ORG_ID}';
      `);
    }
  }
}

checkGHGSettings().catch(console.error);
