const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkTableExists(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  return !error;
}

async function main() {
  console.log("🔍 Checking compliance tables...\n");

  const tables = [
    "ghg_inventory_settings",
    "organization_inventory_settings",
    "esrs_e1_disclosures",
    "tcfd_disclosures",
    "scope2_instruments",
    "emissions_adjustments"
  ];

  const missingTables = [];

  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`✅ ${table} exists`);

      // Get count
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      console.log(`   └─ ${count} records`);
    } else {
      console.log(`❌ ${table} MISSING`);
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missingTables.join(", ")}`);
    console.log("\n📝 You need to apply these migrations first:");
    console.log("   1. supabase/migrations/20251004234000_create_ghg_inventory_settings.sql");
    console.log("   2. supabase/migrations/20250204_compliance_framework_extensions.sql");
    console.log("\n💡 Use Supabase SQL Editor or run via your deployment pipeline");
  } else {
    console.log("\n✅ All tables exist! Ready to populate data.");

    // Now let's populate the data
    console.log("\n📊 Populating compliance data from metrics_data...\n");

    // Read and execute the population script
    const populationSQL = fs.readFileSync(
      "supabase/migrations/20251013_populate_compliance_data.sql",
      "utf8"
    );

    console.log("⚠️  Note: This script needs to be run via SQL editor");
    console.log("The SQL is ready in: supabase/migrations/20251013_populate_compliance_data.sql");
  }
}

main().catch(console.error);
