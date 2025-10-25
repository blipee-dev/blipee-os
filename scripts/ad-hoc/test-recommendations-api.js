const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function testRecommendations() {
  console.log("🎯 Testing Recommendations API for PLMJ\n");
  console.log("=".repeat(70));

  // Call the generate_recommendations_for_org function directly
  const { data, error } = await supabase.rpc("generate_recommendations_for_org", {
    p_organization_id: PLMJ_ORG_ID,
    p_industry: "professional_services",
    p_region: "EU",
    p_size_category: "100-300"
  });

  if (error) {
    console.log("❌ Error:", error);
    return;
  }

  console.log(`\n✅ Generated ${data?.length || 0} recommendations\n`);

  if (!data || data.length === 0) {
    console.log("⚠️  No recommendations returned.");
    console.log("   This could mean:");
    console.log("   1. All metrics are already being tracked");
    console.log("   2. No materiality data matches the industry");
    console.log("   3. The function needs debugging");
    return;
  }

  // Group by priority
  const byPriority = {
    high: data.filter(r => r.priority === 'high'),
    medium: data.filter(r => r.priority === 'medium'),
    low: data.filter(r => r.priority === 'low')
  };

  console.log("📊 RECOMMENDATIONS BY PRIORITY\n");
  console.log("=".repeat(70));

  // HIGH Priority
  console.log(`\n🔥 HIGH PRIORITY (${byPriority.high.length} metrics)\n`);
  byPriority.high.slice(0, 10).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.metric_name} (${rec.category})`);
    console.log(`   Scope: ${rec.scope.replace('scope_', 'Scope ')}`);
    console.log(`   Code: ${rec.metric_code}`);
    if (rec.peer_adoption_percent) {
      console.log(`   Peer Adoption: ${rec.peer_adoption_percent}%`);
    }
    if (rec.gri_disclosure) {
      console.log(`   GRI: ${rec.gri_disclosure}`);
    }
    console.log(`   Reason: ${rec.recommendation_reason}`);
    console.log();
  });

  if (byPriority.high.length > 10) {
    console.log(`   ... and ${byPriority.high.length - 10} more high-priority metrics\n`);
  }

  // MEDIUM Priority
  console.log(`\n⚡ MEDIUM PRIORITY (${byPriority.medium.length} metrics)\n`);
  byPriority.medium.slice(0, 5).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.metric_name} (${rec.category})`);
    console.log(`   Scope: ${rec.scope.replace('scope_', 'Scope ')}`);
    if (rec.recommendation_reason) {
      console.log(`   Reason: ${rec.recommendation_reason.substring(0, 80)}...`);
    }
    console.log();
  });

  if (byPriority.medium.length > 5) {
    console.log(`   ... and ${byPriority.medium.length - 5} more medium-priority metrics\n`);
  }

  // LOW Priority
  console.log(`\n📝 LOW PRIORITY (${byPriority.low.length} metrics)\n`);
  if (byPriority.low.length > 0) {
    byPriority.low.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.metric_name} (${rec.category}) - ${rec.scope.replace('scope_', 'Scope ')}`);
    });
    if (byPriority.low.length > 3) {
      console.log(`   ... and ${byPriority.low.length - 3} more\n`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📈 SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total Recommendations: ${data.length}`);
  console.log(`  High Priority: ${byPriority.high.length}`);
  console.log(`  Medium Priority: ${byPriority.medium.length}`);
  console.log(`  Low Priority: ${byPriority.low.length}`);
  console.log("\nThese metrics are from the catalog and NOT currently tracked by PLMJ.");
  console.log("The recommendations are based on professional services industry materiality.");
  console.log("=".repeat(70));
}

testRecommendations().catch(console.error);
