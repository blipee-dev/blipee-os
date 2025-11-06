'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import CustomSelect from '@/components/CustomSelect'
import styles from '../dashboard.module.css'

interface Site {
  id: string
  name: string
  location?: string
}

interface GRIFiltersProps {
  sites: Site[]
  availableYears: number[]
}

export function GRIFilters({ sites, availableYears }: GRIFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentYear = new Date().getFullYear()
  const selectedSite = searchParams.get('site') || ''
  const selectedYear = searchParams.get('year') || String(currentYear)

  const handleYearChange = (year: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (year) {
        params.set('year', year)
      } else {
        params.delete('year')
      }

      const queryString = params.toString()
      router.push(`/dashboard/gri${queryString ? `?${queryString}` : ''}`)
    })
  }

  const handleSiteChange = (site: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (site) {
        params.set('site', site)
      } else {
        params.delete('site')
      }

      const queryString = params.toString()
      router.push(`/dashboard/gri${queryString ? `?${queryString}` : ''}`)
    })
  }

  // Transform years into options format
  const yearOptions = availableYears.map(year => ({
    value: String(year),
    label: year === currentYear ? `${year} (YTD)` : String(year)
  }))

  // Transform sites into options format
  const siteOptions = [
    { value: '', label: 'All Sites' },
    ...sites.map(site => ({
      value: site.id,
      label: site.name
    }))
  ]

  return (
    <div className={styles.filters}>
      <CustomSelect
        value={selectedSite}
        onChange={handleSiteChange}
        options={siteOptions}
        className={styles.filterSelect}
      />

      <CustomSelect
        value={selectedYear}
        onChange={handleYearChange}
        options={yearOptions}
        className={styles.filterSelect}
      />
    </div>
  )
}
