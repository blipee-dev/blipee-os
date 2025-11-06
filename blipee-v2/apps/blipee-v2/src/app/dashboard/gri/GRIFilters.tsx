'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
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
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
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
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
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
    <>
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

      {isPending && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(74, 222, 128, 0.2)',
                borderTop: '4px solid rgb(74, 222, 128)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: '#fff', margin: 0 }}>Loading data...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
