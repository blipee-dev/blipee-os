import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const framework = searchParams.get('framework'); // 'gri', 'esrs', 'tcfd', 'ifrs'
    const search = searchParams.get('search');

    // Fetch framework mappings
    let query = supabase
      .from('framework_mappings')
      .select('*')
      .order('datapoint_code', { ascending: true });

    // Filter by framework if specified
    if (framework) {
      switch (framework.toLowerCase()) {
        case 'gri':
          query = query.not('gri_codes', 'is', null);
          break;
        case 'esrs':
          query = query.not('esrs_codes', 'is', null);
          break;
        case 'tcfd':
          query = query.not('tcfd_references', 'is', null);
          break;
        case 'ifrs':
          query = query.not('ifrs_s2_codes', 'is', null);
          break;
      }
    }

    // Search across description and codes
    if (search) {
      query = query.or(`description.ilike.%${search}%,datapoint_code.ilike.%${search}%`);
    }

    const { data: mappings, error: mappingsError } = await query;

    if (mappingsError) {
      console.error('Error fetching framework mappings:', mappingsError);
      return NextResponse.json({ error: 'Failed to fetch framework mappings' }, { status: 500 });
    }

    return NextResponse.json(mappings || []);
  } catch (error) {
    console.error('Error in framework-mappings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Insert framework mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('framework_mappings')
      .insert(body)
      .select()
      .single();

    if (mappingError) {
      console.error('Error creating framework mapping:', mappingError);
      return NextResponse.json({ error: 'Failed to create framework mapping' }, { status: 500 });
    }

    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Error in framework-mappings POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
