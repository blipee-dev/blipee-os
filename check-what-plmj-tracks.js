const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function checkWhatPLMJTracks() {
  console.log("🔍 Checking what PLMJ currently tracks\n");
  console.log("=".repeat(70));

  // Get all metrics PLMJ has data for
  const { data: trackedMetrics } = await supabase
    .from("metrics_data")
    .select("metric_id")
    .eq("organization_id", PLMJ_ORG_ID);

  const uniqueMetricIds = [...new Set(trackedMetrics?.map(m => m.metric_id) || [])];

  console.log(`\n📊 PLMJ tracks ${uniqueMetricIds.length} unique metrics\n`);

  // Get details
  const { data: metrics } = await supabase
    .from("metrics_catalog")
    .select("id, code, name, category, scope")
    .in("id", uniqueMetricIds)
    .order("scope, category, name");

  // Group by scope
  const scope2 = metrics?.filter(m => m.scope === 'scope_2') || [];

  console.log(`⚡ SCOPE 2 Metrics (${scope2.length}):\n`);
  scope2.forEach(m => {
    console.log(`   ✓ ${m.name} (${m.code})`);
  });

  // Check if they track district heating/cooling
  const hasDistrictHeating = scope2.some(m =>
    m.code.includes('district_heating') ||
    m.code.includes('purchased_heating') ||
    m.name.toLowerCase().includes('district heating') ||
    m.name.toLowerCase().includes('purchased heating')
  );

  const hasDistrictCooling = scope2.some(m =>
    m.code.includes('district_cooling') ||
    m.code.includes('purchased_cooling') ||
    m.name.toLowerCase().includes('district cooling') ||
    m.name.toLowerCase().includes('purchased cooling')
  );

  console.log("\n" + "=".repeat(70));
  console.log("🔥 HVAC TRACKING STATUS:");
  console.log("=".repeat(70));
  console.log(`District Heating: ${hasDistrictHeating ? '✅ ALREADY TRACKING' : '❌ Not tracking'}`);
  console.log(`District Cooling: ${hasDistrictCooling ? '✅ ALREADY TRACKING' : '❌ Not tracking'}`);

  if (hasDistrictHeating || hasDistrictCooling) {
    console.log("\n⚠️  PROBLEM: District Heating/Cooling should NOT be recommended!");
    console.log("   The generate_recommendations_for_org function should filter these out.");
    console.log("\n💡 The function checks metrics_data to exclude already tracked metrics.");
    console.log("   Let's verify the function is working correctly...");
  }
}

checkWhatPLMJTracks().catch(console.error);
