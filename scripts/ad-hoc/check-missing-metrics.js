const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkMissingMetrics() {
  console.log("🔍 Checking which metric codes exist in catalog...\n");

  const expectedCodes = [
    // Employee Commuting
    'scope3_employee_car_commute',
    'scope3_public_transport_commute',
    'scope3_bicycle_commute',
    'scope3_remote_work_days',
    // Business Travel
    'scope3_car_travel',
    'scope3_hotel_stays',
    // Paper
    'scope3_paper_cardboard_recycling',
    // Recycling
    'scope3_waste_recycled',
    'scope3_waste_composted',
    'scope3_ewaste_recycled',
    'scope3_plastic_recycling',
    'scope3_metal_recycling',
    'scope3_glass_recycling',
    'scope3_mixed_materials_recycling',
    // Already found working
    'scope3_it_equipment',
    'scope3_purchased_goods'
  ];

  for (const code of expectedCodes) {
    const { data, error } = await supabase
      .from("metrics_catalog")
      .select("id, code, name, category")
      .eq("code", code)
      .single();

    if (error || !data) {
      console.log(`❌ ${code} - NOT FOUND in catalog`);
    } else {
      console.log(`✅ ${code} - "${data.name}" (${data.category})`);
    }
  }

  console.log("\n=".repeat(70));
  console.log("🔎 Searching for similar metrics...\n");

  // Search for employee commuting related metrics
  const { data: commuting } = await supabase
    .from("metrics_catalog")
    .select("code, name, category, scope")
    .or("name.ilike.%commut%,code.ilike.%commut%,category.ilike.%commut%");

  console.log(`Employee Commuting related (${commuting?.length || 0}):`);
  commuting?.forEach(m => console.log(`   ${m.code} - ${m.name}`));

  // Search for business travel related
  const { data: travel } = await supabase
    .from("metrics_catalog")
    .select("code, name, category, scope")
    .or("name.ilike.%hotel%,name.ilike.%car%,code.ilike.%car%,category.ilike.%Business Travel%");

  console.log(`\nBusiness Travel related (${travel?.length || 0}):`);
  travel?.forEach(m => console.log(`   ${m.code} - ${m.name} (${m.category})`));

  // Search for recycling
  const { data: recycling } = await supabase
    .from("metrics_catalog")
    .select("code, name, category, scope")
    .or("name.ilike.%recycl%,code.ilike.%recycl%");

  console.log(`\nRecycling related (${recycling?.length || 0}):`);
  recycling?.forEach(m => console.log(`   ${m.code} - ${m.name}`));
}

checkMissingMetrics().catch(console.error);
