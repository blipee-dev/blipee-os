'use client'

import React, { createContext, useContext, useState } from 'react'
import type { Building } from '@/types/auth'

interface BuildingContextType {
  building: Building | null
  setBuilding: (building: Building) => void
}

const BuildingContext = createContext<BuildingContextType>({
  building: null,
  setBuilding: () => {}
})

export function BuildingProvider({ children }: { children: React.ReactNode }) {
  const [building, setBuilding] = useState<Building | null>(null)

  return (
    <BuildingContext.Provider value={{ building, setBuilding }}>
      {children}
    </BuildingContext.Provider>
  )
}

export function useBuilding() {
  return useContext(BuildingContext)
}