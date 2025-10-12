const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function applyMigration() {
  console.log("🔧 Applying reduction_initiatives fix migration...\n");

  const sql = fs.readFileSync(
    "supabase/migrations/20251013_fix_reduction_initiatives.sql",
    "utf8"
  );

  // Execute using raw SQL query
  const { data, error } = await supabase.rpc("exec_sql", {
    sql_query: sql,
  });

  if (error) {
    console.log("❌ Migration failed (trying alternative method):", error.message);
    console.log("\n📝 Please apply the migration manually using Supabase Dashboard:");
    console.log("   1. Go to: https://supabase.com/dashboard");
    console.log("   2. Select your project");
    console.log("   3. Go to SQL Editor");
    console.log("   4. Copy contents from: supabase/migrations/20251013_fix_reduction_initiatives.sql");
    console.log("   5. Paste and run\n");
    return;
  }

  console.log("✅ Migration applied successfully!\n");

  // Verify the fix
  console.log("🔍 Verifying implementation_year column...\n");

  const { data: testData, error: testError } = await supabase
    .from("reduction_initiatives")
    .select("*")
    .order("implementation_year", { ascending: false })
    .limit(1);

  if (testError) {
    console.log("❌ Verification failed:", testError.message);
  } else {
    console.log("✅ Verification successful - column is accessible!");
    console.log("   Returned", testData?.length || 0, "rows (empty table is expected)");
  }

  console.log("\n🎉 The reduction_initiatives API should now work correctly!");
}

applyMigration().catch(console.error);
