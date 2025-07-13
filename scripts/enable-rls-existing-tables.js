const { Client } = require('pg');

async function enableRLSOnExistingTables() {
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const existingTables = [
      'organizations',
      'conversations',
      'messages',
      'organization_members',
      'user_profiles',
      'energy_consumption'
    ];

    console.log('🔒 Enabling RLS on existing tables...\n');

    for (const table of existingTables) {
      try {
        // Enable RLS
        await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`✅ ${table} - RLS enabled`);
        
        // Create basic SELECT policy
        const policyName = `${table}_select_policy`;
        const policySQL = table === 'user_profiles' 
          ? `CREATE POLICY "${policyName}" ON public.${table} FOR SELECT USING (id = auth.uid())`
          : `CREATE POLICY "${policyName}" ON public.${table} FOR SELECT USING (
              organization_id IN (
                SELECT organization_id FROM public.organization_members 
                WHERE user_id = auth.uid()
              )
            )`;
        
        try {
          await client.query(policySQL);
          console.log(`  → Policy created for SELECT`);
        } catch (policyError) {
          if (policyError.message.includes('already exists')) {
            console.log(`  → Policy already exists`);
          } else {
            console.log(`  → Policy error: ${policyError.message}`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️  ${table} - ${error.message}`);
      }
    }

    // Check final RLS status
    console.log('\n📊 Final RLS Status Check:');
    const rlsResult = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (${existingTables.map(t => `'${t}'`).join(',')})
      ORDER BY tablename
    `);
    
    rlsResult.rows.forEach(row => {
      console.log(`  ${row.tablename}: RLS ${row.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
    });

    console.log('\n✅ Security setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

enableRLSOnExistingTables();