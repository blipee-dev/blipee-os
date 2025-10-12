const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function forceRegenerate() {
  console.log("🔄 Force Regenerating Recommendations\n");
  console.log("=".repeat(70));

  // 1. Delete ALL existing recommendations (including dismissed, accepted)
  console.log("Step 1: Deleting ALL existing recommendations...");

  const { data: deleted, error: deleteError } = await supabase
    .from("metric_recommendations")
    .delete()
    .eq("organization_id", PLMJ_ORG_ID);

  if (deleteError) {
    console.log("❌ Error deleting:", deleteError);
    return;
  }

  console.log("✅ Deleted all recommendations\n");

  // 2. Generate fresh recommendations
  console.log("Step 2: Generating NEW recommendations from industry_materiality...");

  const { data: generated, error: genError } = await supabase
    .rpc("generate_recommendations_for_org", {
      p_organization_id: PLMJ_ORG_ID,
      p_industry: "professional_services",
      p_region: "EU",
      p_size_category: "100-300"
    });

  if (genError) {
    console.log("❌ Error generating:", genError);
    return;
  }

  console.log(`✅ Generated ${generated?.length || 0} recommendations\n`);

  // 3. Insert them into the table
  if (generated && generated.length > 0) {
    console.log("Step 3: Inserting into metric_recommendations table...");

    const recsToInsert = generated.map(rec => ({
      organization_id: PLMJ_ORG_ID,
      metric_catalog_id: rec.metric_catalog_id,
      priority: rec.priority,
      recommendation_reason: rec.recommendation_reason,
      peer_adoption_percent: rec.peer_adoption_percent,
      estimated_baseline_value: rec.estimated_baseline_value,
      estimated_baseline_unit: rec.estimated_baseline_unit,
      estimation_method: 'peer_benchmark',
      estimation_confidence: rec.estimation_confidence,
      required_for_frameworks: rec.required_for_frameworks,
      gri_disclosure: rec.gri_disclosure,
      status: 'pending'
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("metric_recommendations")
      .insert(recsToInsert)
      .select(`
        *,
        metric:metrics_catalog(*)
      `);

    if (insertError) {
      console.log("❌ Error inserting:", insertError);
      return;
    }

    console.log(`✅ Inserted ${inserted?.length || 0} recommendations\n`);

    // Show what was inserted
    const byPriority = {
      high: inserted.filter(r => r.priority === 'high'),
      medium: inserted.filter(r => r.priority === 'medium'),
      low: inserted.filter(r => r.priority === 'low')
    };

    console.log("=".repeat(70));
    console.log("📊 NEW RECOMMENDATIONS IN DATABASE\n");
    console.log("=".repeat(70));

    console.log(`\n🔥 HIGH PRIORITY (${byPriority.high.length}):\n`);
    byPriority.high.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.metric.name} (${rec.metric.category})`);
    });

    console.log(`\n⚡ MEDIUM PRIORITY (${byPriority.medium.length}):\n`);
    byPriority.medium.slice(0, 5).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.metric.name} (${rec.metric.category})`);
    });
    if (byPriority.medium.length > 5) {
      console.log(`   ... and ${byPriority.medium.length - 5} more`);
    }

    console.log(`\n📝 LOW PRIORITY: ${byPriority.low.length} metrics`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ COMPLETE!");
    console.log("=".repeat(70));
    console.log("\nNow refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)");
    console.log("You should see the correct recommendations!");
  }
}

forceRegenerate().catch(console.error);
