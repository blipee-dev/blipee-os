import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const baselineYear = parseInt(searchParams.get('baseline_year') || '2023');
    const categoriesParam = searchParams.get('categories'); // Optional: comma-separated list

    // Build query
    let query = supabaseAdmin
      .from('category_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('baseline_year', baselineYear)
      .eq('is_active', true);

    // Filter by specific categories if provided
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(c => c.trim());
      query = query.in('category', categories);
    }

    const { data: categoryTargets, error: targetsError } = await query;

    if (targetsError) {
      console.error('Error fetching category targets:', targetsError);
      return NextResponse.json({ error: 'Failed to fetch category targets' }, { status: 500 });
    }

    return NextResponse.json({
      targets: categoryTargets || [],
      count: categoryTargets?.length || 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
