#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjkyMjIsImV4cCI6MjA2NzQwNTIyMn0._w2Ofr8W1Oouka_pNbFbdkzDX9Rge_MoY5JQq3zcz6A';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Simple query
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (error) throw error;

    console.log('✅ Connection successful!');
    console.log(`📊 Found ${data.length} organizations:`);
    data.forEach(org => {
      console.log(`   - ${org.name} (${org.id})`);
    });

    // Test 2: Check database via RPC
    const { data: dbInfo, error: dbError } = await supabase.rpc('version');

    if (!dbError && dbInfo) {
      console.log('\n📦 Database version:', dbInfo);
    }

    console.log('\n✅ All tests passed!');

  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
