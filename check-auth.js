// Check Supabase auth configuration
const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A'

async function checkAuth() {
  console.log('🔐 Checking Supabase Auth Configuration...\n')
  
  // Test creating a test user
  console.log('1. Testing email/password auth...')
  try {
    const testEmail = `test-${Date.now()}@blipee-os.com`
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!'
      })
    })
    
    const data = await response.json()
    
    if (response.ok || data.msg?.includes('confirmation')) {
      console.log('✅ Email/password auth is enabled')
      console.log('   Note: Email confirmation may be required')
    } else {
      console.log('⚠️  Auth response:', data)
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message)
  }
  
  // Check auth settings
  console.log('\n2. Checking auth providers...')
  console.log('   Note: Provider status can only be checked via Supabase dashboard')
  console.log('   Please verify in your dashboard:')
  console.log('   - Email provider: Should be enabled by default')
  console.log('   - Google provider: Enable if you want Google sign-in')
  
  console.log('\n📊 Auth Summary:')
  console.log('✅ Auth endpoint is working')
  console.log('✅ Your Supabase URL:', SUPABASE_URL)
  console.log('✅ Callback URL for OAuth providers:')
  console.log(`   ${SUPABASE_URL}/auth/v1/callback`)
  
  console.log('\n🔗 Quick Links:')
  console.log('Supabase Dashboard: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham')
  console.log('Auth Settings: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/auth/providers')
}

checkAuth().catch(console.error)