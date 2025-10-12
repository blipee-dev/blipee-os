const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkMetricsCatalog() {
  console.log("🔍 Checking metrics_catalog table...\n");

  // Try simple count
  const { count, error: countError } = await supabase
    .from("metrics_catalog")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("❌ Error:", countError);
    return;
  }

  console.log(`✅ Table exists with ${count} records\n`);

  if (count === 0) {
    console.log("⚠️  Table is EMPTY! This needs to be populated.\n");
    return;
  }

  // Get sample records
  const { data: sample } = await supabase
    .from("metrics_catalog")
    .select("*")
    .limit(5);

  console.log("📊 Sample records:");
  console.log(JSON.stringify(sample, null, 2));

  // Get count by scope
  const { data: scopes } = await supabase
    .from("metrics_catalog")
    .select("scope");

  const scopeCounts = {
    scope_1: scopes?.filter(s => s.scope === 'scope_1').length || 0,
    scope_2: scopes?.filter(s => s.scope === 'scope_2').length || 0,
    scope_3: scopes?.filter(s => s.scope === 'scope_3').length || 0
  };

  console.log("\n📈 By Scope:");
  console.log(`   Scope 1: ${scopeCounts.scope_1}`);
  console.log(`   Scope 2: ${scopeCounts.scope_2}`);
  console.log(`   Scope 3: ${scopeCounts.scope_3}`);
}

checkMetricsCatalog().catch(console.error);
