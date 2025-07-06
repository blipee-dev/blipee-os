// Check which tables exist in Supabase
const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A'

async function checkTables() {
  console.log('🔍 Checking Blipee OS tables in Supabase...\n')
  
  const tables = [
    'organizations',
    'buildings', 
    'devices',
    'conversations',
    'metrics',
    'user_organizations'
  ]
  
  let foundTables = 0
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        console.log(`✅ Table '${table}' exists`)
        foundTables++
      } else if (response.status === 404) {
        console.log(`❌ Table '${table}' not found`)
      } else {
        console.log(`⚠️  Table '${table}' returned status: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message)
    }
  }
  
  console.log(`\n📊 Summary: ${foundTables}/${tables.length} tables found`)
  
  if (foundTables === tables.length) {
    console.log('✅ All Blipee OS tables are set up correctly!')
  } else {
    console.log('\n⚠️  Some tables are missing. Please:')
    console.log('1. Go to https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql')
    console.log('2. Create a new query')
    console.log('3. Copy and paste the contents of /supabase/schema.sql')
    console.log('4. Click "Run"')
  }
}

checkTables().catch(console.error)