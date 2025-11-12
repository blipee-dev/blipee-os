const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying initiatives migration...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/20250111_create_initiatives_system.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('⚠️  RPC method not available, trying direct execution...\n')

      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`📝 Executing ${statements.length} SQL statements...\n`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.length > 0) {
          console.log(`   [${i + 1}/${statements.length}] Executing...`)

          // Use the REST API to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement + ';' })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.log(`   ❌ Error: ${errorText}`)
          } else {
            console.log(`   ✅ Success`)
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!')
      console.log(data)
    }
  } catch (err) {
    console.error('❌ Error applying migration:', err.message)
    console.log('\n💡 Please apply the migration manually using the Supabase dashboard or psql')
  }
}

applyMigration().catch(console.error)
