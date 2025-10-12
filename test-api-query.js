const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function testAPIQuery() {
  console.log("🔍 Simulating API query from /api/compliance/reduction-initiatives...\n");

  const organizationId = "22647141-2ee4-4d8d-8b47-16b0cbd830b2"; // PLMJ org

  // This is exactly what the API does
  let query = supabase
    .from('reduction_initiatives')
    .select('*')
    .eq('organization_id', organizationId)
    .order('implementation_year', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: initiatives, error } = await query;

  if (error) {
    console.log("❌ Error:", error.message);
    console.log("   Code:", error.code);
    console.log("\n⚠️  API would return error or empty array depending on error code");

    if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '42703') {
      console.log("   → Would return: []");
    } else {
      console.log("   → Would return: 500 error");
    }
  } else {
    console.log("✅ Query successful!");
    console.log("   Returned:", initiatives?.length || 0, "initiatives");
    console.log("   API would return:", JSON.stringify(initiatives || [], null, 2));
  }
}

testAPIQuery().catch(console.error);
