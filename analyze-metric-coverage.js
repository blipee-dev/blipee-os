const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

const PLMJ_ORG_ID = "22647141-2ee4-4d8d-8b47-16b0cbd830b2";

async function analyzeMetricCoverage() {
  console.log("🔍 Analyzing Metric Coverage for PLMJ\n");
  console.log("=".repeat(70));

  // 1. Get ALL metrics from catalog
  const { data: allMetrics, error: catalogError } = await supabase
    .from("metrics_catalog")
    .select("id, code, name, category, scope, ghg_protocol_category, unit, is_active")
    .order("scope", { ascending: true });

  if (catalogError) {
    console.log("❌ Error fetching metrics catalog:", catalogError);
    return;
  }

  console.log(`\n📊 Total metrics in catalog: ${allMetrics?.length || 0}\n`);

  // Group by scope
  const byScope = {
    scope_1: allMetrics?.filter(m => m.scope === 'scope_1') || [],
    scope_2: allMetrics?.filter(m => m.scope === 'scope_2') || [],
    scope_3: allMetrics?.filter(m => m.scope === 'scope_3') || []
  };

  console.log(`   Scope 1: ${byScope.scope_1.length} metrics`);
  console.log(`   Scope 2: ${byScope.scope_2.length} metrics`);
  console.log(`   Scope 3: ${byScope.scope_3.length} metrics`);

  // 2. Get metrics PLMJ is actually tracking (has data for)
  const { data: trackedMetrics } = await supabase
    .from("metrics_data")
    .select("metric_id")
    .eq("organization_id", PLMJ_ORG_ID);

  const uniqueTrackedIds = [...new Set(trackedMetrics?.map(m => m.metric_id) || [])];

  console.log(`\n✅ Metrics PLMJ is tracking: ${uniqueTrackedIds.length}\n`);

  // Get details of tracked metrics
  const { data: trackedDetails } = await supabase
    .from("metrics_catalog")
    .select("id, code, name, category, scope, ghg_protocol_category")
    .in("id", uniqueTrackedIds)
    .order("scope, category");

  console.log("📈 Currently Tracked Metrics:");
  console.log("-".repeat(70));

  const trackedByScope = {
    scope_1: trackedDetails?.filter(m => m.scope === 'scope_1') || [],
    scope_2: trackedDetails?.filter(m => m.scope === 'scope_2') || [],
    scope_3: trackedDetails?.filter(m => m.scope === 'scope_3') || []
  };

  console.log(`\n🔥 Scope 1 (${trackedByScope.scope_1.length} tracked):`);
  trackedByScope.scope_1.forEach(m => {
    console.log(`   ✓ ${m.name} (${m.category})`);
  });

  console.log(`\n⚡ Scope 2 (${trackedByScope.scope_2.length} tracked):`);
  trackedByScope.scope_2.forEach(m => {
    console.log(`   ✓ ${m.name} (${m.category})`);
  });

  console.log(`\n🌍 Scope 3 (${trackedByScope.scope_3.length} tracked):`);
  const scope3ByCategory = {};
  trackedByScope.scope_3.forEach(m => {
    const cat = m.ghg_protocol_category || 'Other';
    if (!scope3ByCategory[cat]) scope3ByCategory[cat] = [];
    scope3ByCategory[cat].push(m);
  });

  Object.entries(scope3ByCategory).forEach(([cat, metrics]) => {
    console.log(`\n   ${cat} (${metrics.length} metrics):`);
    metrics.forEach(m => console.log(`      ✓ ${m.name}`));
  });

  // 3. Identify MISSING metrics (not tracked)
  const missingMetrics = allMetrics?.filter(m => !uniqueTrackedIds.includes(m.id)) || [];

  console.log(`\n\n❌ Metrics NOT Being Tracked: ${missingMetrics.length}\n`);
  console.log("=".repeat(70));

  const missingByScope = {
    scope_1: missingMetrics.filter(m => m.scope === 'scope_1'),
    scope_2: missingMetrics.filter(m => m.scope === 'scope_2'),
    scope_3: missingMetrics.filter(m => m.scope === 'scope_3')
  };

  console.log(`\n🔥 Missing Scope 1 (${missingByScope.scope_1.length}):`);
  missingByScope.scope_1.slice(0, 10).forEach(m => {
    console.log(`   ⚠️  ${m.name} (${m.category})`);
  });
  if (missingByScope.scope_1.length > 10) {
    console.log(`   ... and ${missingByScope.scope_1.length - 10} more`);
  }

  console.log(`\n⚡ Missing Scope 2 (${missingByScope.scope_2.length}):`);
  missingByScope.scope_2.slice(0, 10).forEach(m => {
    console.log(`   ⚠️  ${m.name} (${m.category})`);
  });
  if (missingByScope.scope_2.length > 10) {
    console.log(`   ... and ${missingByScope.scope_2.length - 10} more`);
  }

  console.log(`\n🌍 Missing Scope 3 (${missingByScope.scope_3.length}):`);

  // Group missing Scope 3 by GHG Protocol category
  const missingScope3ByCategory = {};
  missingByScope.scope_3.forEach(m => {
    const cat = m.ghg_protocol_category || 'Other';
    if (!missingScope3ByCategory[cat]) missingScope3ByCategory[cat] = [];
    missingScope3ByCategory[cat].push(m);
  });

  Object.entries(missingScope3ByCategory).forEach(([cat, metrics]) => {
    console.log(`\n   ${cat} (${metrics.length} metrics):`);
    metrics.slice(0, 5).forEach(m => {
      console.log(`      ⚠️  ${m.name}`);
    });
    if (metrics.length > 5) {
      console.log(`      ... and ${metrics.length - 5} more`);
    }
  });

  // 4. Priority recommendations for Professional Services (Law Firm)
  console.log(`\n\n🎯 HIGH PRIORITY for Professional Services (Law Firms):\n`);
  console.log("=".repeat(70));

  const lawFirmPriorities = [
    'Business Travel',
    'Employee Commuting',
    'Waste',
    'Water',
    'Paper',
    'IT Equipment',
    'Office Supplies'
  ];

  const highPriority = missingMetrics.filter(m =>
    lawFirmPriorities.some(priority =>
      m.category?.toLowerCase().includes(priority.toLowerCase()) ||
      m.name?.toLowerCase().includes(priority.toLowerCase())
    )
  );

  console.log(`Found ${highPriority.length} high-priority metrics not being tracked:\n`);

  highPriority.slice(0, 15).forEach((m, i) => {
    console.log(`${i + 1}. ${m.name}`);
    console.log(`   Category: ${m.category} | Scope: ${m.scope.replace('scope_', 'Scope ')}`);
    console.log(`   Unit: ${m.unit}`);
    if (m.ghg_protocol_category) console.log(`   GHG Protocol: ${m.ghg_protocol_category}`);
    console.log();
  });

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 COVERAGE SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total Available Metrics: ${allMetrics?.length || 0}`);
  console.log(`Currently Tracking: ${uniqueTrackedIds.length} (${((uniqueTrackedIds.length / allMetrics.length) * 100).toFixed(1)}%)`);
  console.log(`Not Tracking: ${missingMetrics.length} (${((missingMetrics.length / allMetrics.length) * 100).toFixed(1)}%)`);
  console.log(`\nHigh Priority for Law Firms: ${highPriority.length} metrics`);
  console.log("=".repeat(70));
}

analyzeMetricCoverage().catch(console.error);
