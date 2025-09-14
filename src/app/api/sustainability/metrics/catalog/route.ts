import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const category = searchParams.get('category');

  try {
    let query = supabase
      .from('metrics_catalog')
      .select('*')
      .eq('is_active', true)
      .order('scope, category, name');

    if (scope) {
      query = query.eq('scope', scope);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group metrics by scope and category for easier UI consumption
    const groupedMetrics = {
      scope_1: {},
      scope_2: {},
      scope_3: {}
    };

    data?.forEach(metric => {
      if (!groupedMetrics[metric.scope][metric.category]) {
        groupedMetrics[metric.scope][metric.category] = [];
      }
      groupedMetrics[metric.scope][metric.category].push(metric);
    });

    return NextResponse.json({
      metrics: data,
      grouped: groupedMetrics,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching metrics catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics catalog' },
      { status: 500 }
    );
  }
}