import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250113_enterprise_audit_events.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }, { status: 500 });
  }
}