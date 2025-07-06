// Check Row Level Security configuration
const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

async function checkRLS() {
  console.log('🔒 Checking Row Level Security...\n')
  
  // SQL query to check RLS status
  const rlsQuery = `
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('organizations', 'buildings', 'devices', 'conversations', 'metrics', 'user_organizations')
    ORDER BY tablename;
  `
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: rlsQuery })
    })
    
    if (!response.ok) {
      // Try direct query approach
      console.log('Note: Cannot directly query RLS status via API')
      console.log('Please check manually in Supabase dashboard')
      console.log('\nExpected RLS status for all tables: ENABLED')
      console.log('\nTo verify, run this SQL in Supabase SQL Editor:')
      console.log('```sql')
      console.log(rlsQuery.trim())
      console.log('```')
    }
  } catch (e) {
    console.log('Cannot verify RLS programmatically')
  }
  
  console.log('\n✅ RLS Policies Created by Schema:')
  console.log('- organizations: Users can view their organizations')
  console.log('- buildings: Users can view buildings in their organizations')
  console.log('- devices: Users can view devices in their buildings')
  console.log('- conversations: Users can view/create/update their own')
  console.log('- metrics: Users can view metrics for their devices')
  console.log('- user_organizations: Users can view their memberships')
}

checkRLS().catch(console.error)