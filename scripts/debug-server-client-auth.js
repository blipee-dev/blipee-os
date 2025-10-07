const { createServerClient } = require('@supabase/ssr');
require('dotenv').config({ path: '.env.local' });

(async () => {
  console.log('=== TESTING SERVER CLIENT WITH MOCK COOKIES ===\n');

  // Simulate what the API route does
  const mockCookies = new Map();

  // Create server client like the API does
  const serverClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return mockCookies.get(name);
        },
        set(name, value) {
          mockCookies.set(name, value);
        },
        remove(name) {
          mockCookies.delete(name);
        },
      },
    }
  );

  console.log('1️⃣ Testing auth.getUser() without session cookies:');
  const { data: userData, error: userError } = await serverClient.auth.getUser();
  console.log('   User:', userData?.user?.id || 'null');
  console.log('   Error:', userError?.message || 'none');

  console.log('\n2️⃣ Testing metrics_data query without auth:');
  const { data: metricsData, error: metricsError } = await serverClient
    .from('metrics_data')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .limit(5);

  console.log('   Rows returned:', metricsData?.length || 0);
  console.log('   Error:', metricsError?.message || 'none');

  console.log('\n📝 CONCLUSION:');
  console.log('   The server client needs valid session cookies from the authenticated user.');
  console.log('   In API routes, Next.js automatically passes cookies from the request.');
  console.log('   The RLS policy checks auth.uid() which comes from the session cookie.');
})();
