<<<<<<< HEAD
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const orgData = await request.json();
    
    // Generate a unique slug
    let slug = orgData.slug || orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if slug exists and make it unique if needed
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (existingOrg) {
      // Add a random suffix to make it unique
      const suffix = Math.random().toString(36).substring(2, 8);
      slug = `${slug}-${suffix}`;
    }
    
    // First, try to create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        ...orgData,
        slug,
        created_by: user.id // Track who created it
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('Organization creation error:', orgError);
      
      // If RLS policy error, try a different approach
      if (orgError.code === '42501') {
        // Create organization with a simpler approach
        const { data: simpleOrg, error: simpleError } = await supabase
          .from('organizations')
          .insert({
            name: orgData.name,
            slug,
            created_by: user.id
          })
          .select()
          .single();
          
        if (simpleError) {
          return NextResponse.json(
            { error: `Failed to create organization: ${simpleError.message}` },
            { status: 400 }
          );
        }
        
        // Update with additional data
        const { data: updatedOrg, error: updateError } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', simpleOrg.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Update error:', updateError);
        }
        
        // Add user as owner
        const { error: memberError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: user.id,
            organization_id: simpleOrg.id,
            role: 'account_owner'
          });
          
        if (memberError) {
          console.error('Member addition error:', memberError);
        }
        
        return NextResponse.json({ 
          success: true, 
          organization: updatedOrg || simpleOrg 
        });
      }
      
      return NextResponse.json(
        { error: `Failed to create organization: ${orgError.message}` },
        { status: 400 }
      );
    }
    
    // Add current user as account owner
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'account_owner'
      })
      .select()
      .single();
    
    if (userOrgError) {
      console.error('Error adding user to organization:', userOrgError);
      // Return error so user knows something went wrong
      return NextResponse.json(
        { error: `Organization created but failed to add user: ${userOrgError.message}` },
        { status: 400 }
      );
    }
    
    console.log('Successfully added user to organization:', userOrgData);
    
    return NextResponse.json({ 
      success: true, 
      organization: org 
    });
    
  } catch (error: any) {
    console.error('Error in create organization API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
||||||| 2cca3736
=======
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const orgData = await request.json();
    
    // First, try to create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        ...orgData,
        created_by: user.id // Track who created it
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('Organization creation error:', orgError);
      
      // If RLS policy error, try a different approach
      if (orgError.code === '42501') {
        // Create organization with a simpler approach
        const { data: simpleOrg, error: simpleError } = await supabase
          .from('organizations')
          .insert({
            name: orgData.name,
            slug: orgData.slug || orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            created_by: user.id
          })
          .select()
          .single();
          
        if (simpleError) {
          return NextResponse.json(
            { error: `Failed to create organization: ${simpleError.message}` },
            { status: 400 }
          );
        }
        
        // Update with additional data
        const { data: updatedOrg, error: updateError } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', simpleOrg.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Update error:', updateError);
        }
        
        // Add user as owner
        const { error: memberError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: user.id,
            organization_id: simpleOrg.id,
            role: 'account_owner'
          });
          
        if (memberError) {
          console.error('Member addition error:', memberError);
        }
        
        return NextResponse.json({ 
          success: true, 
          organization: updatedOrg || simpleOrg 
        });
      }
      
      return NextResponse.json(
        { error: `Failed to create organization: ${orgError.message}` },
        { status: 400 }
      );
    }
    
    // Add current user as account owner
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'account_owner'
      });
    
    if (userOrgError) {
      console.error('Error adding user to organization:', userOrgError);
      // Don't fail the whole operation if this fails
    }
    
    return NextResponse.json({ 
      success: true, 
      organization: org 
    });
    
  } catch (error: any) {
    console.error('Error in create organization API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
>>>>>>> origin/main
