const { Client } = require('pg');

async function checkRetailTables() {
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking for Retail Module Tables...\n');
    await client.connect();
    
    // Get all tables in the database
    const allTablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📋 All tables in database:');
    allTablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check specifically for retail-related tables
    const retailKeywords = ['retail', 'store', 'pos', 'product', 'inventory', 'customer', 'sale', 'transaction', 'order'];
    const retailTables = allTablesResult.rows.filter(row => 
      retailKeywords.some(keyword => row.tablename.toLowerCase().includes(keyword))
    );
    
    console.log('\n🛍️ Retail-related tables found:');
    if (retailTables.length > 0) {
      retailTables.forEach(row => {
        console.log(`  ✅ ${row.tablename}`);
      });
    } else {
      console.log('  ❌ No retail-specific tables found');
    }
    
    // Check for any tables that might be retail-related based on common patterns
    console.log('\n📊 Checking for potential retail patterns:');
    const patterns = [
      { pattern: 'retail_%', description: 'Tables starting with retail_' },
      { pattern: '%_products', description: 'Product tables' },
      { pattern: '%_stores', description: 'Store tables' },
      { pattern: '%_transactions', description: 'Transaction tables' },
      { pattern: '%_inventory', description: 'Inventory tables' },
      { pattern: '%_sales', description: 'Sales tables' }
    ];
    
    for (const { pattern, description } of patterns) {
      const result = await client.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE $1`,
        [pattern]
      );
      
      if (result.rows.length > 0) {
        console.log(`  ✅ ${description}: ${result.rows.map(r => r.tablename).join(', ')}`);
      } else {
        console.log(`  ❌ ${description}: None found`);
      }
    }
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`  Total tables: ${allTablesResult.rows.length}`);
    console.log(`  Retail tables: ${retailTables.length}`);
    console.log(`  Retail module: ${retailTables.length > 0 ? '✅ Appears to be installed' : '❌ Not found'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Check complete');
  }
}

checkRetailTables();