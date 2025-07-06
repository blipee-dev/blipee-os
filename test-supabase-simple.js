// Simple Supabase connection test using fetch
const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A'

async function testSupabase() {
  console.log('🧪 Testing Supabase Connection...\n')
  
  // Test 1: Basic API health check
  console.log('1. Testing API endpoint...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase API is reachable!')
      console.log(`   Status: ${response.status} ${response.statusText}`)
    } else {
      console.log('❌ API returned an error:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Failed to reach Supabase:', error.message)
  }

  // Test 2: Auth health check
  console.log('\n2. Testing Auth endpoint...')
  try {
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    if (authResponse.ok) {
      const data = await authResponse.json()
      console.log('✅ Auth service is healthy!')
      console.log('   Response:', JSON.stringify(data))
    } else {
      console.log('⚠️  Auth health check returned:', authResponse.status)
    }
  } catch (error) {
    console.log('❌ Auth check failed:', error.message)
  }

  // Test 3: Try to query a table (will fail if schema not set up)
  console.log('\n3. Testing database access...')
  try {
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations?select=count`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseText = await dbResponse.text()
    
    if (dbResponse.ok) {
      console.log('✅ Database query successful!')
    } else if (dbResponse.status === 404) {
      console.log('⚠️  Table not found - you need to run the schema.sql first')
    } else {
      console.log('❌ Database query failed:', dbResponse.status)
      console.log('   Response:', responseText)
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message)
  }

  console.log('\n📊 Connection Summary:')
  console.log('✅ Supabase URL:', SUPABASE_URL)
  console.log('✅ API Key: Configured (anon key)')
  console.log('\n📝 Next steps:')
  console.log('1. Go to your Supabase SQL Editor')
  console.log('2. Copy and run the contents of /supabase/schema.sql')
  console.log('3. Enable Google authentication in Auth > Providers')
  console.log('\n🎉 Your Supabase project is ready for setup!')
}

testSupabase().catch(console.error)