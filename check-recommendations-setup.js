const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkRecommendationsSetup() {
  console.log("🔍 Checking Recommendations System Setup\n");
  console.log("=".repeat(70));

  // Check if tables exist
  const tables = [
    "metric_recommendations",
    "peer_benchmark_data",
    "industry_materiality",
    "recommendation_actions"
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} records`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 Industry Materiality Data\n");

  // Check industry_materiality for professional services
  const { data: materiality } = await supabase
    .from("industry_materiality")
    .select("*")
    .eq("industry", "professional_services")
    .limit(10);

  if (materiality && materiality.length > 0) {
    console.log(`Found ${materiality.length} materiality records for professional_services:`);
    materiality.forEach(m => {
      console.log(`   - ${m.metric_catalog_id} | ${m.materiality_level} | ${m.gri_disclosure || 'N/A'}`);
    });
  } else {
    console.log("⚠️  No industry_materiality data found for professional_services");
    console.log("   This needs to be populated for recommendations to work!");
  }

  console.log("\n" + "=".repeat(70));
  console.log("📈 Peer Benchmark Data\n");

  const { data: benchmarks } = await supabase
    .from("peer_benchmark_data")
    .select("*")
    .limit(5);

  if (benchmarks && benchmarks.length > 0) {
    console.log(`Found ${benchmarks.length} benchmark records`);
  } else {
    console.log("⚠️  No peer_benchmark_data found");
    console.log("   Recommendations will work without this, but won't have peer adoption %");
  }

  console.log("\n" + "=".repeat(70));
}

checkRecommendationsSetup().catch(console.error);
