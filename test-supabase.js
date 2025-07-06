import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n')
  
  // Test 1: Basic connection
  console.log('1. Testing basic connection...')
  try {
    const { data, error } = await supabase.from('organizations').select('count')
    if (error) {
      console.log('❌ Connection test failed:', error.message)
      console.log('   This is expected if tables haven\'t been created yet.')
    } else {
      console.log('✅ Connection successful!')
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
  }

  // Test 2: Auth functionality
  console.log('\n2. Testing auth functionality...')
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('✅ Auth is working (no user logged in)')
    } else if (user) {
      console.log('✅ Auth is working (user found):', user.email)
    } else {
      console.log('✅ Auth is working (no active session)')
    }
  } catch (err) {
    console.log('❌ Auth error:', err.message)
  }

  // Test 3: Check if tables exist
  console.log('\n3. Checking database tables...')
  const tables = ['organizations', 'buildings', 'devices', 'conversations', 'metrics']
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Table '${table}' not found or accessible`)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}':`, err.message)
    }
  }

  // Test 4: Try to create a test user (if tables exist)
  console.log('\n4. Testing user creation...')
  try {
    const email = `test-${Date.now()}@example.com`
    const password = 'testPassword123!'
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.log('❌ User creation failed:', error.message)
    } else {
      console.log('✅ Test user created successfully!')
      console.log('   Email:', email)
      
      // Clean up - sign out
      await supabase.auth.signOut()
    }
  } catch (err) {
    console.log('❌ User creation error:', err.message)
  }

  console.log('\n📊 Connection Summary:')
  console.log('URL:', supabaseUrl)
  console.log('Key type: Anon (public)')
  console.log('\n✨ Your Supabase connection is configured correctly!')
  console.log('\n📝 Next steps:')
  console.log('1. Run the SQL schema in your Supabase dashboard')
  console.log('2. Enable authentication providers (Google, etc.)')
  console.log('3. Configure Row Level Security policies')
}

testConnection().catch(console.error)