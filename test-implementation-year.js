const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://quovvwrwyfkzhgqdeham.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI"
);

async function testImplementationYear() {
  console.log("🔍 Testing implementation_year column access...\n");

  // Test 1: Simple select
  console.log("Test 1: Simple SELECT *");
  const { data: data1, error: error1 } = await supabase
    .from("reduction_initiatives")
    .select("*")
    .limit(1);

  if (error1) {
    console.log("❌ Error:", error1.message);
    console.log("   Code:", error1.code);
  } else {
    console.log("✅ Success - returned", data1?.length || 0, "rows");
  }

  // Test 2: Select specific column
  console.log("\nTest 2: SELECT implementation_year");
  const { data: data2, error: error2 } = await supabase
    .from("reduction_initiatives")
    .select("implementation_year")
    .limit(1);

  if (error2) {
    console.log("❌ Error:", error2.message);
    console.log("   Code:", error2.code);
  } else {
    console.log("✅ Success - returned", data2?.length || 0, "rows");
  }

  // Test 3: Order by implementation_year
  console.log("\nTest 3: ORDER BY implementation_year");
  const { data: data3, error: error3 } = await supabase
    .from("reduction_initiatives")
    .select("*")
    .order("implementation_year", { ascending: false })
    .limit(1);

  if (error3) {
    console.log("❌ Error:", error3.message);
    console.log("   Code:", error3.code);
    console.log("   Full error:", JSON.stringify(error3, null, 2));
  } else {
    console.log("✅ Success - returned", data3?.length || 0, "rows");
  }

  // Test 4: Filter by implementation_year
  console.log("\nTest 4: WHERE implementation_year = 2024");
  const { data: data4, error: error4 } = await supabase
    .from("reduction_initiatives")
    .select("*")
    .eq("implementation_year", 2024)
    .limit(1);

  if (error4) {
    console.log("❌ Error:", error4.message);
    console.log("   Code:", error4.code);
  } else {
    console.log("✅ Success - returned", data4?.length || 0, "rows");
  }
}

testImplementationYear().catch(console.error);
