'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/v2/client'

export interface IndustrySector {
  id: string
  sector_name: string
  sector_category: string
  gri_standard: string | null
}

async function fetchIndustrySectors(): Promise<IndustrySector[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industry_sectors')
    .select('id, sector_name, sector_category, gri_standard')
    .order('sector_name', { ascending: true })

  if (error) {
    console.error('[useIndustrySectors] Error loading sectors:', error)
    throw error
  }

  return data || []
}

export function useIndustrySectors() {
  const query = useQuery({
    queryKey: ['industry-sectors'],
    queryFn: fetchIndustrySectors,
    staleTime: 30 * 60 * 1000, // 30 minutes - sectors don't change often
  })

  return {
    sectors: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  }
}
