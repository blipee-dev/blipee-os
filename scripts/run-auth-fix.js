const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role key
const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function runFix() {
  console.log('\n=== Running Auth Fix ===\n');
  console.log('Since we cannot run SQL directly through the JS client,');
  console.log('please follow these steps:\n');
  
  console.log('1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
  console.log('2. Copy and paste the following SQL:\n');
  
  const sqlPath = path.join(__dirname, 'fix-auth-signup-error.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('--- START SQL ---');
  console.log(sql);
  console.log('--- END SQL ---\n');
  
  console.log('3. Click "Run" to execute the SQL');
  console.log('4. After running, test signup at: https://organic-fortnight-wrgwv7qg6wxv366v-3000.app.github.dev\n');
  
  // Let's also create a simpler version that just adds the missing columns
  const simpleFix = `
-- Quick fix for auth signup error
-- Just add the missing columns

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('metadata', 'preferred_language', 'timezone');
`;

  fs.writeFileSync(path.join(__dirname, 'quick-auth-fix.sql'), simpleFix);
  console.log('Alternative: A simpler fix has been saved to scripts/quick-auth-fix.sql');
  console.log('You can try running that first if the full fix has issues.\n');
}

runFix();