import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiKeyService } from '@/lib/api/gateway/api-key-service';
import { APIKeyCreate } from '@/types/api-gateway';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, _error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    if (!member) {
      return NextResponse.json(
        { _error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!['account_owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { _error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // List API keys
    const keys = await apiKeyService.listAPIKeys(member.organization_id);
    
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return NextResponse.json(
      { _error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, _error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    if (!member) {
      return NextResponse.json(
        { _error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!['account_owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { _error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const data: APIKeyCreate = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { _error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create API key
    const keyWithSecret = await apiKeyService.createAPIKey(
      member.organization_id,
      data,
      user.id
    );
    
    return NextResponse.json({ 
      key: keyWithSecret,
      message: 'Save this API key securely. You won\'t be able to see it again.' 
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { _error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}