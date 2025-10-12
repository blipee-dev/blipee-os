const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function checkTableSchema() {
  console.log("🔍 Checking reduction_initiatives table schema...\n");

  // Query PostgreSQL information_schema to get actual column list
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'reduction_initiatives'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.log("❌ Error querying schema (RPC might not exist):", error.message);
    console.log("\nTrying alternative method...\n");

    // Try direct query approach
    const { data: testData, error: testError } = await supabase
      .from("reduction_initiatives")
      .select("*")
      .limit(0);

    if (testError) {
      console.log("Error details:", JSON.stringify(testError, null, 2));

      // Try to parse which column is missing from error message
      if (testError.message && testError.message.includes("column")) {
        console.log("\n📝 Column issue detected in error message");
      }
    } else {
      console.log("✅ Table query works (might be empty, which is fine)");
    }
    return;
  }

  console.log("📊 Current table schema:\n");
  data.forEach(col => {
    console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
  });

  // Check for expected columns
  const expectedColumns = [
    'id',
    'organization_id',
    'initiative_name',
    'description',
    'category',
    'reduction_tco2e',
    'cost_eur',
    'cost_savings_eur',
    'implementation_year',
    'start_date',
    'completion_date',
    'status',
    'scopes',
    'verified',
    'verification_method',
    'created_at',
    'updated_at'
  ];

  const actualColumns = data.map(d => d.column_name);
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));

  if (missingColumns.length > 0) {
    console.log("\n⚠️  Missing columns:");
    missingColumns.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log("\n✅ All expected columns present");
  }
}

checkTableSchema().catch(console.error);
