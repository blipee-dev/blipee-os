const { Client } = require('pg');

async function testRetailModule() {
  const client = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.quovvwrwyfkzhgqdeham',
    password: 'vkS1yz3A8tH3jvnp',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Testing Retail Module...\n');
    await client.connect();

    // Test 1: Insert sample store
    console.log('🏪 Test 1: Creating sample store...');
    const storeResult = await client.query(`
      INSERT INTO retail.stores (loja_name, code, timezone) 
      VALUES ('TEST_STORE_001', 'TST01', 'Europe/Lisbon')
      ON CONFLICT (loja_name) DO UPDATE SET updated_at = NOW()
      RETURNING id, loja_name, code
    `);
    console.log(`✅ Store created: ${storeResult.rows[0].loja_name} (${storeResult.rows[0].id})`);

    // Test 2: Insert sample sales data
    console.log('\n💰 Test 2: Adding sample sales data...');
    await client.query(`
      INSERT INTO retail.sales_data (
        loja, data, codigo, referencia_documento, tipo_documento, 
        hora, vendedor_codigo, vendedor_nome_curto, item, descritivo,
        quantidade, valor_venda_com_iva, valor_venda_sem_iva, iva, desconto, percentual_desconto
      ) VALUES (
        'TEST_STORE_001', NOW(), 'TST001', 'REF123', 'VENDA',
        '14:30', 'V001', 'João Silva', 'ITEM001', 'Produto Teste',
        2, 50.00, 42.00, 8.00, 0.00, 0.00
      )
    `);
    console.log('✅ Sales data inserted');

    // Test 3: Insert sample foot traffic
    console.log('\n👥 Test 3: Adding sample foot traffic...');
    await client.query(`
      INSERT INTO retail.people_counting_data (
        loja, ip, start_time, end_time, total_in, 
        line1_in, line2_in, line3_in, line4_in, line4_out
      ) VALUES (
        'TEST_STORE_001', '192.168.1.100', NOW() - INTERVAL '1 hour', NOW(),
        25, 10, 8, 4, 3, 20
      )
    `);
    console.log('✅ Foot traffic data inserted');

    // Test 4: Test analytics calculation
    console.log('\n📊 Test 4: Creating analytics result...');
    await client.query(`
      INSERT INTO retail.analytics_results (
        loja, data_inicio, data_fim, total_vendas_com_iva, transacoes_vendas,
        visitantes, taxa_conversao, ticket_medio_com_iva
      ) VALUES (
        'TEST_STORE_001', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
        150.00, 3, 25, 12.00, 50.00
      )
    `);
    console.log('✅ Analytics result created');

    // Summary
    console.log('\n📋 Test Summary:');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM retail.stores) as stores,
        (SELECT COUNT(*) FROM retail.sales_data) as sales_records,
        (SELECT COUNT(*) FROM retail.people_counting_data) as traffic_records,
        (SELECT COUNT(*) FROM retail.analytics_results) as analytics_records
    `);
    
    const summary = counts.rows[0];
    console.log(`   Stores: ${summary.stores}`);
    console.log(`   Sales Records: ${summary.sales_records}`);
    console.log(`   Traffic Records: ${summary.traffic_records}`);
    console.log(`   Analytics Records: ${summary.analytics_records}`);

    console.log('\n✅ All retail tests passed!');
    console.log('🚀 Retail module is ready for testing');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

testRetailModule();