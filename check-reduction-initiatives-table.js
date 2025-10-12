const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkReductionInitiativesTable() {
  console.log("🔍 Checking reduction_initiatives table...\n");

  // Try to query the table
  const { data, error } = await supabase
    .from("reduction_initiatives")
    .select("*")
    .limit(1);

  if (error) {
    console.log("❌ Error querying reduction_initiatives:");
    console.log(JSON.stringify(error, null, 2));

    if (error.code === '42P01') {
      console.log("\n⚠️  Table does not exist - migration needs to be applied");
    } else if (error.code === '42703') {
      console.log("\n⚠️  Column missing - table structure is incomplete");
    }
    return;
  }

  console.log("✅ Table exists and is queryable");
  console.log(`   Records found: ${data?.length || 0}`);

  if (data && data.length > 0) {
    console.log("\n📊 Sample record:");
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log("\n📝 Table is empty (this is normal if no initiatives have been created)");
  }
}

checkReductionInitiativesTable().catch(console.error);
