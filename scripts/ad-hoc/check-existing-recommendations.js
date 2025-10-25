const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function checkExistingRecommendations() {
  console.log("🔍 Checking existing recommendations in metric_recommendations table\n");
  console.log("=".repeat(70));

  // Check if there are existing recommendations for PLMJ
  const { data: existing, error } = await supabase
    .from("metric_recommendations")
    .select(`
      *,
      metric:metrics_catalog(*)
    `)
    .eq("organization_id", PLMJ_ORG_ID)
    .eq("status", "pending");

  if (error) {
    console.log("❌ Error:", error);
    return;
  }

  console.log(`\n📊 Found ${existing?.length || 0} existing recommendations for PLMJ\n`);

  if (existing && existing.length > 0) {
    console.log("⚠️  OLD/STALE RECOMMENDATIONS FOUND:");
    console.log("   These were likely generated before we fixed the materiality data.\n");

    existing.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.metric?.name || 'Unknown'} (${rec.priority})`);
      console.log(`   Metric Code: ${rec.metric?.code}`);
      console.log(`   Reason: ${rec.recommendation_reason.substring(0, 80)}...`);
      console.log(`   Created: ${new Date(rec.created_at).toLocaleDateString()}`);
      console.log();
    });

    console.log("\n" + "=".repeat(70));
    console.log("🔧 SOLUTION: Clear these old recommendations");
    console.log("=".repeat(70));
    console.log("\nRun this to delete them:");
    console.log(`
DELETE FROM metric_recommendations
WHERE organization_id = '${PLMJ_ORG_ID}'
AND status = 'pending';
    `);
    console.log("\nThen refresh the UI - it will generate NEW recommendations based on");
    console.log("our correct industry_materiality data!");

  } else {
    console.log("✅ No existing recommendations found.");
    console.log("   The UI will generate new ones on first load.");
  }
}

checkExistingRecommendations().catch(console.error);
