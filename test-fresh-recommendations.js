const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function testFreshRecommendations() {
  console.log("🎯 Testing Fresh Recommendations Generation\n");
  console.log("=".repeat(70));

  // 1. Verify old recommendations are gone
  const { data: existing } = await supabase
    .from("metric_recommendations")
    .select("*")
    .eq("organization_id", PLMJ_ORG_ID)
    .eq("status", "pending");

  console.log(`\n✅ Old recommendations cleared: ${existing?.length || 0} pending\n`);

  if (existing && existing.length > 0) {
    console.log("⚠️  Still have old recommendations! They should be deleted.");
    return;
  }

  // 2. Call the RPC to generate new recommendations
  console.log("🔄 Generating NEW recommendations...\n");

  const { data: generated, error } = await supabase.rpc("generate_recommendations_for_org", {
    p_organization_id: PLMJ_ORG_ID,
    p_industry: "professional_services",
    p_region: "EU",
    p_size_category: "100-300"
  });

  if (error) {
    console.log("❌ Error:", error);
    return;
  }

  console.log(`✅ Generated ${generated?.length || 0} recommendations\n`);

  // Group by priority
  const byPriority = {
    high: generated?.filter(r => r.priority === 'high') || [],
    medium: generated?.filter(r => r.priority === 'medium') || [],
    low: generated?.filter(r => r.priority === 'low') || []
  };

  console.log("=".repeat(70));
  console.log("📊 NEW RECOMMENDATIONS (FRESH FROM industry_materiality)\n");
  console.log("=".repeat(70));

  // HIGH PRIORITY
  console.log(`\n🔥 HIGH PRIORITY (${byPriority.high.length} metrics)\n`);
  byPriority.high.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.metric_name}`);
    console.log(`   Category: ${rec.category} | Scope: ${rec.scope.replace('scope_', 'Scope ')}`);
    console.log(`   Code: ${rec.metric_code}`);
    console.log(`   Reason: ${rec.recommendation_reason.substring(0, 100)}...`);
    if (rec.peer_adoption_percent) {
      console.log(`   Peer Adoption: ${rec.peer_adoption_percent}%`);
    }
    if (rec.required_for_frameworks) {
      try {
        const frameworks = typeof rec.required_for_frameworks === 'string'
          ? JSON.parse(rec.required_for_frameworks)
          : rec.required_for_frameworks;
        console.log(`   Frameworks: ${frameworks.join(', ')}`);
      } catch (e) {
        console.log(`   Frameworks: ${rec.required_for_frameworks}`);
      }
    }
    console.log();
  });

  // MEDIUM PRIORITY
  console.log(`\n⚡ MEDIUM PRIORITY (${byPriority.medium.length} metrics)\n`);
  byPriority.medium.slice(0, 5).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.metric_name} (${rec.category})`);
  });
  if (byPriority.medium.length > 5) {
    console.log(`   ... and ${byPriority.medium.length - 5} more`);
  }

  // LOW PRIORITY
  console.log(`\n📝 LOW PRIORITY (${byPriority.low.length} metrics)\n`);
  console.log(`   ${byPriority.low.length} optional metrics (mostly Scope 1 - correctly low for offices)`);

  console.log("\n" + "=".repeat(70));
  console.log("✅ VERIFICATION");
  console.log("=".repeat(70));

  // Check if we got the RIGHT recommendations
  const expectedHighPriority = [
    'employee_commute_car',
    'employee_commute_public',
    'employee_commute_bike',
    'remote_work',
    'business_travel_road',
    'hotel_nights',
    'it_equipment'
  ];

  const hasExpected = expectedHighPriority.some(code =>
    byPriority.high.some(r => r.metric_code.includes(code))
  );

  if (hasExpected) {
    console.log("\n✅ CORRECT! Found expected high-priority metrics:");
    console.log("   - Employee commuting");
    console.log("   - Business travel");
    console.log("   - IT equipment");
    console.log("\n🎉 The system is now recommending the RIGHT metrics!");
  } else {
    console.log("\n⚠️  Expected metrics not found. May need to check materiality data.");
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n💡 Next Step: Refresh your UI and you should see these new recommendations!");
}

testFreshRecommendations().catch(console.error);
