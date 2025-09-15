require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
);

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115_fix_rls_recursion.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by statements (simple approach - split by semicolons not within strings)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Since we can't execute raw SQL directly, let's use a workaround
    // We'll need to use the SQL editor in Supabase dashboard
    console.log('⚠️  Please execute the following SQL in your Supabase SQL editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('2. Copy and paste the following SQL:\n');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));
    console.log('\n3. Click "Run" to execute the migration\n');

    // Test if the current policies are causing issues
    console.log('🔍 Testing current state...\n');

    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'pedro@blipee.com',
      password: 'Blipee2025!Secure#'
    });

    if (user) {
      console.log('✅ Authentication successful');

      // Try to fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile fetch error:', profileError.message);
      } else {
        console.log('✅ Profile fetched successfully');
      }

      // Try to fetch memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

      if (membershipError) {
        console.log('❌ Membership fetch error:', membershipError.message);
      } else {
        console.log('✅ Memberships fetched:', memberships?.length || 0);
      }

      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyRLSFix();