'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/v2/client'
import { useUserOrganization } from '@/hooks/useUserOrganization'
import styles from '@/styles/settings-layout.module.css'
import CustomSelect from '@/components/CustomSelect'
import FormActions from '@/components/FormActions'
import ConfirmDialog from '@/components/ConfirmDialog'
import CustomCheckbox from '@/components/CustomCheckbox'
import { getCountryCode } from '@/lib/countryMapping'

interface Site {
  id: string
  name: string
  organization_id: string
  type: string | null
  location: string | null
  address: any
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  total_area_sqm: number | null
  total_employees: number | null
  floors: number | null
  floor_details: any
  timezone: string | null
  status: string | null
  devices_count: number | null
  metadata: any
  created_at: string
  organizations?: {
    name: string
  }
}

interface SiteDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  site: Site | null
  isSuperAdmin: boolean
  onUpdate: () => void
}

// Helper function to check if JSON value is empty
function isEmptyJSON(value: any): boolean {
  if (!value) return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

// Helper function to render floor details
function renderFloorDetails(floorDetails: any, t: any) {
  if (isEmptyJSON(floorDetails)) return <span>{t('notSpecified')}</span>

  if (Array.isArray(floorDetails) && floorDetails.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {floorDetails.map((floor, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--green)' }}>
              {t('facilityFloorDisplay').replace('{number}', floor.floor !== undefined ? floor.floor : index + 1)}
            </span>
            {floor.area_sqm && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {floor.area_sqm.toLocaleString()} m²
              </span>
            )}
            {floor.name && (
              <span style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                {floor.name}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return <span style={{ fontFamily: 'monospace', fontSize: '0.813rem' }}>{JSON.stringify(floorDetails, null, 2)}</span>
}

// Helper function to generate operating hours summary
function getOperatingHoursSummary(
  hours: Array<{ day: string; dayLabel: string; openTime: string; closeTime: string; isClosed: boolean }>,
  t: any
): string {
  const openDays = hours.filter(h => !h.isClosed)
  const closedDays = hours.filter(h => h.isClosed)

  if (openDays.length === 0) return t('operatingHoursClosedAll')
  if (closedDays.length === 0) {
    const firstDay = openDays[0]
    return `${firstDay.openTime}-${firstDay.closeTime} ${t('operatingHoursAllDays')}`
  }

  // Check if weekdays have same hours
  const weekdays = hours.filter(h => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(h.day))
  const weekdaysOpen = weekdays.filter(h => !h.isClosed)
  const weekend = hours.filter(h => ['saturday', 'sunday'].includes(h.day))
  const weekendClosed = weekend.every(h => h.isClosed)

  if (weekdaysOpen.length === 5 && weekendClosed) {
    const monday = hours.find(h => h.day === 'monday')
    if (monday && !monday.isClosed) {
      return `${t('operatingHoursMonFri')}: ${monday.openTime}-${monday.closeTime}`
    }
  }

  return t('operatingHoursDaysOpen').replace('{count}', openDays.length.toString())
}

// Calculate operating hours metrics
function calculateOperatingHoursMetrics(
  hours: Array<{ day: string; dayLabel: string; openTime: string; closeTime: string; isClosed: boolean }>,
  totalEmployees: number | null,
  publicHolidaysPerYear: number = 10
) {
  // Calculate daily hours for each day
  const dailyHours = hours.map(day => {
    if (day.isClosed) return 0

    const [openHour, openMin] = day.openTime.split(':').map(Number)
    const [closeHour, closeMin] = day.closeTime.split(':').map(Number)

    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    return (closeMinutes - openMinutes) / 60
  })

  // Weekly totals
  const weeklyOperatingHours = dailyHours.reduce((sum, hours) => sum + hours, 0)
  const openDaysPerWeek = hours.filter(h => !h.isClosed).length

  // Annual calculations
  const weeksPerYear = 52
  const annualOperatingHours = weeklyOperatingHours * weeksPerYear
  const annualOperatingDays = openDaysPerWeek * weeksPerYear - publicHolidaysPerYear

  // Employee-hours calculations
  const employees = totalEmployees || 0
  const weeklyEmployeeHours = weeklyOperatingHours * employees
  const annualEmployeeHours = annualOperatingHours * employees

  // Adjusted for public holidays
  const adjustedAnnualEmployeeHours = employees > 0
    ? (annualOperatingDays * (weeklyOperatingHours / openDaysPerWeek)) * employees
    : 0

  return {
    dailyHours,
    weeklyOperatingHours,
    openDaysPerWeek,
    annualOperatingHours,
    annualOperatingDays,
    weeklyEmployeeHours,
    annualEmployeeHours,
    adjustedAnnualEmployeeHours,
    publicHolidaysPerYear,
  }
}

export function SiteDetailsModal({
  isOpen,
  onClose,
  site,
  isSuperAdmin,
  onUpdate,
}: SiteDetailsModalProps) {
  const t = useTranslations('settings.modals.siteDetails')

  // Get user organization for creating new sites
  const { organization } = useUserOrganization()

  // Determine if we're in create mode (site is null)
  const isCreating = !site

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState<Partial<Site>>({})

  // Separate state for address fields
  const [addressFields, setAddressFields] = useState({
    street: '',
    number: '',
    postal_code: '',
    city: '',
    country: '',
  })

  // Tooltip position state
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)

  // Address autocomplete state
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([])
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const streetInputRef = React.useRef<HTMLInputElement>(null)

  // Facility details state (areas, departments, floors, etc.)
  const [facilityAreas, setFacilityAreas] = useState<Array<{
    name: string
    area_sqm: number | null
    employees: number | null
  }>>([])

  // Operating hours state - weekly schedule
  const [operatingHours, setOperatingHours] = useState<Array<{
    day: string
    dayLabel: string
    openTime: string
    closeTime: string
    isClosed: boolean
  }>>([
    { day: 'monday', dayLabel: t('dayMonday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
    { day: 'tuesday', dayLabel: t('dayTuesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
    { day: 'wednesday', dayLabel: t('dayWednesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
    { day: 'thursday', dayLabel: t('dayThursday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
    { day: 'friday', dayLabel: t('dayFriday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
    { day: 'saturday', dayLabel: t('daySaturday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
    { day: 'sunday', dayLabel: t('daySunday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
  ])

  // Operating hours popup state
  const [showOperatingHoursModal, setShowOperatingHoursModal] = useState(false)

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)

  // Define steps based on user role
  const getSteps = () => {
    const baseSteps = [
      { number: 1, title: t('step1Title'), icon: t('step1Icon') },
      { number: 2, title: t('step2Title'), icon: t('step2Icon') },
    ]

    if (isSuperAdmin) {
      baseSteps.push({ number: 3, title: t('step3Title'), icon: t('step3Icon') })
    }

    return baseSteps
  }

  const steps = getSteps()
  const totalSteps = steps.length

  // Effects
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'

      // If creating new site, automatically enter edit mode
      if (isCreating) {
        setIsEditing(true)
        // Initialize with default status
        setFormData({ status: 'active' })
      }
    } else {
      setIsEditing(false)
      setFormData({}) // Reset form data when modal closes
      setCurrentStep(1) // Reset to first step
      setAddressFields({ street: '', number: '', postal_code: '', city: '', country: '' })
      setFacilityAreas([])
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isCreating, onClose])

  // Mount state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update suggestions dropdown position on scroll/resize
  useEffect(() => {
    function updatePosition() {
      if (streetInputRef.current && showStreetSuggestions) {
        const rect = streetInputRef.current.getBoundingClientRect()
        setSuggestionsPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
    }

    if (showStreetSuggestions) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [showStreetSuggestions])

  // Address autocomplete functions
  const searchAddressByPostalCode = async (postalCode: string, country: string = '') => {
    if (!postalCode || postalCode.length < 4) {
      console.log('Postal code too short:', postalCode)
      return
    }

    console.log('Searching for postal code:', postalCode, 'in country:', country)
    setIsLoadingAddress(true)
    try {
      // Use free-form query for better results (especially for Portugal)
      // Construct a query like "1069-214, Portugal"
      const countryCode = country ? getCountryCode(country) : ''
      const query = country ? `${postalCode}, ${country}` : postalCode

      const params = new URLSearchParams({
        q: query,
      })

      if (countryCode) {
        console.log('Country code:', country, '->', countryCode)
        params.set('countrycode', countryCode)
      }

      const url = `/api/geocode?${params.toString()}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('Received data:', data)

      if (data && data.length > 0) {
        // First try to find exact postal code match
        const exactMatches = data.filter((result: any) => {
          const resultPostalCode = result.address?.postcode || ''
          const normalizedSearch = postalCode.replace(/\s/g, '').toUpperCase()
          const normalizedResult = resultPostalCode.replace(/\s/g, '').toUpperCase()
          return normalizedResult === normalizedSearch
        })

        console.log('Exact matches:', exactMatches)

        // If no exact match, use the first result from the same city
        const result = exactMatches.length > 0 ? exactMatches[0] : data[0]
        const address = result.address || {}
        const isExactMatch = exactMatches.length > 0

        console.log('Using address:', address, 'Exact match:', isExactMatch)

        // Extract all address components
        const resultPostalCode = address.postcode || postalCode
        const street = address.road || ''
        const houseNumber = address.house_number || ''
        const streetAddress = houseNumber ? `${street} ${houseNumber}` : street

        setAddressFields(prev => ({
          ...prev,
          street: streetAddress || prev.street,
          postalCode: postalCode, // Keep the user's postal code
          city: address.city || address.town || address.village || prev.city,
          country: address.country || prev.country,
        }))

        setFormData(prev => ({
          ...prev,
          street_address: streetAddress || prev.street_address,
          postal_code: postalCode, // Keep the user's postal code
          city: address.city || address.town || address.village || prev.city,
          country: address.country || prev.country,
          latitude: parseFloat(result.lat) || prev.latitude,
          longitude: parseFloat(result.lon) || prev.longitude,
        }))

        if (isExactMatch) {
          toast.success(t('toastAddressFound'))
        } else {
          toast.success(t('toastCityFound'))
        }
      } else {
        console.log('No results found')
        toast.error(t('toastErrorAddress'))
      }
    } catch (error) {
      console.error('Error fetching postal code data:', error)
      toast.error(t('toastErrorFetch'))
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const searchStreetAddress = async (street: string, city: string = '', country: string = '') => {
    if (!street || street.length < 3) {
      setStreetSuggestions([])
      return
    }

    try {
      // Use our API route instead of calling Nominatim directly
      const params = new URLSearchParams({
        street: street,
      })

      if (city) {
        params.set('city', city)
      }

      if (country) {
        params.set('countrycode', getCountryCode(country))
      }

      const response = await fetch(`/api/geocode?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setStreetSuggestions(data || [])
    } catch (error) {
      console.error('Error fetching street suggestions:', error)
      setStreetSuggestions([])
    }
  }

  // Debounce helper
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const debouncedSearchStreet = React.useMemo(
    () => debounce(searchStreetAddress, 500),
    []
  )

  // Handlers
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleEdit = () => {
    if (!site) return

    const newFormData = {
      name: site.name,
      type: site.type,
      location: site.location,
      address: site.address,
      city: site.city,
      country: site.country,
      latitude: site.latitude,
      longitude: site.longitude,
      total_area_sqm: site.total_area_sqm,
      total_employees: site.total_employees,
      floors: site.floors,
      floor_details: site.floor_details,
      timezone: site.timezone,
      status: site.status,
      devices_count: site.devices_count,
      metadata: site.metadata,
    }

    // Populate address fields from JSON (prioritize address object, fallback to site fields)
    if (site.address && typeof site.address === 'object') {
      setAddressFields({
        street: site.address.street || '',
        number: site.address.number || '',
        postal_code: site.address.postal_code || '',
        city: site.address.city || site.city || '',
        country: site.address.country || site.country || '',
      })
    } else {
      setAddressFields({
        street: '',
        number: '',
        postal_code: '',
        city: site.city || '',
        country: site.country || '',
      })
    }

    // Populate facility areas from floor_details
    if (site.floor_details && Array.isArray(site.floor_details)) {
      setFacilityAreas(
        site.floor_details.map((area: any) => ({
          name: area.name || `${t('facilityFloorDisplay').replace('{number}', area.floor || '')}`,
          area_sqm: area.area_sqm || null,
          employees: area.employees || null,
        }))
      )
    } else {
      setFacilityAreas([])
    }

    // Populate operating hours from metadata
    if (site.metadata && typeof site.metadata === 'object' && site.metadata.operating_hours) {
      if (Array.isArray(site.metadata.operating_hours)) {
        // New format: array of day schedules
        setOperatingHours(site.metadata.operating_hours)
      } else {
        // Old format: reset to default
        setOperatingHours([
          { day: 'monday', dayLabel: t('dayMonday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
          { day: 'tuesday', dayLabel: t('dayTuesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
          { day: 'wednesday', dayLabel: t('dayWednesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
          { day: 'thursday', dayLabel: t('dayThursday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
          { day: 'friday', dayLabel: t('dayFriday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
          { day: 'saturday', dayLabel: t('daySaturday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
          { day: 'sunday', dayLabel: t('daySunday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
        ])
      }
    } else {
      // No existing data: use defaults
      setOperatingHours([
        { day: 'monday', dayLabel: t('dayMonday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
        { day: 'tuesday', dayLabel: t('dayTuesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
        { day: 'wednesday', dayLabel: t('dayWednesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
        { day: 'thursday', dayLabel: t('dayThursday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
        { day: 'friday', dayLabel: t('dayFriday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
        { day: 'saturday', dayLabel: t('daySaturday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
        { day: 'sunday', dayLabel: t('daySunday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
      ])
    }

    setFormData(newFormData)
    setIsEditing(true)
  }

  const handleSave = async () => {
    // Validation: when creating, need site name and organization
    if (isCreating) {
      if (!formData.name) {
        toast.error(t('toastErrorName'))
        return
      }
      if (!organization) {
        toast.error(t('toastErrorOrg'))
        return
      }
    }

    setSaving(true)
    try {
      // Construct address JSON from individual fields
      const addressJSON = {
        street: addressFields.street,
        number: addressFields.number,
        postal_code: addressFields.postal_code,
        city: addressFields.city,
        country: addressFields.country,
      }

      // Construct facility details (floor_details) from facilityAreas
      const facilityDetailsJSON = facilityAreas.length > 0
        ? facilityAreas.map((area, index) => ({
            floor: index + 1,
            name: area.name,
            area_sqm: area.area_sqm,
            employees: area.employees,
          }))
        : null

      // Construct metadata with operating hours
      const existingMetadata = (formData.metadata && typeof formData.metadata === 'object')
        ? formData.metadata
        : {}

      const metadataJSON = {
        ...existingMetadata,
        operating_hours: operatingHours || null,
      }

      // Create full location string for location column
      const locationParts = []
      if (addressFields.street) locationParts.push(addressFields.street)
      if (addressFields.number) locationParts.push(addressFields.number)
      if (addressFields.postal_code) locationParts.push(addressFields.postal_code)
      if (addressFields.city) locationParts.push(addressFields.city)
      if (addressFields.country) locationParts.push(addressFields.country)
      const locationString = locationParts.join(', ')

      // Create payload with constructed fields
      // Remove address-related fields from formData as they go into address JSON
      const { postal_code, city, country, latitude, longitude, ...restFormData } = formData

      const payload = {
        ...restFormData,
        address: addressJSON,
        location: locationString || null, // Full address as string
        latitude: latitude,
        longitude: longitude,
        city: city, // Keep city as it's a separate column
        country: country, // Keep country as it's a separate column
        floor_details: facilityDetailsJSON,
        metadata: metadataJSON,
      }

      const supabase = createClient()

      if (isCreating) {
        // CREATE new site
        const { error } = await supabase
          .from('sites')
          .insert({
            ...payload,
            organization_id: organization!.id,
          })

        if (error) throw error
        toast.success(t('toastCreateSuccess'))
      } else {
        // UPDATE existing site
        const { error } = await supabase
          .from('sites')
          .update(payload)
          .eq('id', site!.id)

        if (error) throw error
        toast.success(t('toastUpdateSuccess'))
      }

      setIsEditing(false)
      onClose() // Close modal after successful creation/update
      onUpdate() // Refresh the sites list
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} site:`, error)
      toast.error(isCreating ? t('toastCreateError') : t('toastUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!site) return

    setShowDeleteDialog(false)
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', site.id)

      if (error) throw error

      toast.success(t('toastDeleteSuccess'))
      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error deleting site:', error)
      toast.error(t('toastDeleteError'))
    } finally {
      setDeleting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Basic Information & Address
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Basic Info Section */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {t('sectionBasic')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem 1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelSiteName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('placeholderSiteName')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.name}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelType')}</label>
                  {isEditing ? (
                    <CustomSelect
                      value={formData.type || ''}
                      onChange={(value) => setFormData({ ...formData, type: value })}
                      options={[
                        { value: '', label: t('selectType') },
                        { value: 'Office', label: t('typeOffice') },
                        { value: 'Factory', label: t('typeFactory') },
                        { value: 'Warehouse', label: t('typeWarehouse') },
                        { value: 'Retail', label: t('typeRetail') },
                        { value: 'Data Center', label: t('typeDataCenter') },
                        { value: 'Other', label: t('typeOther') },
                      ]}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.type || t('notSpecified')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {t('sectionAddress')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem 1rem' }}>
                <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <label className={styles.label}>
                    {t('labelStreet')}
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                      {t('helpCitySearch')}
                    </span>
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        ref={streetInputRef}
                        type="text"
                        className={styles.input}
                        value={addressFields.street}
                        onChange={(e) => {
                          const newStreet = e.target.value
                          setAddressFields({ ...addressFields, street: newStreet })
                          setShowStreetSuggestions(true)
                          debouncedSearchStreet(newStreet, addressFields.city, addressFields.country)
                        }}
                        onFocus={() => {
                          if (streetSuggestions.length > 0) {
                            setShowStreetSuggestions(true)
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on suggestion
                          setTimeout(() => setShowStreetSuggestions(false), 200)
                        }}
                        placeholder={t('placeholderStreet')}
                        autoComplete="off"
                      />
                      {mounted && typeof document !== 'undefined' && showStreetSuggestions && streetSuggestions.length > 0 && suggestionsPosition && createPortal(
                        <div
                          style={{
                            position: 'absolute',
                            top: `${suggestionsPosition.top}px`,
                            left: `${suggestionsPosition.left}px`,
                            width: `${suggestionsPosition.width}px`,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 999999,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {streetSuggestions.map((suggestion, index) => {
                            const addr = suggestion.address || {}
                            const displayName = [
                              addr.road || addr.street,
                              addr.house_number,
                              addr.city || addr.town || addr.village,
                              addr.country,
                            ]
                              .filter(Boolean)
                              .join(', ')

                            return (
                              <div
                                key={index}
                                onMouseDown={(e) => {
                                  e.preventDefault() // Prevent input blur
                                  const street = addr.road || addr.street || ''
                                  const houseNumber = addr.house_number || ''

                                  console.log('Filling address fields:', {
                                    street: street,
                                    number: houseNumber,
                                    postal_code: addr.postcode,
                                    city: addr.city || addr.town || addr.village,
                                    country: addr.country,
                                  })
                                  console.log('Full address object from Google:', addr)

                                  // Fill only street name, keep number separate
                                  const currentNumber = addressFields.number || ''

                                  setAddressFields({
                                    street: street,
                                    number: currentNumber,
                                    postal_code: addr.postcode || addressFields.postal_code,
                                    city: addr.city || addr.town || addr.village || addressFields.city,
                                    country: addr.country || addressFields.country,
                                  })

                                  // Update formData with coordinates and other fields
                                  setFormData(prev => ({
                                    ...prev,
                                    postal_code: addr.postcode || prev.postal_code,
                                    city: addr.city || addr.town || addr.village || prev.city,
                                    country: addr.country || prev.country,
                                    latitude: parseFloat(suggestion.lat) || prev.latitude,
                                    longitude: parseFloat(suggestion.lon) || prev.longitude,
                                  }))
                                  setStreetSuggestions([])
                                  setShowStreetSuggestions(false)
                                  toast.success(t('toastStreetSelected'))
                                }}
                                style={{
                                  padding: '0.75rem 1rem',
                                  cursor: 'pointer',
                                  borderBottom:
                                    index < streetSuggestions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                  transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                  {addr.road || addr.street || t('unknownStreet')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                  {addr.city || addr.town || addr.village}, {addr.country}
                                  {addr.postcode && ` • ${addr.postcode}`}
                                </div>
                              </div>
                            )
                          })}
                        </div>,
                        document.body
                      )}
                    </>
                  ) : (
                    <div style={readOnlyStyle}>{site?.address?.street || t('notSpecified')}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelNumber')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={addressFields.number}
                      onChange={(e) => {
                        const newNumber = e.target.value
                        setAddressFields({ ...addressFields, number: newNumber })
                      }}
                      placeholder={t('placeholderNumber')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.address?.number || t('notSpecified')}</div>
                  )}
                </div>

              </div>

              {/* Postal Code, City, Country row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem 1rem', marginTop: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelPostalCode')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={addressFields.postal_code}
                      onChange={(e) => {
                        const newPostalCode = e.target.value
                        setAddressFields({ ...addressFields, postal_code: newPostalCode })
                        setFormData({ ...formData, postal_code: newPostalCode })
                      }}
                      placeholder={t('placeholderPostalCode')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.address?.postal_code || t('notSpecified')}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelCity')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={addressFields.city}
                      onChange={(e) => {
                        const newCity = e.target.value
                        setAddressFields({ ...addressFields, city: newCity })
                        setFormData({ ...formData, city: newCity })
                      }}
                      placeholder={t('placeholderCity')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.address?.city || site?.city || t('notSpecified')}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelCountry')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={addressFields.country}
                      onChange={(e) => {
                        const newCountry = e.target.value
                        setAddressFields({ ...addressFields, country: newCountry })
                        setFormData({ ...formData, country: newCountry })
                      }}
                      placeholder={t('placeholderCountry')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.address?.country || site?.country || t('notSpecified')}</div>
                  )}
                </div>
              </div>

              {/* Latitude, Longitude, Timezone row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem 1rem', marginTop: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelLatitude')}</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.000001"
                      className={styles.input}
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
                      placeholder={t('placeholderLatitude')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.latitude || t('notSpecified')}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelLongitude')}</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.000001"
                      className={styles.input}
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
                      placeholder={t('placeholderLongitude')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.longitude || t('notSpecified')}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('labelTimezone')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.timezone || ''}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder={t('placeholderTimezone')}
                    />
                  ) : (
                    <div style={readOnlyStyle}>{site?.timezone || t('notSpecified')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        // Size & Structure
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Basic Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem 1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelTotalArea')}</label>
                {isEditing ? (
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.total_area_sqm || ''}
                    onChange={(e) => setFormData({ ...formData, total_area_sqm: parseFloat(e.target.value) || null })}
                    placeholder={t('placeholderArea')}
                  />
                ) : (
                  <div style={readOnlyStyle}>
                    {site?.total_area_sqm ? `${site.total_area_sqm.toLocaleString()} m²` : t('notSpecified')}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelTotalEmployees')}</label>
                {isEditing ? (
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.total_employees || ''}
                    onChange={(e) => setFormData({ ...formData, total_employees: parseInt(e.target.value) || null })}
                    placeholder={t('placeholderEmployees')}
                  />
                ) : (
                  <div style={readOnlyStyle}>
                    {site?.total_employees ? site.total_employees.toLocaleString() : t('notSpecified')}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('labelFloors')}</label>
                {isEditing ? (
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.floors || ''}
                    onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) || null })}
                    placeholder={t('placeholderFloors')}
                  />
                ) : (
                  <div style={readOnlyStyle}>{site?.floors || t('notSpecified')}</div>
                )}
              </div>
            </div>

            {/* Operating Hours - Compact Button with Tooltip */}
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <label className={styles.label} style={{ margin: 0 }}>{t('labelOperatingHours')}</label>
                {(() => {
                  // Get operating hours from input or use default business hours
                  let hoursToUse = isEditing ? operatingHours : (
                    site?.metadata && typeof site.metadata === 'object' && Array.isArray(site.metadata.operating_hours)
                      ? site.metadata.operating_hours
                      : [
                          { day: 'monday', dayLabel: t('dayMonday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
                          { day: 'tuesday', dayLabel: t('dayTuesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
                          { day: 'wednesday', dayLabel: t('dayWednesday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
                          { day: 'thursday', dayLabel: t('dayThursday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
                          { day: 'friday', dayLabel: t('dayFriday'), openTime: '09:00', closeTime: '18:00', isClosed: false },
                          { day: 'saturday', dayLabel: t('daySaturday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
                          { day: 'sunday', dayLabel: t('daySunday'), openTime: '09:00', closeTime: '18:00', isClosed: true },
                        ]
                  )

                  const employeesToUse = isEditing ? (formData.total_employees || null) : (site?.total_employees || null)
                  const metrics = calculateOperatingHoursMetrics(hoursToUse, employeesToUse)

                  // Don't show tooltip if no operating hours
                  if (metrics.weeklyOperatingHours === 0) return null

                  return (
                    <div
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'help',
                      }}
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector('[data-tooltip-trigger]') as HTMLElement
                        const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement

                        if (icon && tooltip) {
                          // First make tooltip visible to calculate its size
                          tooltip.style.visibility = 'hidden'
                          tooltip.style.opacity = '0'
                          tooltip.style.display = 'block'

                          // Get measurements
                          const iconRect = icon.getBoundingClientRect()
                          const tooltipWidth = tooltip.offsetWidth
                          const tooltipHeight = tooltip.offsetHeight

                          // Calculate position (centered above the icon)
                          const left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2
                          const top = iconRect.top - tooltipHeight - 12

                          // Set position and make visible
                          setTooltipPosition({ top, left })
                          tooltip.style.visibility = 'visible'
                          tooltip.style.opacity = '1'
                        }
                      }}
                      onMouseLeave={(e) => {
                        const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement
                        if (tooltip) {
                          tooltip.style.opacity = '0'
                          // Wait for fade out transition before hiding
                          setTimeout(() => {
                            tooltip.style.display = 'none'
                          }, 200)
                        }
                        setTooltipPosition(null)
                      }}
                    >
                      <div
                        data-tooltip-trigger
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: 'var(--green)',
                          fontFamily: 'serif',
                        }}
                      >
                        i
                      </div>

                      {/* Tooltip with all metrics */}
                      <div
                        data-tooltip
                        style={{
                          position: 'fixed',
                          top: tooltipPosition ? `${tooltipPosition.top}px` : '-9999px',
                          left: tooltipPosition ? `${tooltipPosition.left}px` : '-9999px',
                          display: 'none',
                          background: 'rgba(15, 23, 42, 0.98)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '12px',
                          padding: '1rem',
                          minWidth: '320px',
                          maxWidth: '500px',
                          fontSize: '0.75rem',
                          lineHeight: '1.5',
                          color: 'var(--text-secondary)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                          zIndex: 10000,
                          opacity: 0,
                          pointerEvents: 'none',
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        {/* Header */}
                        <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                          {t('operatingHoursTooltipTitle')}
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {employeesToUse
                            ? t('operatingHoursTooltipDescWithEmployees')
                            : t('operatingHoursTooltipDescNoEmployees')}
                        </div>

                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: employeesToUse ? '1fr 1fr' : '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                          {/* Weekly Operating Hours */}
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.375rem' }}>
                              {t('operatingHoursWeekly')}
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--green)' }}>
                              {metrics.weeklyOperatingHours.toFixed(1)}h
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                              {metrics.openDaysPerWeek} {t('operatingHoursDaysWeek')}
                            </div>
                          </div>

                          {/* Annual Operating Hours */}
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.375rem' }}>
                              {t('operatingHoursAnnual')}
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {metrics.annualOperatingHours.toLocaleString()}h
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                              {metrics.annualOperatingDays} {t('operatingHoursDaysYear')}
                            </div>
                          </div>

                          {/* Employee-Hours (only if employees specified) */}
                          {employeesToUse && employeesToUse > 0 && (
                            <>
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                              }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.375rem' }}>
                                  {t('operatingHoursWeeklyEmployee')}
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--green)' }}>
                                  {metrics.weeklyEmployeeHours.toLocaleString()}h
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                  {employeesToUse} {t('operatingHoursEmployees')}
                                </div>
                              </div>

                              <div style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                              }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.375rem' }}>
                                  {t('operatingHoursAnnualEmployee')}
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {metrics.adjustedAnnualEmployeeHours.toLocaleString('en-US', { maximumFractionDigits: 0 })}h
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                  {t('operatingHoursHolidays').replace('{count}', metrics.publicHolidaysPerYear.toString())}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Key Information */}
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          color: 'var(--text-tertiary)',
                        }}>
                          {employeesToUse && employeesToUse > 0 ? (
                            <>
                              <div style={{ marginBottom: '0.375rem' }}>
                                {t('operatingHoursInfo')}
                              </div>
                              <div>
                                {t('operatingHoursHolidayInfo').replace('{count}', metrics.publicHolidaysPerYear.toString())}
                              </div>
                            </>
                          ) : (
                            <div>
                              {t('operatingHoursHolidayInfo').replace('{count}', metrics.publicHolidaysPerYear.toString())}
                            </div>
                          )}
                        </div>

                        {/* Triangle pointer */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid rgba(16, 185, 129, 0.3)',
                        }} />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowOperatingHoursModal(true)}
                  className={styles.input}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>
                    {getOperatingHoursSummary(operatingHours, t)}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </button>
              ) : (
                <div style={readOnlyStyle}>
                  {(site?.metadata && typeof site.metadata === 'object' && site.metadata.operating_hours) ? (
                    Array.isArray(site.metadata.operating_hours) ? (
                      getOperatingHoursSummary(site.metadata.operating_hours, t)
                    ) : (
                      JSON.stringify(site.metadata.operating_hours)
                    )
                  ) : (
                    t('notSpecified')
                  )}
                </div>
              )}
            </div>

            {/* Facility Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className={styles.label} style={{ marginBottom: 0 }}>
                  {t('labelFacilityDetails')}
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    {t('helpFacilityDetails')}
                  </span>
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setFacilityAreas([...facilityAreas, { name: '', area_sqm: null, employees: null }])}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      background: 'var(--gradient-primary)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('facilityButtonAdd')}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {facilityAreas.length === 0 ? (
                    <div
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'rgba(16, 185, 129, 0.05)',
                        border: '1px dashed rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <p style={{ margin: 0 }}>{t('facilityEmptyTitle')}</p>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.813rem' }}>
                        {t('facilityEmptyDescription')}
                      </p>
                    </div>
                  ) : (
                    facilityAreas.map((area, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr auto',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'rgba(16, 185, 129, 0.03)',
                          border: '1px solid rgba(16, 185, 129, 0.15)',
                          borderRadius: '12px',
                          alignItems: 'end',
                        }}
                      >
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.label} style={{ fontSize: '0.75rem' }}>
                            {t('facilityFieldName')}
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            value={area.name}
                            onChange={(e) => {
                              const newAreas = [...facilityAreas]
                              newAreas[index].name = e.target.value
                              setFacilityAreas(newAreas)
                            }}
                            placeholder={t('facilityPlaceholderName')}
                            style={{ fontSize: '0.813rem' }}
                          />
                        </div>

                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.label} style={{ fontSize: '0.75rem' }}>{t('facilityFieldArea')}</label>
                          <input
                            type="number"
                            className={styles.input}
                            value={area.area_sqm || ''}
                            onChange={(e) => {
                              const newAreas = [...facilityAreas]
                              newAreas[index].area_sqm = parseFloat(e.target.value) || null
                              setFacilityAreas(newAreas)
                            }}
                            placeholder={t('facilityPlaceholder')}
                            style={{ fontSize: '0.813rem' }}
                          />
                        </div>

                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label className={styles.label} style={{ fontSize: '0.75rem' }}>{t('facilityFieldEmployees')}</label>
                          <input
                            type="number"
                            className={styles.input}
                            value={area.employees || ''}
                            onChange={(e) => {
                              const newAreas = [...facilityAreas]
                              newAreas[index].employees = parseInt(e.target.value) || null
                              setFacilityAreas(newAreas)
                            }}
                            placeholder={t('facilityPlaceholder')}
                            style={{ fontSize: '0.813rem' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newAreas = facilityAreas.filter((_, i) => i !== index)
                            setFacilityAreas(newAreas)
                          }}
                          style={{
                            padding: '0.65rem',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: '1px solid var(--red)',
                            color: 'var(--red)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={t('facilityButtonRemove')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div style={readOnlyStyle}>{renderFloorDetails(site?.floor_details, t)}</div>
              )}
            </div>
          </div>
        )

      case 3:
        // Status (Super Admin Only)
        if (!isSuperAdmin) return null
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('labelStatus')}</label>
              {isEditing ? (
                <>
                  <CustomSelect
                    value={formData.status || 'active'}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    options={[
                      { value: 'active', label: t('statusActive') },
                      { value: 'inactive', label: t('statusInactive') },
                    ]}
                  />
                  <div style={{ fontSize: '0.813rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                    {t('helpStatus')}
                  </div>
                </>
              ) : (
                <div style={readOnlyStyle}>
                  <span
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      backgroundColor: site.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: site.status === 'active' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${site.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {site.status === 'active' ? t('statusBadgeActive') : t('statusBadgeInactive')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Computed values
  // Allow editing if super admin or if user has access to this site
  // (RLS policies will protect against unauthorized edits)
  const canEdit = true // For now, allow all authenticated users to edit

  const readOnlyStyle: React.CSSProperties = {
    padding: '0.65rem 0.875rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'default',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
  }

  // Early return
  if (!isOpen) return null

  // Render
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '2rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div
          className={styles.section}
          style={{
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '100%',
            maxWidth: '1400px',
            padding: '2rem',
            margin: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 className={styles.sectionTitle}>
                {isCreating ? t('titleCreate') : isEditing ? t('titleEdit') : t('titleView')}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {!isCreating && (
                  <span
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      backgroundColor: site?.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: site?.status === 'active' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${site?.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {site?.status === 'active' ? t('statusBadgeActive') : t('statusBadgeInactive')}
                  </span>
                )}

                {isSuperAdmin && (
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: '#8b5cf6',
                      color: 'white',
                    }}
                  >
                    {t('superAdminAccess')}
                  </span>
                )}

                {site?.organizations && (
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                    }}
                  >
                    {site.organizations.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                lineHeight: 1,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              ×
            </button>
          </div>

          {/* Step Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '2rem',
            marginBottom: '2rem',
          }}>
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  maxWidth: '150px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    background: currentStep === step.number
                      ? 'var(--gradient-primary)'
                      : currentStep > step.number
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: currentStep >= step.number ? '#ffffff' : 'var(--text-tertiary)',
                    border: currentStep === step.number ? '2px solid var(--green)' : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {step.icon}
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: currentStep === step.number ? 600 : 400,
                    color: currentStep === step.number ? 'var(--green)' : 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div style={{ minHeight: '300px', padding: '1rem 0' }}>
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {isEditing ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--glass-border)',
            }}>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: currentStep === 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  opacity: currentStep === 1 ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                {t('buttonPrevious')}
              </button>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('buttonCancel')}
                </button>

                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNextStep}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'var(--gradient-primary)',
                      border: 'none',
                      color: 'white',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {t('buttonNext')}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      background: 'var(--gradient-primary)',
                      border: 'none',
                      color: 'white',
                      opacity: isSaving ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isSaving ? t('buttonSaving') : t('buttonSaveChanges')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--glass-border)',
            }}>
              {/* Step navigation in view mode */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: currentStep === 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    opacity: currentStep === 1 ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('buttonPrevious')}
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStep === totalSteps}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: currentStep === totalSteps ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: currentStep === totalSteps ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    opacity: currentStep === totalSteps ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('buttonNext')}
                </button>
              </div>

              {/* Edit and Delete buttons for users with permission (not shown in create mode) */}
              {canEdit && !isCreating && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: 'var(--red)',
                      border: 'none',
                      color: 'white',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isDeleting ? t('buttonDeleting') : t('buttonDelete')}
                  </button>
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: 'var(--gradient-primary)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {t('buttonEdit')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Non-editable notice */}
          {!canEdit && !isEditing && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              {t('noticeViewOnly')}
            </div>
          )}

        </div>
      </div>

      {/* Operating Hours Popup Modal */}
      {showOperatingHoursModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOperatingHoursModal(false)
            }
          }}
        >
          <div
            className={styles.section}
            style={{
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('operatingHoursModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShowOperatingHoursModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  const monday = operatingHours.find(h => h.day === 'monday')
                  if (monday) {
                    setOperatingHours(operatingHours.map(h => ({
                      ...h,
                      openTime: monday.openTime,
                      closeTime: monday.closeTime,
                      isClosed: monday.isClosed,
                    })))
                  }
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('operatingHoursButtonCopyAll')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const monday = operatingHours.find(h => h.day === 'monday')
                  if (monday) {
                    setOperatingHours(operatingHours.map(h => {
                      if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(h.day)) {
                        return {
                          ...h,
                          openTime: monday.openTime,
                          closeTime: monday.closeTime,
                          isClosed: monday.isClosed,
                        }
                      }
                      return h
                    }))
                  }
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('operatingHoursButtonCopyWeekdays')}
              </button>
            </div>

            {/* Weekly Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {operatingHours.map((daySchedule, index) => (
                <div
                  key={daySchedule.day}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 1fr auto',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: daySchedule.isClosed
                      ? 'rgba(239, 68, 68, 0.05)'
                      : 'rgba(16, 185, 129, 0.03)',
                    border: `1px solid ${daySchedule.isClosed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                    borderRadius: '8px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {daySchedule.dayLabel}
                  </div>

                  <input
                    type="time"
                    className={styles.input}
                    value={daySchedule.openTime}
                    onChange={(e) => {
                      const newHours = [...operatingHours]
                      newHours[index].openTime = e.target.value
                      setOperatingHours(newHours)
                    }}
                    disabled={daySchedule.isClosed}
                    style={{
                      fontSize: '0.813rem',
                      opacity: daySchedule.isClosed ? 0.5 : 1,
                      padding: '0.5rem',
                    }}
                  />

                  <input
                    type="time"
                    className={styles.input}
                    value={daySchedule.closeTime}
                    onChange={(e) => {
                      const newHours = [...operatingHours]
                      newHours[index].closeTime = e.target.value
                      setOperatingHours(newHours)
                    }}
                    disabled={daySchedule.isClosed}
                    style={{
                      fontSize: '0.813rem',
                      opacity: daySchedule.isClosed ? 0.5 : 1,
                      padding: '0.5rem',
                    }}
                  />

                  <CustomCheckbox
                    checked={daySchedule.isClosed}
                    onChange={(checked) => {
                      const newHours = [...operatingHours]
                      newHours[index].isClosed = checked
                      setOperatingHours(newHours)
                    }}
                    label={t('checkboxClosed')}
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                onClick={() => setShowOperatingHoursModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {t('buttonDone')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={t('dialogDeleteTitle')}
        message={t('dialogDeleteMessage').replace('{name}', site?.name || '')}
        confirmText={t('dialogDeleteConfirm')}
        cancelText={t('dialogDeleteCancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
        requireTextConfirmation={true}
        confirmationText={t('dialogDeleteConfirmText')}
      />
    </>
  )
}
