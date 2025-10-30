#!/bin/bash

# Wrapper para psql que usa Supabase Client
# Como não temos IPv6, usamos a API do Supabase

if [ -z "$1" ]; then
  echo "📊 Supabase psql Wrapper"
  echo ""
  echo "Uso:"
  echo "  ./psql-wrapper.sh 'SELECT * FROM organizations LIMIT 5'"
  echo "  echo 'SELECT version();' | ./psql-wrapper.sh"
  echo ""
  echo "⚠️  Nota: Este wrapper é necessário porque sua rede não tem IPv6"
  echo "   Alternativas:"
  echo "   1. Usar Shared Pooler (grátis) - veja dashboard"
  echo "   2. Ativar IPv4 dedicado (\$4/mês)"
  exit 0
fi

# Load env vars
export $(grep -v '^#' .env.local | xargs)

# Execute via Node.js
node -e "
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const sql = process.argv[1];

  // Simple SELECT query handler
  if (sql.toLowerCase().includes('select')) {
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (tableMatch) {
      const table = tableMatch[1];
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error('❌', error.message);
        process.exit(1);
      }
      console.table(data);
    }
  } else {
    console.log('⚠️  Este wrapper suporta apenas SELECT queries');
    console.log('Para queries complexas, use o Shared Pooler ou ative IPv4');
  }
})();
" "$1"
