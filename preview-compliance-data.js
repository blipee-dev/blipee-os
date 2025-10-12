const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function previewComplianceData() {
  console.log("🔍 Preview: Compliance Data to be Populated\n");
  console.log("=" .repeat(60));

  // Get organization
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name")
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.log("No organizations found");
    return;
  }

  const orgId = orgs[0].id;
  const orgName = orgs[0].name;

  console.log(`📊 Organization: ${orgName}`);
  console.log(`🆔 ID: ${orgId}\n`);

  // Get years with data
  const { data: yearsData } = await supabase
    .from("metrics_data")
    .select("period_start")
    .eq("organization_id", orgId);

  const years = [...new Set(yearsData.map(d => new Date(d.period_start).getFullYear()))].sort();

  console.log(`📅 Years with data: ${years.join(", ")}\n`);

  // For each year, calculate what will be populated
  for (const year of years) {
    console.log(`\n📆 Year ${year}`);
    console.log("-".repeat(60));

    // Calculate emissions by scope
    const { data: metrics } = await supabase
      .from("metrics_data")
      .select("co2e_emissions, metric:metrics_catalog(scope)")
      .eq("organization_id", orgId)
      .gte("period_start", `${year}-01-01`)
      .lte("period_end", `${year}-12-31`);

    const scope1 = metrics
      ?.filter(m => m.metric?.scope === "scope_1")
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || 0;

    const scope2 = metrics
      ?.filter(m => m.metric?.scope === "scope_2")
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || 0;

    const scope3 = metrics
      ?.filter(m => m.metric?.scope === "scope_3")
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || 0;

    const total = scope1 + scope2 + scope3;

    console.log(`\n  📈 Emissions Summary:`);
    console.log(`     Scope 1: ${scope1.toFixed(2)} tCO2e`);
    console.log(`     Scope 2: ${scope2.toFixed(2)} tCO2e`);
    console.log(`     Scope 3: ${scope3.toFixed(2)} tCO2e`);
    console.log(`     Total:   ${total.toFixed(2)} tCO2e`);

    // Get scope 3 categories
    const { data: scope3Data } = await supabase
      .from("metrics_data")
      .select("metric:metrics_catalog(category, ghg_protocol_category)")
      .eq("organization_id", orgId)
      .gte("period_start", `${year}-01-01`)
      .lte("period_end", `${year}-12-31`);

    const scope3Categories = [
      ...new Set(
        scope3Data
          ?.filter(m => m.metric?.ghg_protocol_category)
          .map(m => m.metric.ghg_protocol_category)
      )
    ].sort();

    console.log(`\n  📋 Scope 3 Categories (${scope3Categories.length}):`);
    scope3Categories.forEach(cat => {
      console.log(`     • ${cat}`);
    });

    // Count data points
    const { count: dataPoints } = await supabase
      .from("metrics_data")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("period_start", `${year}-01-01`)
      .lte("period_end", `${year}-12-31`);

    console.log(`\n  📊 Data Quality:`);
    console.log(`     Data points: ${dataPoints}`);
    console.log(`     Coverage: ${scope3Categories.length}/15 Scope 3 categories`);
  }

  // Determine recommended base year
  const yearStats = await Promise.all(
    years.map(async year => {
      const { count } = await supabase
        .from("metrics_data")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("period_start", `${year}-01-01`)
        .lte("period_end", `${year}-12-31`);

      return { year, count };
    })
  );

  const recommendedBaseYear = yearStats
    .filter(y => y.count >= 50)
    .sort((a, b) => a.year - b.year)[0];

  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`📝 SUMMARY\n`);
  console.log(`   Records to create in ghg_inventory_settings: ${years.length}`);
  console.log(`   Records to create in esrs_e1_disclosures: ${years.length}`);
  console.log(`   Records to create in tcfd_disclosures: ${years.length}`);
  console.log(`\n   Recommended base year: ${recommendedBaseYear?.year || years[0]}`);
  console.log(`   Rationale: First year with ${recommendedBaseYear?.count || 0}+ data points\n`);

  console.log(`${"=".repeat(60)}`);
  console.log(`\n✅ Ready to populate! No mocked data - all from metrics_data\n`);
  console.log(`Next step: Run the migration in Supabase SQL Editor`);
  console.log(`File: supabase/migrations/20251013_populate_compliance_data.sql\n`);
}

previewComplianceData().catch(console.error);
