const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function analyzeMetricsCatalog() {
  console.log("=== METRICS CATALOG ANALYSIS ===\n");

  // Get total count
  const { count: totalCount } = await supabase
    .from("metrics_catalog")
    .select("*", { count: "exact", head: true });

  console.log("Total metrics in catalog:", totalCount);

  // Get breakdown by scope
  const { data: scopeData } = await supabase
    .from("metrics_catalog")
    .select("scope");

  const scopeCounts = {};
  if (scopeData) {
    scopeData.forEach(({ scope }) => {
      scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
    });
  }

  console.log("Breakdown by scope:", scopeCounts);

  // Get breakdown by category
  const { data: categoryData } = await supabase
    .from("metrics_catalog")
    .select("category, scope")
    .order("category");

  const categories = {};
  if (categoryData) {
    categoryData.forEach(({ category, scope }) => {
      if (!categories[category]) {
        categories[category] = { scope_1: 0, scope_2: 0, scope_3: 0, total: 0 };
      }
      categories[category][scope] = (categories[category][scope] || 0) + 1;
      categories[category].total += 1;
    });
  }

  console.log("\nBreakdown by category:");
  Object.entries(categories).forEach(([cat, counts]) => {
    console.log(`  ${cat}: ${counts.total} metrics (S1:${counts.scope_1} S2:${counts.scope_2} S3:${counts.scope_3})`);
  });

  // Sample metrics
  const { data: samples } = await supabase
    .from("metrics_catalog")
    .select("code, name, scope, category, unit")
    .limit(10);

  console.log("\nSample metrics:");
  if (samples) {
    samples.forEach(m => {
      console.log(`  - [${m.scope}] ${m.name} (${m.code}) - unit: ${m.unit}`);
    });
  }
}

async function analyzeMetricsData() {
  console.log("\n\n=== METRICS DATA ANALYSIS ===\n");

  // Get organization ID
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name")
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.log("No organizations found");
    return;
  }

  const orgId = orgs[0].id;
  console.log(`Analyzing data for: ${orgs[0].name} (${orgId})\n`);

  // Get total data points
  const { count: dataCount } = await supabase
    .from("metrics_data")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  console.log("Total data points:", dataCount);

  // Get data by year
  const { data: yearData } = await supabase
    .from("metrics_data")
    .select("period_start, co2e_emissions")
    .eq("organization_id", orgId);

  const yearCounts = {};
  const yearEmissions = {};
  if (yearData) {
    yearData.forEach(({ period_start, co2e_emissions }) => {
      const year = new Date(period_start).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      yearEmissions[year] = (yearEmissions[year] || 0) + (parseFloat(co2e_emissions) || 0);
    });
  }

  console.log("\nData points by year:");
  Object.entries(yearCounts).sort().forEach(([year, count]) => {
    const emissions = yearEmissions[year];
    console.log(`  ${year}: ${count} data points, ${emissions.toFixed(2)} tCO2e`);
  });

  // Get data by scope (via metrics_catalog join)
  const { data: scopeBreakdown } = await supabase
    .from("metrics_data")
    .select(`
      co2e_emissions,
      metric:metrics_catalog(scope)
    `)
    .eq("organization_id", orgId);

  const scopeEmissions = { scope_1: 0, scope_2: 0, scope_3: 0 };
  if (scopeBreakdown) {
    scopeBreakdown.forEach(({ co2e_emissions, metric }) => {
      if (metric && metric.scope) {
        scopeEmissions[metric.scope] = (scopeEmissions[metric.scope] || 0) + (parseFloat(co2e_emissions) || 0);
      }
    });
  }

  console.log("\nEmissions by scope:");
  Object.entries(scopeEmissions).forEach(([scope, emissions]) => {
    console.log(`  ${scope}: ${emissions.toFixed(2)} tCO2e`);
  });

  // Sample data
  const { data: dataSamples } = await supabase
    .from("metrics_data")
    .select(`
      period_start,
      value,
      unit,
      co2e_emissions,
      metric:metrics_catalog(name, scope, category)
    `)
    .eq("organization_id", orgId)
    .order("period_start", { ascending: false })
    .limit(5);

  console.log("\nRecent data samples:");
  if (dataSamples) {
    dataSamples.forEach(d => {
      const metricName = d.metric?.name || "Unknown";
      const scope = d.metric?.scope || "?";
      console.log(`  - ${d.period_start}: [${scope}] ${metricName} = ${d.value} ${d.unit} (${d.co2e_emissions?.toFixed(2) || 0} tCO2e)`);
    });
  }
}

async function analyzeComplianceTables() {
  console.log("\n\n=== COMPLIANCE TABLES ANALYSIS ===\n");

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

  // Check ghg_inventory_settings
  const { data: ghgSettings, count: ghgCount } = await supabase
    .from("ghg_inventory_settings")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId);

  console.log("GHG Inventory Settings:", ghgCount || 0, "records");
  if (ghgSettings && ghgSettings.length > 0) {
    const latest = ghgSettings[0];
    console.log(`  - Base Year: ${latest.base_year || "Not set"}`);
    console.log(`  - Consolidation: ${latest.consolidation_approach || "Not set"}`);
    console.log(`  - Reporting Year: ${latest.reporting_year || "Not set"}`);
  }

  // Check organization_inventory_settings
  const { data: invSettings, count: invCount } = await supabase
    .from("organization_inventory_settings")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId);

  console.log("\nOrganization Inventory Settings:", invCount || 0, "records");
  if (invSettings && invSettings.length > 0) {
    const latest = invSettings[0];
    console.log(`  - Base Year: ${latest.base_year || "Not set"}`);
    console.log(`  - Consolidation: ${latest.consolidation_approach || "Not set"}`);
    console.log(`  - GWP Version: ${latest.gwp_version || "Not set"}`);
  }

  // Check esrs_e1_disclosures
  const { count: esrsCount } = await supabase
    .from("esrs_e1_disclosures")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  console.log("\nESRS E1 Disclosures:", esrsCount || 0, "records");

  // Check tcfd_disclosures
  const { count: tcfdCount } = await supabase
    .from("tcfd_disclosures")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  console.log("TCFD Disclosures:", tcfdCount || 0, "records");

  // Check scope2_instruments
  const { count: scope2Count } = await supabase
    .from("scope2_instruments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  console.log("Scope 2 Instruments (RECs, GOs, etc.):", scope2Count || 0, "records");

  // Check emissions_adjustments
  const { count: adjustCount } = await supabase
    .from("emissions_adjustments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  console.log("Emissions Adjustments (offsets, removals):", adjustCount || 0, "records");
}

async function main() {
  try {
    await analyzeMetricsCatalog();
    await analyzeMetricsData();
    await analyzeComplianceTables();

    console.log("\n\n=== ANALYSIS COMPLETE ===\n");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
