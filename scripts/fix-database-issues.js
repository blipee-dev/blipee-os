const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function fixDatabaseIssues() {
  console.log('🔧 Starting Database Fix Process...\n');
  
  try {
    // Step 1: Read and apply the migration for missing tables
    console.log('📝 Step 1: Creating missing tables...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112_create_missing_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Note: Supabase JS client doesn't support raw SQL execution
    // We'll need to use the Supabase dashboard or CLI for this
    console.log('⚠️  Please run the following migration in Supabase SQL Editor:');
    console.log('   Path: supabase/migrations/20250112_create_missing_tables.sql');
    console.log('   Or run: npx supabase db push\n');
    
    // Step 2: Enable RLS on existing tables
    console.log('🔒 Step 2: Enabling RLS on existing tables...');
    
    const existingTables = ['organizations', 'conversations', 'messages', 'organization_members', 'user_profiles', 'energy_consumption'];
    
    const rlsQueries = existingTables.map(table => `
-- Enable RLS on ${table}
ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for ${table}
CREATE POLICY "Users can view ${table} in their organization" ON public.${table}
  FOR SELECT USING (
    CASE 
      WHEN '${table}' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert ${table} in their organization" ON public.${table}
  FOR INSERT WITH CHECK (
    CASE 
      WHEN '${table}' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN '${table}' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    `).join('\n');
    
    // Write RLS script
    const rlsScriptPath = path.join(__dirname, 'enable_rls_policies.sql');
    await fs.writeFile(rlsScriptPath, rlsQueries);
    
    console.log('✅ RLS script created at:', rlsScriptPath);
    console.log('⚠️  Please run this script in Supabase SQL Editor\n');
    
    // Step 3: Provide summary and next steps
    console.log('📋 Summary of Required Actions:');
    console.log('1. Run the migration script to create missing tables');
    console.log('2. Run the RLS script to secure existing tables');
    console.log('3. Test the application to ensure everything works\n');
    
    console.log('🚀 Quick Commands:');
    console.log('   npx supabase db push                    # Apply all migrations');
    console.log('   npx supabase db reset                   # Reset database (WARNING: deletes all data)');
    console.log('   node scripts/check-db-tables.js         # Verify tables after migration\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixDatabaseIssues();