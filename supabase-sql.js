#!/usr/bin/env node

/**
 * Supabase SQL CLI Wrapper
 *
 * Como o psql não funciona sem IPv6, este script usa a API do Supabase
 * para executar queries SQL diretamente.
 *
 * Uso:
 *   node supabase-sql.js "SELECT * FROM organizations LIMIT 5"
 *   echo "SELECT version();" | node supabase-sql.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  try {
    // Remove trailing semicolons and whitespace
    sql = sql.trim().replace(/;+$/, '');

    // Use RPC to execute raw SQL via a postgres function
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.error('⚠️  RPC method not available, trying alternative...');

      // Try to parse and execute common queries
      if (sql.toLowerCase().startsWith('select')) {
        // Extract table name (basic parsing)
        const tableMatch = sql.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const table = tableMatch[1];
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select('*');

          if (tableError) throw tableError;

          console.log(JSON.stringify(tableData, null, 2));
          return;
        }
      }

      throw error;
    }

    // Format output
    if (Array.isArray(data)) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }

  } catch (err) {
    console.error('❌ SQL Error:', err.message);
    if (err.details) console.error('Details:', err.details);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  }
}

// Main
(async () => {
  let sql;

  // Check if SQL is piped via stdin or passed as argument
  if (process.argv[2]) {
    sql = process.argv.slice(2).join(' ');
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    sql = Buffer.concat(chunks).toString('utf8');
  }

  if (!sql || !sql.trim()) {
    console.log(`
📊 Supabase SQL Wrapper

Uso:
  node supabase-sql.js "SELECT * FROM organizations LIMIT 5"
  echo "SELECT version();" | node supabase-sql.js

Exemplos:
  node supabase-sql.js "SELECT id, name FROM organizations"
  node supabase-sql.js "SELECT COUNT(*) FROM metrics_data"

⚠️  Nota: Este wrapper usa a API Supabase porque psql
   não funciona sem IPv6 público.
    `);
    process.exit(0);
  }

  await executeSQL(sql);
})();
