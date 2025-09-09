import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  
  try {
    // Get current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user already has organizations
    const { data: existingOrgs, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code !== '42501') {
      // If it's not an RLS error, return it
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // Try to verify RLS is working by attempting a simple insert with minimal data
    const testOrg = {
      name: 'Test Organization',
      slug: 'test-org-' + Date.now(),
      created_by: user.id
    };
    
    const { data: org, error: insertError } = await supabase
      .from('organizations')
      .insert(testOrg)
      .select()
      .single();
    
    if (insertError) {
      console.error('RLS test failed:', insertError);
      return NextResponse.json({ 
        error: 'RLS policies need to be updated in Supabase dashboard',
        details: insertError.message,
        hint: 'Please run the migration SQL directly in Supabase SQL editor'
      }, { status: 500 });
    }
    
    // If insert succeeded, clean up test organization
    if (org) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS policies are working correctly' 
    });
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}