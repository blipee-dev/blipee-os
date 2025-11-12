/**
 * Organization Context
 * Manages the currently active organization across the app
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Organization } from '@/hooks/useUserOrganizations'

interface OrganizationContextType {
  activeOrganization: Organization | null
  setActiveOrganization: (org: Organization | null) => void
  allOrganizations: Organization[]
  setAllOrganizations: (orgs: Organization[]) => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const STORAGE_KEY = 'blipee-active-organization-id'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(null)
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])

  // Load active organization from localStorage on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem(STORAGE_KEY)
    if (savedOrgId && allOrganizations.length > 0) {
      const org = allOrganizations.find((o) => o.id === savedOrgId)
      if (org) {
        setActiveOrganizationState(org)
      } else if (allOrganizations.length > 0) {
        // If saved org not found, use first one
        setActiveOrganizationState(allOrganizations[0])
      }
    } else if (allOrganizations.length > 0 && !activeOrganization) {
      // No saved org, use first one
      setActiveOrganizationState(allOrganizations[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOrganizations])

  const setActiveOrganization = (org: Organization | null) => {
    setActiveOrganizationState(org)
    if (org) {
      localStorage.setItem(STORAGE_KEY, org.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        setActiveOrganization,
        allOrganizations,
        setAllOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider')
  }
  return context
}
