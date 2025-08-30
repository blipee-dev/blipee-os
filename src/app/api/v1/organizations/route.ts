import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withAPIGateway, createSuccessResponse, createPaginatedResponse, APIGatewayContext } from '@/lib/api/gateway/middleware';

export const GET = withAPIGateway(async (_request: NextRequest, context: APIGatewayContext) => {
  const supabase = await createServerSupabaseClient();
  
  // Get pagination parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
  const offset = (page - 1) * limit;

  // Get organizations accessible by this API key
  const { data: organizations, error, count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .eq('id', context.apiKey.organization_id)
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  // Return paginated response
  return createPaginatedResponse(
    organizations || [],
    {
      page,
      limit,
      total: count || 0,
    },
    context.version
  );
});

export const POST = withAPIGateway(async (_request: NextRequest, context: APIGatewayContext) => {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return createSuccessResponse(
      { error: 'Name is required' },
      context.version
    );
  }

  // Create organization (simplified - in real app would have more validation)
  const { data: organization, error } = await supabase
    .from('organizations')
    .insert({
      name: body.name,
      industry: body.industry || 'Other',
      size: body.size || 'small',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return createSuccessResponse(organization, context.version);
});